import { HttpClient, RequestOptions } from '../core/http.js';
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
     */
    list(params?: ConversationListParams, options?: RequestOptions): Promise<Page<WidgetConversation>>;
    /**
     * Start a conversation
     */
    create(params: ConversationCreateParams, options?: RequestOptions): Promise<WidgetConversation>;
    /**
     * Get a conversation
     */
    retrieve(id: string, options?: RequestOptions): Promise<WidgetConversation>;
    /**
     * List conversation events
     */
    listEvents(id: string, params?: ConversationListEventsParams, options?: RequestOptions): Promise<Page<WidgetEvent>>;
    /**
     * Stream conversation events
     */
    streamEvents(id: string, options?: RequestOptions): Promise<Stream<WidgetEvent>>;
    /**
     * Submit conversation feedback
     */
    submitFeedback(id: string, params: ConversationSubmitFeedbackParams, options?: RequestOptions): Promise<void>;
    /**
     * Approve a pending tool call
     */
    approveToolCall(id: string, params: ConversationApproveToolCallParams, options?: RequestOptions): Promise<void>;
    /**
     * Deny a pending tool call
     */
    denyToolCall(id: string, params: ConversationDenyToolCallParams, options?: RequestOptions): Promise<void>;
    /**
     * Supply a bare tool call's result
     */
    setToolCallContent(id: string, params: ConversationSetToolCallContentParams, options?: RequestOptions): Promise<void>;
    /**
     * Send the next message
     */
    continue(id: string, params: ConversationContinueParams, options?: RequestOptions): Promise<WidgetConversation>;
}
//# sourceMappingURL=conversations.d.ts.map