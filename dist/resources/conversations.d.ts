import { HttpClient, RequestOptions, APIPromise } from '../core/http.js';
import { Page } from '../core/pagination.js';
import { Stream } from '../core/sse.js';
import type { WidgetConversation, WidgetEvent } from '../types.js';
export interface ConversationListParams {
    /**
     * Maximum number of results to return.
     */
    limit?: number;
    /**
     * Pagination cursor from previous response.
     */
    cursor?: string;
}
export interface ConversationCreateParams {
    /**
     * The visitor's opening message.
     */
    message: string;
}
export interface ConversationListEventsParams {
    /**
     * Maximum number of results to return.
     */
    limit?: number;
    /**
     * Pagination cursor from previous response.
     */
    cursor?: string;
}
export interface ConversationSubmitFeedbackParams {
    /**
     * A score between -1.0 and 1.0. -1.0 is the worst, 0.0 neutral, 1.0 the
     *  best — a thumbs-down/up UI maps to -1.0/1.0.
     */
    score: number;
    /**
     * Optional comment explaining the feedback.
     */
    comment?: string;
}
export interface ConversationApproveToolCallParams {
    /**
     * The tool call awaiting a decision, from the toolApprovalRequested event.
     */
    toolCallId: string;
}
export interface ConversationDenyToolCallParams {
    /**
     * The tool call awaiting a decision, from the toolApprovalRequested event.
     */
    toolCallId: string;
}
export interface ConversationSetToolCallContentParams {
    /**
     * The bare tool call to supply content for.
     */
    toolCallId: string;
    /**
     * The tool call's result content.
     */
    content: string;
}
export interface ConversationContinueParams {
    /**
     * The visitor's next message.
     */
    message: string;
}
export declare class Conversations {
    private readonly _client;
    constructor(_client: HttpClient);
    /**
     * List conversations
     *
     * @example
     * ```ts
     * const page = await client.conversations.list();
     * for await (const item of page) {
     *   // auto-fetches every page
     * }
     * ```
     */
    list(params?: ConversationListParams, options?: RequestOptions): Promise<Page<WidgetConversation>>;
    /**
     * Start a conversation
     *
     * @example
     * ```ts
     * const widgetConversation = await client.conversations.create({ message: 'sample' });
     * ```
     */
    create(params: ConversationCreateParams, options?: RequestOptions): APIPromise<WidgetConversation>;
    /**
     * Get a conversation
     *
     * @example
     * ```ts
     * const widgetConversation = await client.conversations.retrieve('_123');
     * ```
     */
    retrieve(id: string, options?: RequestOptions): APIPromise<WidgetConversation>;
    /**
     * List conversation events
     *
     * @example
     * ```ts
     * const page = await client.conversations.listEvents('_123');
     * for await (const item of page) {
     *   // auto-fetches every page
     * }
     * ```
     */
    listEvents(id: string, params?: ConversationListEventsParams, options?: RequestOptions): Promise<Page<WidgetEvent>>;
    /**
     * Stream conversation events
     *
     * @example
     * ```ts
     * const stream = await client.conversations.streamEvents('_123');
     * for await (const event of stream) {
     *   // typed event payloads; housekeeping frames are skipped
     * }
     * ```
     */
    streamEvents(id: string, options?: RequestOptions): Promise<Stream<WidgetEvent>>;
    /**
     * Submit conversation feedback
     *
     * @example
     * ```ts
     * await client.conversations.submitFeedback('_123', { score: 1.5 });
     * ```
     */
    submitFeedback(id: string, params: ConversationSubmitFeedbackParams, options?: RequestOptions): APIPromise<void>;
    /**
     * Approve a pending tool call
     *
     * @example
     * ```ts
     * await client.conversations.approveToolCall('_123', { toolCallId: 'tool_call_123' });
     * ```
     */
    approveToolCall(id: string, params: ConversationApproveToolCallParams, options?: RequestOptions): APIPromise<void>;
    /**
     * Deny a pending tool call
     *
     * @example
     * ```ts
     * await client.conversations.denyToolCall('_123', { toolCallId: 'tool_call_123' });
     * ```
     */
    denyToolCall(id: string, params: ConversationDenyToolCallParams, options?: RequestOptions): APIPromise<void>;
    /**
     * Supply a bare tool call's result
     *
     * @example
     * ```ts
     * await client.conversations.setToolCallContent('_123', { toolCallId: 'tool_call_123', content: 'sample' });
     * ```
     */
    setToolCallContent(id: string, params: ConversationSetToolCallContentParams, options?: RequestOptions): APIPromise<void>;
    /**
     * Send the next message
     *
     * @example
     * ```ts
     * const widgetConversation = await client.conversations.continue('_123', { message: 'sample' });
     * ```
     */
    continue(id: string, params: ConversationContinueParams, options?: RequestOptions): APIPromise<WidgetConversation>;
}
//# sourceMappingURL=conversations.d.ts.map