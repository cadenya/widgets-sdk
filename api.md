# CadenyaWidgets TypeScript SDK reference

Every method returns a Promise; see README.md for usage patterns.

## config

Get widget config

```ts
client.config.retrieveWidget(options?: RequestOptions): Promise<WidgetConfig>
```

## conversations

List conversations

```ts
client.conversations.list(params?: ConversationListParams, options?: RequestOptions): Promise<Page<WidgetConversation>>
```
Start a conversation

```ts
client.conversations.create(params: ConversationCreateParams, options?: RequestOptions): Promise<WidgetConversation>
```
Get a conversation

```ts
client.conversations.retrieve(id: string, options?: RequestOptions): Promise<WidgetConversation>
```
List conversation events

```ts
client.conversations.listEvents(id: string, params?: ConversationListEventsParams, options?: RequestOptions): Promise<Page<WidgetEvent>>
```
Stream conversation events

```ts
client.conversations.streamEvents(id: string, options?: RequestOptions): Promise<Stream<WidgetEvent>>
```
Submit conversation feedback

```ts
client.conversations.submitFeedback(id: string, params: ConversationSubmitFeedbackParams, options?: RequestOptions): Promise<void>
```
Approve a pending tool call

```ts
client.conversations.approveToolCall(id: string, params: ConversationApproveToolCallParams, options?: RequestOptions): Promise<void>
```
Deny a pending tool call

```ts
client.conversations.denyToolCall(id: string, params: ConversationDenyToolCallParams, options?: RequestOptions): Promise<void>
```
Supply a bare tool call's result

```ts
client.conversations.setToolCallContent(id: string, params: ConversationSetToolCallContentParams, options?: RequestOptions): Promise<void>
```
Send the next message

```ts
client.conversations.continue(id: string, params: ConversationContinueParams, options?: RequestOptions): Promise<WidgetConversation>
```
