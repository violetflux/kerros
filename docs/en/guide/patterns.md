# Common patterns

These examples show where to mount a Store, how to split one, and when one Store should read another.

## Create instances with Provider props

A document editor can load data from a `documentId` Provider prop:

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

Each Provider creates a Store for its own document:

```tsx
<DocumentProvider documentId="readme">
  <Editor />
</DocumentProvider>

<DocumentProvider documentId="changelog">
  <Preview />
</DocumentProvider>
```

The two instances are isolated. When `documentId` changes, the Store Hook reruns like a normal component and publishes its committed result.

## Advanced: bind an existing headless Store

Most applications should use `createStore`. If an SDK already exposes an authoritative headless Store with stable `getSnapshot` and `subscribe` functions, use `bindStore` instead of copying its snapshot through a Hook Store:

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

Context contains only the stable `stream` instance, and each consumer subscribes directly with its selector. Deep descendants that need an imperative command may read the original instance with `useStreamInstance()`. This Hook does not subscribe to snapshots and must not replace `useStream(selector)` for rendered state.

```tsx
function StreamControls() {
  const stream = useStreamInstance()

  return <button onClick={stream.stop}>Stop</button>
}
```

The owner that creates `stream` remains responsible for creating, starting, stopping, and disposing it. When the owner already has the instance, use it directly instead of routing imperative access through the instance Hook.

No Stream state is synchronized into React. Stream remains the only source of truth; Kerros only adapts its subscription protocol to React rendering.

Do not write `createStore(() => useSyncExternalStore(...))` for an existing Store. That makes the Provider subscribe to the full snapshot and republish it through another container.

## Call a connection-owning SDK Hook once

If `useChatStream` creates an SSE connection and message cache, call it in one Store:

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

The message list selects messages:

```tsx
const { messages } = useStream(s => ({ messages: s.messages }))
```

The stop button selects only its status and action:

```tsx
const { running, stop } = useStream(s => ({
  running: s.running,
  stop: s.stop,
}))
```

Do not call `useChatStream` again in sibling Stores, or the application may create multiple connections and caches.

## Split a chat Store

When one Store owns messages, thread projection, navigation dialogs, and a draft, split it by responsibility:

```text
Stream → Thread
   ├──→ Navigation
   └──→ Sender
```

`Stream` owns the single SDK connection. `Thread` reads messages and builds the current thread view:

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

`Sender` owns the draft and reads the send action:

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

Mount the Providers in dependency order:

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

Typing into the draft publishes only the Sender Store snapshot. Components that only use Thread or Navigation do not update because of it.

## Keep public actions as ordinary functions

Actions called by buttons, forms, or other components can be ordinary functions:

```tsx
const submit = () => {
  send(draft)
}

return { draft, submit }
```

React Compiler may stabilize values it can prove safe. Without Compiler, follow normal React rules and use `useCallback` only where function identity actually matters.

React 19's `useEffectEvent` is for events called from Effects, not for public actions such as `submit`.

## Mount Providers near their owners

Not every Store belongs at the application root:

- theme and account Stores may be application-wide
- a document Store belongs around an editor route
- a form Store belongs around its page or dialog
- a reusable widget may mount its own Provider

Keeping the Provider close to its owner makes the Store's scope and lifetime obvious.
