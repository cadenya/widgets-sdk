import { Config } from './resources/config.js';
import { Conversations } from './resources/conversations.js';
export interface ClientOptions {
    /** API key. Defaults to the CADENYAWIDGETS_API_KEY environment variable. */
    apiKey?: string;
    /** Override the API base URL. Defaults to . */
    baseURL?: string;
    /** Max automatic retries for retryable failures. Defaults to 0. */
    maxRetries?: number;
    /**
     * Deadline for ordinary (non-streaming) requests in milliseconds; override
     * per request with `options.timeout`. Streams bound only response-header
     * acquisition — body lifetime stays under the caller's AbortSignal.
     * Defaults to 60000; a non-finite or <= 0 value disables the deadline.
     */
    timeout?: number;
    /** Headers sent with every request. */
    defaultHeaders?: Record<string, string>;
    /** Custom fetch implementation. */
    fetch?: typeof fetch;
}
export declare class CadenyaWidgets {
    readonly config: Config;
    readonly conversations: Conversations;
    private readonly _client;
    constructor(options?: ClientOptions);
}
//# sourceMappingURL=client.d.ts.map