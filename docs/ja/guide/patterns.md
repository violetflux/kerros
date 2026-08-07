# パターン

## Provider props で初期化する

`children` 以外の Provider props は Store Hook に渡されます。

```tsx
function useDocumentModel({ documentId }: { documentId: string }) {
  const document = useDocumentQuery(documentId)
  return { documentId, document }
}

const [useDocument, DocumentProvider] = createStore(useDocumentModel)
```

props が変わると Hook は通常どおり再実行され、コミット済みスナップショットが購読者に公開されます。

## SDK Hook を一度だけ呼ぶ

接続や cache を所有する SDK Hook は一つの Store だけで呼び、必要なフィールドを投影します。

```tsx
function useStreamModel() {
  const stream = useSdkStream()
  return {
    messages: stream.messages,
    status: stream.status,
    send: stream.send,
  }
}

export const [useStream, StreamProvider] = createStore(useStreamModel)
```

兄弟 Store から SDK Hook を再度呼ばず、`useStream` から選択します。これにより接続と cache は一つに保たれます。

## 大きな Store を分割する

ファイルサイズではなく、所有権、寿命、更新頻度で分割します。接続、UI 投影、navigation、draft は異なる Store にできます。

```text
Stream → Thread → Sender
   ↑         Navigation
```

依存関係を一方向に保つことで、頻繁に変わる draft が navigation の consumer を再レンダーしません。

## 広い投影を避ける

```tsx
// 避ける
const { store } = useApp(s => ({ store: s }))

// 推奨
const { threadId, selectThread } = useApp()
```

公開 action は通常の関数です。`useEffectEvent` は Effect 内から呼ぶイベントにだけ使用してください。
