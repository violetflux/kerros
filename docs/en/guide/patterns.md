# Common patterns

These examples show where to mount a Store, how to split one, and when one Store should read another.

## Create instances with Provider props

A document editor can load data from a `documentId` Provider prop:

```tsx
interface DocumentProps {
  documentId: string
}

const [useDocument, DocumentProvider] = createStore(
  ({ documentId }: DocumentProps) => {
    const document = useDocumentQuery(documentId)

    return {
      documentId,
      content: document.data?.content ?? '',
      loading: document.loading,
      save: document.save,
    }
  },
)
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

## Call a connection-owning SDK Hook once

If `useChatStream` creates an SSE connection and message cache, call it in one Store:

```tsx
const [useStream, StreamProvider] = createStore(() => {
  const stream = useChatStream()

  return {
    messages: stream.messages,
    running: stream.running,
    error: stream.error,
    send: stream.send,
    stop: stream.stop,
  }
})
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
const [useThread, ThreadProvider] = createStore(() => {
  const { messages } = useStream(s => ({ messages: s.messages }))
  const visibleMessages = useMemo(
    () => messages.filter(message => !message.hidden),
    [messages],
  )

  return { messages: visibleMessages }
})
```

`Sender` owns the draft and reads the send action:

```tsx
const [useSender, SenderProvider] = createStore(() => {
  const { send } = useStream(s => ({ send: s.send }))
  const [draft, setDraft] = useState('')

  const submit = () => {
    if (!draft.trim())
      return

    send(draft)
    setDraft('')
  }

  return { draft, setDraft, submit }
})
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
