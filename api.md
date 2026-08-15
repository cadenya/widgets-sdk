# CadenyaWidgets TypeScript SDK reference

Plain methods return an awaitable APIPromise (with `.withResponse()` and
`.asResponse()` for raw Response access); pagination and streaming methods
return a Promise of a Page or Stream. See README.md for usage patterns.

## config

Get widget config

```ts
client.config.retrieveWidget(options?: RequestOptions): APIPromise<WidgetConfig>
```

## conversations

List conversations

```ts
client.conversations.list(params?: ConversationListParams, options?: RequestOptions): Promise<Page<WidgetConversation>>
```
Start a conversation

```ts
client.conversations.create(params: ConversationCreateParams, options?: RequestOptions): APIPromise<WidgetConversation>
```
Get a conversation

```ts
client.conversations.retrieve(id: string, options?: RequestOptions): APIPromise<WidgetConversation>
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
client.conversations.submitFeedback(id: string, params: ConversationSubmitFeedbackParams, options?: RequestOptions): APIPromise<void>
```
Approve a pending tool call

```ts
client.conversations.approveToolCall(id: string, params: ConversationApproveToolCallParams, options?: RequestOptions): APIPromise<void>
```
Deny a pending tool call

```ts
client.conversations.denyToolCall(id: string, params: ConversationDenyToolCallParams, options?: RequestOptions): APIPromise<void>
```
Supply a bare tool call's result

```ts
client.conversations.setToolCallContent(id: string, params: ConversationSetToolCallContentParams, options?: RequestOptions): APIPromise<void>
```
Send the next message

```ts
client.conversations.continue(id: string, params: ConversationContinueParams, options?: RequestOptions): APIPromise<WidgetConversation>
```
