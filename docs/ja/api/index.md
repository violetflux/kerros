# API リファレンス

## `createStore`

```ts
function createStore<TStore, TProps = Record<never, never>>(
  useStoreValue: (props: TProps) => TStore,
): readonly [StoreHook<TStore>, StoreProvider<TProps>]
```

```tsx
function useCounterStoreValue() {
  const [count, setCount] = useState(0)
  return { count, setCount }
}

const [useCounter, CounterProvider] = createStore(useCounterStoreValue)
```

入力 Hook は React Hooks を利用でき、Provider の `children` 以外の props を受け取ります。

`useXxxStoreValue` のような名前を持つトップレベル関数として定義してください。匿名 initializer も実行時には有効ですが、React Compiler の `infer` モードでは Hook として自動認識・コンパイルされません。

返される Store Hook には、オブジェクトを返す selector が必須です。トップレベルのフィールドは浅く比較されます。対応する Provider の外で呼び出すと明確なエラーを投げます。

各 Provider は安定した外部 Store コンテナを所有します。Context 値を変更せず、選択した購読者だけにスナップショットを通知します。

Kerros は React `^17`、`^18`、`^19` をサポートし、`use-sync-external-store/shim/with-selector` を使用します。
