# はじめに

Kerros は React Hook、Context による所有権、外部 Store の限定的な購読をつなぐ小さなライブラリです。

状態は通常の Hook として記述します。

```tsx
function useCounterStore() {
  const [count, setCount] = useState(0)
  return { count, setCount }
}

const [useCounter, CounterProvider] = createStore(useCounterStore)
```

Provider が **Store の存在範囲** を決め、selector が **コンポーネントの監視対象** を決めます。

## 解決する課題

React Context は所有権と依存性注入に適していますが、Context value の変更はすべての consumer を無効化します。モジュールレベルの外部 Store は限定的な購読を提供しますが、通常はグローバルで別の状態モデルを導入します。

Kerros は両方の境界を明示します。

| 関心事 | Kerros |
| --- | --- |
| 状態モデル | 通常の React Hook |
| 所有権 | Provider の配置 |
| 更新 | `useSyncExternalStore` の購読 |
| 再レンダー | オブジェクト selector の浅い比較 |
| 複数インスタンス | Provider を複数回配置 |
| Store 間データ | 一方向の Provider ネスト |

Context は変化するスナップショットではなく、安定した購読コンテナだけを運びます。Store Hook はコミット済みスナップショットを公開し、各コンポーネントは selector の投影だけを購読します。

## 適している場面

- route、workspace、editor、session、機能サブツリーに属する状態
- Store 内で React Hook や SDK Hook を直接使いたい場合
- 巨大なグローバル再レンダー領域を作らずに限定的な購読が必要な場合
- Provider props で Store を初期化したい場合
- テストごとに Store を分離したい場合

Store 間の依存は必ず一方向にします。B が A を読む場合は A の Provider を外側に置き、A から B を読まないでください。

次は[はじめにの実装](./getting-started)または[Store の合成](./composition)を参照してください。
