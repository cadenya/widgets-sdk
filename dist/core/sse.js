/**
 * Server-sent events over fetch. Parses the wire format incrementally from a
 * ReadableStream — multi-line data, event names, comments, CRLF — with no
 * dependencies. Each event's `data` is JSON-decoded to `T`.
 */
import { APIConnectionError, APIResponseError, APIUserAbortError } from './error.js';
import { takeStreamCleanup } from './http.js';
export class Stream {
    response;
    signal;
    skipEvents;
    reconnect;
    /**
     * The resume checkpoint: seeded from the id this stream was resumed with,
     * then updated by `id:` fields (persistent across events per the SSE
     * spec). Pass it as `options.lastEventId` to resume after a disconnect.
     */
    lastEventId;
    releaseDeadline;
    /** Server `retry:` hint (ms), used as the reconnection delay when set. */
    retryHintMs;
    /** Stream-owned cancellation: close() trips it so backoff sleeps and
     * in-flight reconnect handshakes settle immediately. */
    closer = new AbortController();
    closed = false;
    consumed = false;
    activeReader;
    constructor(response, signal, resumedFrom, 
    // Transport-housekeeping event names (`event:` field) skipped without
    // decoding; their `id:` fields still advance the resume checkpoint.
    skipEvents = [], 
    // Re-issues the request with the current resume checkpoint. When set,
    // a MID-STREAM transport drop reconnects automatically (like the
    // platform's EventSource): bounded attempts, backoff honoring the
    // server's `retry:` hint, counter reset once events flow again. A clean
    // EOF, an explicit close(), and a caller abort NEVER reconnect.
    reconnect) {
        this.response = response;
        this.signal = signal;
        this.skipEvents = skipEvents;
        this.reconnect = reconnect;
        this.lastEventId = resumedFrom;
        this.releaseDeadline = takeStreamCleanup(response);
    }
    /**
     * Idempotent explicit close: cancels the underlying response body exactly
     * once and detaches deadline state. Safe before iteration (an opened but
     * never-iterated stream would otherwise hold its connection), during
     * iteration from another control path, and after EOF.
     */
    async close() {
        if (this.closed)
            return;
        this.closed = true;
        this.closer.abort();
        if (this.activeReader) {
            // The body is LOCKED to the active reader: body.cancel() would
            // reject, silently doing nothing. Cancel the reader itself — the
            // pending read() settles, the generator's finally runs the terminal
            // cleanup (deadline release included), and the consumer unblocks.
            try {
                await this.activeReader.cancel();
            }
            catch {
                // Reader already errored/released; the generator finally cleans up.
            }
            return;
        }
        // Pre-iteration close: no reader owns the body yet.
        this.releaseDeadline?.();
        try {
            await this.response.body?.cancel();
        }
        catch {
            // Already closed.
        }
    }
    /** Iterate decoded event payloads. */
    async *[Symbol.asyncIterator]() {
        for await (const event of this.events()) {
            yield event.data;
        }
    }
    /** Iterate full events (name + id + decoded data). */
    async *events() {
        // One Stream wraps exactly one response body. The consumed transition
        // is synchronous (before any await/getReader), so a competing second
        // iterator — concurrent or after EOF/error — deterministically gets the
        // stable SDK error instead of a raw locked-stream TypeError or a silent
        // empty sequence. A closed-but-never-consumed stream still ends empty.
        if (this.closed && !this.consumed)
            return;
        if (this.consumed) {
            throw new Error('stream already consumed — reconnect with a new call passing { lastEventId: stream.lastEventId }');
        }
        this.consumed = true;
        const firstBody = this.response.body;
        if (!firstBody)
            throw new Error('SSE response has no body');
        // Connection-local: a reconnect swaps in a FRESH decoder, so a partial
        // UTF-8 code point from the dead connection cannot corrupt the first
        // resumed event.
        let decoder = new TextDecoder();
        let reader = firstBody.getReader();
        this.activeReader = reader;
        let buffer = '';
        let dataLines = [];
        let eventName;
        // Consecutive failed reconnects; reset whenever a chunk arrives.
        let reconnectAttempts = 0;
        const MAX_RECONNECTS = 5;
        // A mid-stream transport drop swaps in a fresh connection resumed from
        // the checkpoint. Partial buffered lines from the dead connection are
        // DISCARDED — the server re-sends everything after Last-Event-ID.
        const tryReconnect = async () => {
            while (this.reconnect && !this.closed && !this.signal?.aborted && reconnectAttempts < MAX_RECONNECTS) {
                const delay = this.retryHintMs ?? Math.min(500 * 2 ** reconnectAttempts, 10_000);
                reconnectAttempts++;
                // Abortable sleep: BOTH the caller's signal and the stream's own
                // closer wake it, and listeners are removed on every exit path so a
                // long-lived flapping stream cannot accumulate them.
                await new Promise((resolve) => {
                    const finish = () => {
                        clearTimeout(timer);
                        this.signal?.removeEventListener('abort', finish);
                        this.closer.signal.removeEventListener('abort', finish);
                        resolve();
                    };
                    const timer = setTimeout(finish, delay);
                    this.signal?.addEventListener('abort', finish);
                    this.closer.signal.addEventListener('abort', finish);
                });
                if (this.closed || this.signal?.aborted)
                    return false;
                let next;
                try {
                    next = await this.reconnect(this.lastEventId, this.closer.signal);
                }
                catch (err) {
                    if (this.closed)
                        return false;
                    // A TRANSPORT handshake failure (server restarting, connection
                    // refused) consumes budget and retries; an HTTP-level failure
                    // (e.g. expired credentials -> APIError) propagates immediately —
                    // reconnecting cannot fix it and must not mask it.
                    if (err instanceof APIConnectionError)
                        continue;
                    throw err;
                }
                if (this.closed) {
                    void next.body?.cancel().catch(() => { });
                    return false;
                }
                // Release the SUPERSEDED connection completely: cancel its reader
                // (unlocking the old body) and its deadline cleanup, exactly once.
                try {
                    await reader.cancel();
                }
                catch {
                    // Dead reader.
                }
                reader.releaseLock();
                this.releaseDeadline?.();
                this.response = next;
                this.releaseDeadline = takeStreamCleanup(next);
                const nextBody = next.body;
                if (!nextBody)
                    throw new Error('SSE response has no body');
                reader = nextBody.getReader();
                this.activeReader = reader;
                buffer = '';
                dataLines = [];
                eventName = undefined;
                decoder = new TextDecoder();
                return true;
            }
            return false;
        };
        const flush = () => {
            if (dataLines.length === 0)
                return undefined;
            const raw = dataLines.join('\n');
            dataLines = [];
            const name = eventName;
            eventName = undefined;
            // Housekeeping frames (e.g. ping/open) never reach the consumer and
            // never JSON-decode - but their id: has already advanced the resume
            // checkpoint above.
            if (name !== undefined && this.skipEvents.includes(name))
                return undefined;
            let data;
            try {
                data = JSON.parse(raw);
            }
            catch (err) {
                // Malformed event JSON is a PROTOCOL error, distinct from transport
                // failure.
                throw new APIResponseError(this.response.status, 'SSE event data is not valid JSON', err);
            }
            // Per the SSE spec the last-event-ID buffer persists across events
            // until another `id:` field changes it (an empty one resets it).
            return { event: name, data, id: this.lastEventId };
        };
        // WHATWG event streams terminate lines with LF, CRLF, OR bare CR; a CR
        // at a chunk boundary must wait for the next chunk to see whether an LF
        // follows (CRLF is one terminator, never two).
        const nextLine = (atEof) => {
            for (let i = 0; i < buffer.length; i++) {
                const ch = buffer[i];
                if (ch === '\n') {
                    const line = buffer.slice(0, i);
                    buffer = buffer.slice(i + 1);
                    return line;
                }
                if (ch === '\r') {
                    if (i + 1 < buffer.length) {
                        const line = buffer.slice(0, i);
                        buffer = buffer.slice(buffer[i + 1] === '\n' ? i + 2 : i + 1);
                        return line;
                    }
                    if (atEof) {
                        const line = buffer.slice(0, i);
                        buffer = '';
                        return line;
                    }
                    return null; // possible CRLF split across chunks
                }
            }
            return null;
        };
        const processLine = (line) => {
            if (line === '')
                return flush();
            if (line.startsWith(':'))
                return undefined; // comment / keep-alive
            const colonAt = line.indexOf(':');
            const field = colonAt === -1 ? line : line.slice(0, colonAt);
            let value = colonAt === -1 ? '' : line.slice(colonAt + 1);
            if (value.startsWith(' '))
                value = value.slice(1);
            switch (field) {
                case 'data':
                    dataLines.push(value);
                    break;
                case 'event':
                    eventName = value;
                    break;
                case 'id':
                    // Per the event-stream algorithm, ids containing U+0000 are
                    // ignored entirely; an empty id resets the buffer.
                    if (!value.includes('\0')) {
                        this.lastEventId = value === '' ? undefined : value;
                    }
                    break;
                case 'retry':
                    // Reconnection-delay hint; honored when auto-reconnect is active.
                    if (/^[0-9]+$/.test(value))
                        this.retryHintMs = Math.min(Number(value), 60_000);
                    break;
            }
            return undefined;
        };
        try {
            while (true) {
                if (this.signal?.aborted)
                    throw new APIUserAbortError();
                let done;
                let value;
                try {
                    ({ done, value } = await reader.read());
                }
                catch (err) {
                    // A user abort mid-read surfaces as a raw AbortError DOMException;
                    // the public contract is APIUserAbortError regardless of when the
                    // abort lands. Partial buffered events are NOT flushed. Any other
                    // read failure is a transport failure — auto-reconnect resumes
                    // from the checkpoint when configured; otherwise the public
                    // contract is APIConnectionError before AND after response
                    // headers, never a runtime-specific error shape.
                    if (this.signal?.aborted)
                        throw new APIUserAbortError();
                    if (this.closed)
                        break;
                    if (await tryReconnect())
                        continue;
                    if (this.closed || this.signal?.aborted)
                        break;
                    throw new APIConnectionError(err);
                }
                // Re-check AFTER every awaited read: a chunk that arrives
                // concurrently with close() must not be processed.
                if (this.closed)
                    break;
                if (done)
                    break;
                // Bytes flowing again: the reconnect budget is per-outage.
                reconnectAttempts = 0;
                buffer += decoder.decode(value, { stream: true });
                let line;
                while ((line = nextLine(false)) !== null) {
                    const event = processLine(line);
                    if (event)
                        yield event;
                }
            }
            // The stream may end without a trailing newline: the leftover buffer
            // is still line data and must be parsed, not dropped.
            buffer += decoder.decode();
            let tail;
            while ((tail = nextLine(true)) !== null) {
                const event = processLine(tail);
                if (event)
                    yield event;
            }
            if (buffer !== '') {
                const event = processLine(buffer);
                if (event)
                    yield event;
            }
            // Spec-compliant servers end with a blank line, but flush a trailing
            // event if the stream closed without one.
            const last = flush();
            if (last)
                yield last;
        }
        finally {
            // EVERY terminal path — EOF, decode error, transport error, caller
            // abort, explicit close, early consumer return — releases the
            // deadline listener and the body exactly once.
            this.closed = true;
            this.activeReader = undefined;
            this.releaseDeadline?.();
            try {
                await reader.cancel();
            }
            catch {
                // Already cancelled/errored.
            }
            reader.releaseLock();
            try {
                // The CURRENT connection's body (reconnects swap this.response).
                await this.response.body?.cancel();
            }
            catch {
                // Already closed.
            }
        }
    }
}
//# sourceMappingURL=sse.js.map