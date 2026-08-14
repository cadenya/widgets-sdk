/**
 * Minimal, dependency-less HTTP core built on global fetch (Node 18+,
 * browsers, Deno, Bun). Handles auth, query serialization, retries with
 * backoff, timeouts, and error mapping.
 */
export interface RequestOptions {
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
export declare class HttpClient {
    private readonly baseURL;
    private readonly authHeader;
    private readonly maxRetries;
    private readonly timeout;
    private readonly defaultHeaders;
    private readonly fetchFn;
    readonly defaults: Record<string, string | undefined>;
    constructor(options: HttpClientOptions);
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