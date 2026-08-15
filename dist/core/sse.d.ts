/**
 * Server-sent events over fetch. Parses the wire format incrementally from a
 * ReadableStream — multi-line data, event names, comments, CRLF — with no
 * dependencies. Each event's `data` is JSON-decoded to `T`.
 */
export interface ServerSentEvent<T> {
    event: string | undefined;
    data: T;
    id: string | undefined;
}
export declare class Stream<T> implements AsyncIterable<T> {
    private response;
    private readonly signal?;
    private readonly skipEvents;
    private readonly reconnect?;
    /**
     * The resume checkpoint: seeded from the id this stream was resumed with,
     * then updated by `id:` fields (persistent across events per the SSE
     * spec). Pass it as `options.lastEventId` to resume after a disconnect.
     */
    lastEventId: string | undefined;
    private releaseDeadline;
    /** Server `retry:` hint (ms), used as the reconnection delay when set. */
    private retryHintMs;
    /** Stream-owned cancellation: close() trips it so backoff sleeps and
     * in-flight reconnect handshakes settle immediately. */
    private readonly closer;
    private closed;
    private consumed;
    private activeReader;
    constructor(response: Response, signal?: AbortSignal | undefined, resumedFrom?: string, skipEvents?: readonly string[], reconnect?: ((lastEventId: string | undefined, signal: AbortSignal) => Promise<Response>) | undefined);
    /**
     * Idempotent explicit close: cancels the underlying response body exactly
     * once and detaches deadline state. Safe before iteration (an opened but
     * never-iterated stream would otherwise hold its connection), during
     * iteration from another control path, and after EOF.
     */
    close(): Promise<void>;
    /** Iterate decoded event payloads. */
    [Symbol.asyncIterator](): AsyncIterator<T>;
    /** Iterate full events (name + id + decoded data). */
    events(): AsyncGenerator<ServerSentEvent<T>>;
}
//# sourceMappingURL=sse.d.ts.map