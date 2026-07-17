# 常用模式

这些模式用于在应用增长后继续保持清晰的 Store 所有权。

## 使用 Provider props 初始化

除 `children` 之外的 Provider props 都会传给 Store Hook。

```tsx
const [useDocument, DocumentProvider] = createStore(
  ({ documentId }: { documentId: string }) => {
    const document = useDocumentQuery(documentId)
    return { documentId, document }
  },
)

<DocumentProvider documentId={activeId}>...</DocumentProvider>
```

prop 变化时 Hook 会像普通 React Hook 一样重新运行，并把提交后的快照发布给选中字段发生变化的消费者。

## 只调用一次 SDK Hook

如果 SDK Hook 持有连接或缓存，只在一个 Store 中调用它，然后向消费者投影真正需要的字段。

```tsx
function useStreamStore() {
  const stream = useSdkStream()

  return {
    messages: stream.messages,
    status: stream.status,
    send: stream.send,
  }
}

export const [useStream, StreamProvider] = createStore(useStreamStore)
```

不要在其他平级 Store 中再次调用 `useSdkStream`。它们应该从 `useStream` 选择数据，让应用只保留一条连接和一份缓存。

## 拆分大型 Store

按照所有权、生命周期和更新频率拆分：

- 连接快照属于 Stream Store
- 线程 UI 投影属于 Thread 或 View Store
- 导航与弹窗状态属于 Navigation Store
- 草稿和提交设置属于 Sender Store

依赖图必须保持单向：

```text
Stream → Thread → Sender
   ↑         Navigation
```

这样高频变化的草稿就不会触发只订阅导航或线程投影的消费者。

## 公共动作保持普通函数

Store 暴露的动作就是普通函数。`useEffectEvent` 适合 Effect 内部调用的事件，不用于包装由组件调用的公共回调。

React Compiler 可以稳定它能够证明安全的值。没有 Compiler 时，继续遵循普通 React 引用规则，只在消费者确实依赖稳定引用时做 memo。

## 避免宽泛投影

不要通过选择整个 Store 重新制造全局重渲染域：

```tsx
// 避免
const { store } = useApp(s => ({ store: s }))

// 推荐
const { threadId, selectThread } = useApp(s => ({
  threadId: s.threadId,
  selectThread: s.selectThread,
}))
```
