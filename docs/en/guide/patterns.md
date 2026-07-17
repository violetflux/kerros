# Patterns

These patterns keep Store ownership clear as an application grows.

## Initialize from Provider props

The Store Hook receives every Provider prop except `children`.

```tsx
const [useDocument, DocumentProvider] = createStore(
  ({ documentId }: { documentId: string }) => {
    const document = useDocumentQuery(documentId)
    return { documentId, document }
  },
)

<DocumentProvider documentId={activeId}>...</DocumentProvider>
```

Changing a prop reruns the Hook normally and publishes the committed snapshot to selected subscribers.

## Wrap an SDK Hook once

When an SDK Hook owns a connection or cache, call it in one Store and project only the fields consumers need.

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

Do not also call `useSdkStream` in sibling Stores. Select from `useStream` so the application keeps one connection and one cache.

## Split a large Store

Split by ownership, lifetime, and update frequency:

- connection snapshots belong to a Stream Store
- UI projections belong to a Thread or View Store
- navigation and modal state belong to a Navigation Store
- drafts and submission settings belong to a Sender Store

Keep the dependency graph one-way:

```text
Stream → Thread → Sender
   ↑         Navigation
```

A frequently changing draft then cannot rerender consumers that subscribe only to navigation or thread projections.

## Keep public actions ordinary

Actions exposed by a Store are ordinary functions. `useEffectEvent` is for events invoked from Effects, not for public callbacks invoked by components.

React Compiler can stabilize values it proves safe. Without the Compiler, follow normal React identity rules and memoize only when a consumer actually depends on stable identity.

## Avoid broad projections

Do not reintroduce a global rerender domain by selecting the whole Store:

```tsx
// Avoid
const { store } = useApp(s => ({ store: s }))

// Prefer
const { threadId, selectThread } = useApp(s => ({
  threadId: s.threadId,
  selectThread: s.selectThread,
}))
```
