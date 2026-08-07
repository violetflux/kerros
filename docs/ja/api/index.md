# API リファレンス

## `createStore`

```ts
function createStore<TStore, TProps = Record<never, never>>(
  useModel: (props: TProps) => TStore,
): readonly [StoreHook<TStore>, StoreProvider<TProps>]
```

```tsx
function useCounterModel() {
  const [count, setCount] = useState(0)
  return { count, setCount }
}

const [useCounter, CounterProvider] = createStore(useCounterModel)
```

入力 Hook は React Hooks を利用でき、Provider の `children` 以外の props を受け取ります。

`useXxxModel` のような名前を持つトップレベル関数として定義してください。匿名 initializer も実行時には有効ですが、React Compiler の `infer` モードでは Hook として自動認識・コンパイルされません。

返される Store Hook は引数なしで自動プロパティ追跡を使います。明示的なオブジェクト selector は派生値や計測済みホットスポット向けで、トップレベルフィールドを浅く比較します。Provider の外では明確なエラーを投げます。

各 Provider は安定した外部 Store コンテナを所有します。Context 値を変更せず、選択した購読者だけにスナップショットを通知します。

## 高度な連携：`bindStore`

通常は `createStore` を使います。既存の Headless External Store が安定した `getSnapshot` と `subscribe` を公開している場合に限り、`bindStore` でスナップショットをコピーせず直接バインドできます。

```tsx
const [
  useStream,
  StreamProvider,
  useStreamInstance,
] = bindStore<Stream>('Stream')

<StreamProvider store={stream}>
  <App />
</StreamProvider>
```

Context が保持するのは元の Store インスタンスだけで、最初の Hook はデフォルトで自動追跡を使います。`useStreamInstance` は命令的な読み取り専用でスナップショットを購読しません。描画する状態には最初の Hook を使ってください。

Kerros は React `^17`、`^18`、`^19` をサポートし、`use-sync-external-store/shim/with-selector` を使用します。
