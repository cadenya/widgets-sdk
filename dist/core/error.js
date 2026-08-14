/** Error model. The API reports failures as a google.rpc.Status payload. */
export class APIError extends Error {
    status;
    code;
    details;
    constructor(status, body, message) {
        super(message ?? body?.message ?? `HTTP ${status}`);
        this.name = 'APIError';
        this.status = status;
        this.code = body?.code;
        this.details = body?.details;
    }
}
export class APIConnectionError extends Error {
    constructor(cause) {
        super('Connection error', { cause });
        this.name = 'APIConnectionError';
    }
}
export class APIUserAbortError extends Error {
    constructor() {
        super('Request was aborted');
        this.name = 'APIUserAbortError';
    }
}
/**
 * The request could not be constructed locally (unserializable body, invalid
 * argument). No network attempt was made and the call is never retried.
 */
export class APIRequestError extends Error {
    constructor(message, cause) {
        super(message, { cause });
        this.name = 'APIRequestError';
    }
}
/** The configured request deadline elapsed before the response completed. */
export class APITimeoutError extends Error {
    constructor(timeoutMs) {
        super(`Request timed out after ${timeoutMs}ms`);
        this.name = 'APITimeoutError';
    }
}
/**
 * The server answered outside the declared protocol: an empty/null body
 * where a JSON document was promised, malformed JSON, or a 204 on an
 * output-bearing operation.
 */
export class APIResponseError extends Error {
    status;
    constructor(status, message, cause) {
        super(message, cause === undefined ? undefined : { cause });
        this.name = 'APIResponseError';
        this.status = status;
    }
}
//# sourceMappingURL=error.js.map