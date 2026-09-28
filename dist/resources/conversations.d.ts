import { HttpClient, RequestOptions, APIPromise } from '../core/http.js';
import { Page } from '../core/pagination.js';
import { Stream } from '../core/sse.js';
import type { ContinueConversationResponse, WidgetConversation, WidgetConversationServiceListQueuedMessagesState, WidgetEvent, WidgetQueuedMessage } from '../types.js';
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
export interface ConversationListQueuedMessagesParams {
    /**
     * Maximum number of results to return.
     */
    limit?: number;
    /**
     * Pagination cursor from previous response.
     */
    cursor?: string;
    /**
     * Only return messages in this state. When unset, messages in every state are returned.
     */
    state?: WidgetConversationServiceListQueuedMessagesState;
}
export interface ConversationRemoveQueuedMessageParams {
    /**
     * The queued message to remove.
     */
    queuedMessageId: string;
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
    /**
     * When false, the conversation must be open and the message is sent
     *  immediately. When true, an open conversation still receives the message
     *  immediately; a conversation whose agent is responding queues it instead,
     *  and the agent picks it up before its next reply. Queued messages can be
     *  listed and removed until then.
     */
    enqueue?: boolean;
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
     * List queued messages
     *
     * @example
     * ```ts
     * const page = await client.conversations.listQueuedMessages('_123');
     * for await (const item of page) {
     *   // auto-fetches every page
     * }
     * ```
     */
    listQueuedMessages(id: string, params?: ConversationListQueuedMessagesParams, options?: RequestOptions): Promise<Page<WidgetQueuedMessage>>;
    /**
     * Remove a queued message
     *
     * @example
     * ```ts
     * const widgetQueuedMessage = await client.conversations.removeQueuedMessage('_123', { queuedMessageId: 'queued_message_123' });
     * ```
     */
    removeQueuedMessage(id: string, params: ConversationRemoveQueuedMessageParams, options?: RequestOptions): APIPromise<WidgetQueuedMessage>;
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
     * const continueConversationResponse = await client.conversations.continue('_123', { message: 'sample' });
     * ```
     */
    continue(id: string, params: ConversationContinueParams, options?: RequestOptions): APIPromise<ContinueConversationResponse>;
}
//# sourceMappingURL=conversations.d.ts.map