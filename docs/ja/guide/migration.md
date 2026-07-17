# hox からの移行

作成関数を `createStore` に置き換え、各コンポーネントで必要なフィールドだけを選択します。

```tsx
const { count, setCount } = useCounter(s => ({
  count: s.count,
  setCount: s.setCount,
}))
```

Kerros は互換用の出口や集約された `store` フィールドを提供しません。大きな global store はドメイン別に分割し、依存順に Provider をネストしてください。

`useEffectEvent` はアクションを安定化する API ではありません。Effect 内から呼ばれるイベントだけに使用し、公開アクションは通常の関数として扱います。
