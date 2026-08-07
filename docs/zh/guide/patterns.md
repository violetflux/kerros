# 常用模式

这一页用几个完整场景说明 Store 应该放在哪里、怎么拆，以及什么时候让一个 Store 读取另一个 Store。

## 用 Provider props 创建不同实例

文档编辑器通常需要根据 `documentId` 加载不同内容。把 `documentId` 作为 Provider prop：

```tsx
interface DocumentProps {
  documentId: string
}

function useDocumentStoreValue({ documentId }: DocumentProps) {
  const document = useDocumentQuery(documentId)

  return {
    documentId,
    content: document.data?.content ?? '',
    loading: document.loading,
    save: document.save,
  }
}

const [useDocument, DocumentProvider] = createStore(useDocumentStoreValue)
```

使用时，每个 Provider 都会按自己的 `documentId` 创建 Store：

```tsx
<DocumentProvider documentId="readme">
  <Editor />
</DocumentProvider>

<DocumentProvider documentId="changelog">
  <Preview />
</DocumentProvider>
```

两个实例的数据完全隔离。`documentId` 更新时，Store Hook 会像普通组件一样重新执行，并发布提交后的新结果。

## 高级用法：绑定已有的 Headless Store

绝大多数应用应该使用 `createStore`。如果 SDK 已经提供权威的 Headless Store，并且 `getSnapshot` 和 `subscribe` 引用稳定，才使用 `bindStore`，不要再通过 Hook Store 复制一次快照：

```tsx
const [
  useStream,
  StreamBindingProvider,
  useStreamInstance,
] = bindStore<Stream>('Stream')

<StreamBindingProvider store={stream}>
  <App />
</StreamBindingProvider>
```

Context 只保存稳定的 `stream` 实例，每个组件通过自己的 selector 直接订阅。需要命令式调用的深层后代可以使用 `useStreamInstance()` 读取原实例；这个 Hook 不订阅快照，不能代替 `useStream(selector)` 参与状态渲染。

```tsx
function StreamControls() {
  const stream = useStreamInstance()

  return <button onClick={stream.stop}>停止</button>
}
```

创建 `stream` 的所有者继续负责创建、启动、停止和销毁。所有者已经持有实例时直接使用，不要为了命令式调用再经过实例 Hook。

这里没有把 Stream 状态同步进 React。Stream 仍是唯一状态来源，Kerros 只是把它的订阅协议接入 React 渲染。

不要对已有 Store 使用 `createStore(() => useSyncExternalStore(...))`。这样会让 Provider 订阅完整快照，再通过另一个容器重新发布。

## 只调用一次 SDK Hook

假设 `useChatStream` 会创建 SSE 连接并维护消息缓存，就只在一个 Store 中调用它：

```tsx
function useStreamStoreValue() {
  const stream = useChatStream()

  return {
    messages: stream.messages,
    running: stream.running,
    error: stream.error,
    send: stream.send,
    stop: stream.stop,
  }
}

const [useStream, StreamProvider] = createStore(useStreamStoreValue)
```

消息列表只取消息：

```tsx
const { messages } = useStream(s => ({ messages: s.messages }))
```

停止按钮只取运行状态和动作：

```tsx
const { running, stop } = useStream(s => ({
  running: s.running,
  stop: s.stop,
}))
```

不要在消息列表、输入框和导航 Store 中分别调用 `useChatStream`，否则可能创建多条连接和多份缓存。

## 拆分一个聊天 Store

当一个 Store 同时保存消息、当前线程、导航弹窗和输入草稿时，任何更新都可能生成新的大快照。可以按职责拆开：

```text
Stream → Thread
   ├──→ Navigation
   └──→ Sender
```

`Stream` 持有唯一 SDK 连接。`Thread` 从 Stream 读取消息并生成当前线程视图：

```tsx
function useThreadStoreValue() {
  const { messages } = useStream(s => ({ messages: s.messages }))
  const visibleMessages = useMemo(
    () => messages.filter(message => !message.hidden),
    [messages],
  )

  return { messages: visibleMessages }
}

const [useThread, ThreadProvider] = createStore(useThreadStoreValue)
```

`Sender` 保存输入草稿，并从 Stream 取得发送动作：

```tsx
function useSenderStoreValue() {
  const { send } = useStream(s => ({ send: s.send }))
  const [draft, setDraft] = useState('')

  const submit = () => {
    if (!draft.trim())
      return

    send(draft)
    setDraft('')
  }

  return { draft, setDraft, submit }
}

const [useSender, SenderProvider] = createStore(useSenderStoreValue)
```

最后按依赖顺序挂载：

```tsx
<StreamProvider>
  <ThreadProvider>
    <NavigationProvider>
      <SenderProvider>
        <App />
      </SenderProvider>
    </NavigationProvider>
  </ThreadProvider>
</StreamProvider>
```

输入草稿更新时，只会发布 Sender Store 的快照。只订阅 Thread 或 Navigation 的组件不会因此更新。

## 公共动作直接写普通函数

Store 暴露给按钮、表单或其他组件调用的动作，直接写成普通函数：

```tsx
const submit = () => {
  send(draft)
}

return { draft, submit }
```

如果项目启用了 React Compiler，让 Compiler 处理它能够安全稳定的引用。没有启用 Compiler 时，按照普通 React 规则决定是否需要 `useCallback`。

`useEffectEvent` 只适合 Effect 内部调用的事件，不要用它包装 `submit` 这类公共动作。

## 让 Provider 靠近使用位置

并不是所有 Store 都要放在应用根部：

- 主题、账户等全应用状态可以放在根部
- 文档 Store 放在编辑器路由外层
- 表单 Store 放在弹窗或页面外层
- 可复用组件的 Store 放在组件自己的入口

Provider 越靠近真正的使用位置，Store 的生命周期和作用域就越容易理解。
