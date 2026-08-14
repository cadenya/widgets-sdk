/** Error model. The API reports failures as a google.rpc.Status payload. */
export interface ErrorStatus {
    code?: number;
    message?: string;
    details?: Array<Record<string, unknown>>;
}
export declare class APIError extends Error {
    readonly status: number;
    readonly code: number | undefined;
    readonly details: Array<Record<string, unknown>> | undefined;
    constructor(status: number, body: ErrorStatus | undefined, message?: string);
}
export declare class APIConnectionError extends Error {
    constructor(cause: unknown);
}
export declare class APIUserAbortError extends Error {
    constructor();
}
/**
 * The request could not be constructed locally (unserializable body, invalid
 * argument). No network attempt was made and the call is never retried.
 */
export declare class APIRequestError extends Error {
    constructor(message: string, cause: unknown);
}
/** The configured request deadline elapsed before the response completed. */
export declare class APITimeoutError extends Error {
    constructor(timeoutMs: number);
}
/**
 * The server answered outside the declared protocol: an empty/null body
 * where a JSON document was promised, malformed JSON, or a 204 on an
 * output-bearing operation.
 */
export declare class APIResponseError extends Error {
    readonly status: number;
    constructor(status: number, message: string, cause?: unknown);
}
//# sourceMappingURL=error.d.ts.map