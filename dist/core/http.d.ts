/**
 * Minimal, dependency-less HTTP core built on global fetch (Node 18+,
 * browsers, Deno, Bun). Handles auth, query serialization, retries with
 * backoff, timeouts, and error mapping.
 */
export interface RequestOptions {
    /**
     * Auto-reconnect for SSE streams (default true): a mid-stream transport
     * drop resumes from the last received event id, like EventSource. Clean
     * stream end, close(), and abort never reconnect. Set false to surface
     * drops as APIConnectionError instead.
     */
    reconnect?: boolean;
    headers?: Record<string, string>;
    signal?: AbortSignal;
    maxRetries?: number;
    /**
     * Per-request deadline in milliseconds (overrides the client default).
     * Non-finite or <= 0 disables the deadline for this request.
     */
    timeout?: number;
    /**
     * For streaming (SSE) requests: resume after the event with this id by
     * sending it as the Last-Event-ID request header.
     */
    lastEventId?: string;
}
export type QueryPrimitive = string | number | boolean;
export type QueryValue = QueryPrimitive | QueryPrimitive[] | undefined | null;
export interface RequestSpec {
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    path: string;
    query?: Record<string, QueryValue>;
    body?: unknown;
    stream?: boolean;
    /** The operation declares no response body (void): 204/empty succeed. */
    void?: boolean;
}
export type LogLevel = 'debug' | 'warn' | 'off';
/** Minimal logger surface; `console` satisfies it. */
export interface Logger {
    debug(...args: unknown[]): void;
    warn(...args: unknown[]): void;
}
export interface HttpClientOptions {
    baseURL: string;
    authHeader: () => Record<string, string>;
    maxRetries?: number;
    /** Deadline for ordinary (non-streaming) requests in ms. Default 60000. */
    timeout?: number;
    defaultHeaders?: Record<string, string>;
    fetch?: typeof fetch;
    /** Client-level default values for prominent params (e.g. a tenant/scope id). */
    defaults?: Record<string, string | undefined>;
    /** Destination for SDK logs. Defaults to `console`. */
    logger?: Logger;
    /**
     * 'debug' logs every request/response line (method, path, status,
     * duration — never headers or bodies); 'warn' (default) logs only
     * retries; 'off' silences the SDK entirely.
     */
    logLevel?: LogLevel;
}
/**
 * Encode one path segment, rejecting empty/whitespace values at the boundary
 * — an empty segment would silently rewrite the route (/parents//children).
 */
export declare function pathSegment(name: string, value: string | undefined): string;
/**
 * Snapshot list params at call time so pagination cannot observe later
 * caller mutations (array-valued filters are copied too). Auto-iteration
 * must never combine pages from different result sets.
 */
export declare function snapshotParams<T>(params: T): T;
/** Claim (and remove) the cleanup registered for a streaming response. */
export declare function takeStreamCleanup(response: Response): (() => void) | undefined;
/**
 * A lazily-parsing promise for one API call. Awaiting it (or `.then`) yields
 * the decoded value exactly like a plain promise; `withResponse()` yields the
 * decoded value together with the raw `Response` (status, headers); and
 * `asResponse()` yields the raw `Response` WITHOUT consuming the body, so
 * the caller owns reading it.
 */
export declare class APIPromise<T> implements Promise<T> {
    private readonly responsePromise;
    private readonly parseFn;
    private readonly onRawAccess;
    private parsed;
    private observedRaw;
    constructor(responsePromise: Promise<Response>, parseFn: (response: Response) => Promise<T>, onRawAccess: () => void);
    /**
     * The raw `Response` after status checking and retries; the body is NOT
     * consumed. Reading the body (and its timing) becomes the caller's
     * responsibility — the request deadline stops at header acquisition.
     */
    asResponse(): Promise<Response>;
    /** The decoded value together with the `Response` its body came from. */
    withResponse(): Promise<{
        data: T;
        response: Response;
    }>;
    private parse;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null, onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null): Promise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: unknown) => TResult | PromiseLike<TResult>) | null): Promise<T | TResult>;
    finally(onfinally?: (() => void) | null): Promise<T>;
    readonly [Symbol.toStringTag] = "APIPromise";
}
export declare class HttpClient {
    private readonly baseURL;
    private readonly authHeader;
    private readonly maxRetries;
    private readonly timeout;
    private readonly defaultHeaders;
    private readonly fetchFn;
    private readonly logger;
    private readonly logLevel;
    /** Method + path + status only — headers and bodies are never logged. */
    private logDebug;
    private logWarn;
    readonly defaults: Record<string, string | undefined>;
    constructor(options: HttpClientOptions);
    /**
     * The APIPromise pipeline for JSON and void operations. The spec thunk
     * runs inside the async context so synchronous setup failures (e.g. a
     * missing client-default param) surface as rejections, exactly like the
     * plain-promise path. The deadline spans fetch through decode; raw-access
     * consumers release it at header acquisition and own body timing.
     */
    requestAPI<T>(makeSpec: () => RequestSpec, options?: RequestOptions): APIPromise<T>;
    request<T>(spec: RequestSpec, options?: RequestOptions): Promise<T>;
    rawRequest(spec: RequestSpec, options?: RequestOptions): Promise<Response>;
    /**
     * Merge the caller's signal with the configured deadline. The caller's
     * abort always forwards; the timer marks timedOut so the thrown error can
     * be classified as APITimeoutError rather than APIUserAbortError.
     */
    private deadline;
    private buildURL;
}
//# sourceMappingURL=http.d.ts.map