/**
 * Minimal, dependency-less HTTP core built on global fetch (Node 18+,
 * browsers, Deno, Bun). Handles auth, query serialization, retries with
 * backoff, timeouts, and error mapping.
 */
import { APIConnectionError, APIError, APIRequestError, APIResponseError, APITimeoutError, APIUserAbortError, } from './error.js';
const RETRYABLE_STATUS = new Set([408, 409, 429, 500, 502, 503, 504]);
const DEFAULT_TIMEOUT_MS = 60_000;
/**
 * Encode one path segment, rejecting empty/whitespace values at the boundary
 * — an empty segment would silently rewrite the route (/parents//children).
 */
export function pathSegment(name, value) {
    if (value === undefined || String(value).trim() === '') {
        throw new Error(`Missing required path parameter '${name}'.`);
    }
    return encodeURIComponent(value);
}
/**
 * Snapshot list params at call time so pagination cannot observe later
 * caller mutations (array-valued filters are copied too). Auto-iteration
 * must never combine pages from different result sets.
 */
export function snapshotParams(params) {
    if (params === undefined || params === null || typeof params !== 'object')
        return params;
    const copy = {};
    for (const [key, value] of Object.entries(params)) {
        copy[key] = Array.isArray(value) ? value.slice() : value;
    }
    return copy;
}
/**
 * Automatic retries apply only to idempotent methods. A POST/PATCH that
 * succeeds server-side but loses its response would be executed twice if
 * retried; callers can opt a specific mutation in via options.maxRetries.
 */
const IDEMPOTENT_METHODS = new Set(['GET', 'HEAD', 'PUT', 'DELETE']);
/**
 * Settle when the promise settles OR the signal aborts — a custom fetch (or
 * body reader) that ignores AbortSignal must not be able to hold a deadlined
 * request open forever. The orphaned promise's eventual rejection is
 * swallowed; its resolution is discarded.
 */
function raceAbort(promise, signal) {
    if (!signal)
        return promise;
    return new Promise((resolve, reject) => {
        const onAbort = () => {
            promise.catch(() => { });
            reject(new APIUserAbortError());
        };
        if (signal.aborted) {
            onAbort();
            return;
        }
        signal.addEventListener('abort', onAbort, { once: true });
        promise.then((value) => {
            signal.removeEventListener('abort', onAbort);
            resolve(value);
        }, (err) => {
            signal.removeEventListener('abort', onAbort);
            reject(err);
        });
    });
}
/**
 * Deadline cleanup for streaming responses, handed from rawRequest to the
 * Stream that owns the body. The forwarding listener must survive until the
 * stream terminates (a caller abort has to unblock a pending read on a
 * silent socket), so the Stream — not rawRequest — releases it.
 */
const streamCleanups = new WeakMap();
/** Claim (and remove) the cleanup registered for a streaming response. */
export function takeStreamCleanup(response) {
    const cleanup = streamCleanups.get(response);
    streamCleanups.delete(response);
    return cleanup;
}
export class HttpClient {
    baseURL;
    authHeader;
    maxRetries;
    timeout;
    defaultHeaders;
    fetchFn;
    defaults;
    constructor(options) {
        this.defaults = options.defaults ?? {};
        // Validate the STRUCTURE once: operation paths are appended to this
        // value, so a query/fragment/userinfo would silently swallow the
        // request path. Absolute http(s) with a host is required; a path
        // prefix is supported and kept.
        // A literal delimiter parses as an EMPTY search/hash and slips past
        // the checks below; reject the characters outright.
        if (options.baseURL.includes('?') || options.baseURL.includes('#')) {
            throw new Error(`baseURL '${options.baseURL}' must not carry userinfo, query, or fragment`);
        }
        let parsed;
        try {
            parsed = new URL(options.baseURL);
        }
        catch (err) {
            throw new Error(`baseURL '${options.baseURL}' is not an absolute URL`, { cause: err });
        }
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
            throw new Error(`baseURL '${options.baseURL}' must use http or https`);
        }
        if (parsed.hostname === '') {
            throw new Error(`baseURL '${options.baseURL}' has no host`);
        }
        if (parsed.username !== '' || parsed.password !== '' || parsed.search !== '' || parsed.hash !== '') {
            throw new Error(`baseURL '${options.baseURL}' must not carry userinfo, query, or fragment`);
        }
        this.baseURL = (parsed.origin + parsed.pathname).replace(/\/+$/, '');
        this.authHeader = options.authHeader;
        this.maxRetries = options.maxRetries ?? 0;
        this.timeout = options.timeout ?? DEFAULT_TIMEOUT_MS;
        this.defaultHeaders = options.defaultHeaders ?? {};
        this.fetchFn = options.fetch ?? fetch;
    }
    async request(spec, options = {}) {
        // Ordinary JSON calls keep the deadline through body consumption and
        // decoding — a response that stalls mid-body still times out.
        const deadline = this.deadline(options);
        try {
            const response = await this.rawRequest(spec, { ...options, signal: deadline.signal });
            // Branch on the GENERATED expectation, not the HTTP status: a void
            // method accepts 204/empty, but an output-bearing method requires a
            // JSON document — empty/null would fabricate a resource outside the
            // declared contract, and malformed JSON must be a stable SDK error.
            if (spec.void) {
                void response.body?.cancel().catch(() => { });
                return undefined;
            }
            if (response.status === 204) {
                throw new APIResponseError(204, 'HTTP 204 where a JSON response was expected');
            }
            const text = await raceAbort(response.text(), deadline.signal);
            if (text.trim() === '' || text.trim() === 'null') {
                throw new APIResponseError(response.status, `HTTP ${response.status} with an empty or null body where a JSON response was expected`);
            }
            try {
                return JSON.parse(text);
            }
            catch (err) {
                throw new APIResponseError(response.status, 'response body is not valid JSON', err);
            }
        }
        catch (err) {
            if (deadline.timedOut())
                throw new APITimeoutError(deadline.ms);
            throw err;
        }
        finally {
            deadline.settle();
            deadline.release();
        }
    }
    async rawRequest(spec, options = {}) {
        const url = this.buildURL(spec.path, spec.query);
        // One Headers instance; `set` is case-insensitive, so later layers
        // OVERRIDE earlier ones regardless of spelling (object spread would keep
        // both `Authorization` and `authorization` and fetch would join the two
        // values into one corrupt header). Precedence: generated defaults →
        // client defaults → auth → per-request → Last-Event-ID (the semantic
        // option is the single source of resume state).
        const headers = new Headers();
        headers.set('Accept', spec.stream ? 'text/event-stream' : 'application/json');
        if (spec.body !== undefined)
            headers.set('Content-Type', 'application/json');
        for (const [key, value] of Object.entries(this.defaultHeaders))
            headers.set(key, value);
        for (const [key, value] of Object.entries(this.authHeader()))
            headers.set(key, value);
        for (const [key, value] of Object.entries(options.headers ?? {}))
            headers.set(key, value);
        if (options.lastEventId !== undefined) {
            headers.set('Last-Event-ID', options.lastEventId);
        }
        // Serialize ONCE, before the transport/retry loop: a circular object or
        // BigInt is a caller bug, not a network failure — it must surface as a
        // stable request-construction error and never be retried.
        let bodyText;
        if (spec.body !== undefined) {
            try {
                bodyText = JSON.stringify(spec.body);
            }
            catch (err) {
                throw new APIRequestError('request body is not JSON-serializable', err);
            }
            if (bodyText === undefined) {
                throw new APIRequestError('request body serialized to undefined', undefined);
            }
        }
        // Streams bound only connection/response-header acquisition; the body's
        // lifetime stays under the caller's AbortSignal.
        const streamDeadline = spec.stream ? this.deadline(options) : undefined;
        const signal = streamDeadline ? streamDeadline.signal : options.signal;
        // An explicit per-request maxRetries opts in even for mutations.
        const maxRetries = normalizeRetries(options.maxRetries !== undefined
            ? options.maxRetries
            : IDEMPOTENT_METHODS.has(spec.method)
                ? this.maxRetries
                : 0);
        for (let attempt = 0;; attempt++) {
            let response;
            try {
                response = await raceAbort(this.fetchFn(url, {
                    method: spec.method,
                    headers,
                    body: bodyText,
                    signal: signal ?? null,
                }), signal);
            }
            catch (err) {
                if (streamDeadline?.timedOut()) {
                    streamDeadline.settle();
                    streamDeadline.release();
                    throw new APITimeoutError(streamDeadline.ms);
                }
                if (signal?.aborted) {
                    streamDeadline?.settle();
                    streamDeadline?.release();
                    throw new APIUserAbortError();
                }
                if (attempt < maxRetries) {
                    await sleep(backoffMs(attempt, undefined), signal);
                    if (streamDeadline?.timedOut()) {
                        streamDeadline.settle();
                        streamDeadline.release();
                        throw new APITimeoutError(streamDeadline.ms);
                    }
                    if (signal?.aborted)
                        throw new APIUserAbortError();
                    continue;
                }
                // Terminal connection failure: the deadline timer must not outlive
                // the reported error (an orphaned timer holds the process open).
                streamDeadline?.settle();
                streamDeadline?.release();
                throw new APIConnectionError(err);
            }
            if (response.ok) {
                // Response headers acquired: the stream body is now unbounded. The
                // forwarding listener stays attached (caller abort must reach the
                // body); the Stream releases it at its terminal state.
                if (streamDeadline) {
                    streamDeadline.settle();
                    streamCleanups.set(response, () => streamDeadline.release());
                }
                return response;
            }
            if (RETRYABLE_STATUS.has(response.status) && attempt < maxRetries) {
                // Release the discarded response so its connection can be reused.
                void response.body?.cancel().catch(() => { });
                await sleep(backoffMs(attempt, response.headers.get('retry-after')), signal);
                // A stream deadline that fired during backoff is a timeout, not a
                // user abort — rawRequest has no outer mapper to reclassify it.
                if (streamDeadline?.timedOut()) {
                    streamDeadline.settle();
                    streamDeadline.release();
                    throw new APITimeoutError(streamDeadline.ms);
                }
                if (signal?.aborted)
                    throw new APIUserAbortError();
                continue;
            }
            let body;
            try {
                body = (await response.json());
            }
            catch {
                body = undefined;
            }
            // The deadline stays active while consuming a non-2xx error body; if
            // it expired there, report the timeout rather than a truncated
            // APIError.
            if (streamDeadline?.timedOut()) {
                streamDeadline.settle();
                streamDeadline.release();
                throw new APITimeoutError(streamDeadline.ms);
            }
            streamDeadline?.settle();
            streamDeadline?.release();
            throw new APIError(response.status, body);
        }
    }
    /**
     * Merge the caller's signal with the configured deadline. The caller's
     * abort always forwards; the timer marks timedOut so the thrown error can
     * be classified as APITimeoutError rather than APIUserAbortError.
     */
    deadline(options) {
        const ms = options.timeout ?? this.timeout;
        if (!Number.isFinite(ms) || ms <= 0) {
            return { signal: options.signal, settle() { }, release() { }, timedOut: () => false, ms };
        }
        const controller = new AbortController();
        let timedOut = false;
        const timer = setTimeout(() => {
            timedOut = true;
            controller.abort();
        }, ms);
        const forward = () => controller.abort();
        if (options.signal?.aborted) {
            controller.abort();
        }
        else {
            options.signal?.addEventListener('abort', forward, { once: true });
        }
        let settled = false;
        let released = false;
        return {
            signal: controller.signal,
            settle() {
                if (settled)
                    return;
                settled = true;
                clearTimeout(timer);
            },
            release() {
                if (released)
                    return;
                released = true;
                options.signal?.removeEventListener('abort', forward);
            },
            timedOut: () => timedOut,
            ms,
        };
    }
    buildURL(path, query) {
        const url = new URL(this.baseURL + path);
        for (const [key, value] of Object.entries(query ?? {})) {
            if (value === undefined || value === null)
                continue;
            // Arrays serialize as repeated params: ?state=a&state=b
            for (const item of Array.isArray(value) ? value : [value]) {
                url.searchParams.append(key, String(item));
            }
        }
        return url.toString();
    }
}
/** Retry counts must be bounded non-negative integers; anything else (NaN,
 * Infinity, negatives, fractions) is treated as the nearest sane value. */
function normalizeRetries(value) {
    if (!Number.isFinite(value) || value <= 0)
        return 0;
    return Math.min(Math.floor(value), 10);
}
function backoffMs(attempt, retryAfter) {
    if (retryAfter) {
        // Retry-After is either delta-seconds or an HTTP-date. A parsed zero is
        // a real answer (retry immediately), not a fall-through to backoff.
        const seconds = Number(retryAfter);
        if (Number.isFinite(seconds) && seconds >= 0)
            return Math.min(seconds * 1000, 60_000);
        const date = Date.parse(retryAfter);
        if (Number.isFinite(date)) {
            return Math.min(Math.max(date - Date.now(), 0), 60_000);
        }
    }
    const base = 500 * 2 ** Math.min(attempt, 4);
    return Math.min(base + Math.random() * base, 8000);
}
/** Sleep that wakes early when the signal aborts (caller re-checks it). */
function sleep(ms, signal) {
    return new Promise((resolve) => {
        if (signal?.aborted)
            return resolve();
        const timer = setTimeout(() => {
            signal?.removeEventListener('abort', onAbort);
            resolve();
        }, ms);
        const onAbort = () => {
            clearTimeout(timer);
            resolve();
        };
        signal?.addEventListener('abort', onAbort, { once: true });
    });
}
//# sourceMappingURL=http.js.map