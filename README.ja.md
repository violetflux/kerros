<p align="center">
  <a href="https://violetflux.github.io/kerros/ja/"><img src="https://raw.githubusercontent.com/violetflux/kerros/main/docs/public/banner.svg" alt="Kerros" width="100%" /></a>
</p>

<p align="center">
  <a href="https://github.com/violetflux/kerros/blob/main/README.md">English</a> ·
  <a href="https://github.com/violetflux/kerros/blob/main/README.zh-CN.md">简体中文</a> ·
  日本語 ·
  <a href="https://github.com/violetflux/kerros/blob/main/README.ko.md">한국어</a> ·
  <a href="https://github.com/violetflux/kerros/blob/main/README.de.md">Deutsch</a> ·
  <a href="https://github.com/violetflux/kerros/blob/main/README.fr.md">Français</a> ·
  <a href="https://github.com/violetflux/kerros/blob/main/README.es.md">Español</a>
</p>

Kerros は React の状態を Hook の中、Provider の下という自然な場所に保ちます。デフォルトの自動プロパティ追跡が不要な再レンダーを防ぎ、明示的 selector は派生値や計測済みホットスポットで利用できます。

- Store は通常の React Hook
- `useStore()` は読み取ったプロパティを自動追跡
- 明示的 selector は高度な最適化として利用
- Provider ごとに独立した Store インスタンス
- 一方向の依存関係で Store を合成可能
- React 17、18、19 をサポート

> [!TIP]
> **Coding Agent でインストール**：次の一文をお使いの Coding Agent に貼り付けると、依存関係とプロジェクト Skill をまとめてインストールできます。

```text
このプロジェクトのパッケージマネージャーで @violetflux/kerros をインストールし、npx skills add violetflux/kerros --skill kerros --agent '*' -y を実行して、互換性のあるすべての Coding Agent に Kerros Skill をインストールしてください。
```

## Store を作成する

```tsx
import { createStore } from '@violetflux/kerros'
import { useState } from 'react'

function useCounterModel() {
  const [count, setCount] = useState(0)
  return { count, setCount }
}

export const [useCounter, CounterProvider] = createStore(useCounterModel)
```

Store Hook 内では `useState`、`useReducer`、Context、SDK Hook、カスタム Hook をそのまま利用できます。

initializer は `useCounterModel` のようなモジュール直下の名前付き Hook として定義してください。匿名 initializer も実行時には動作しますが、React Compiler の `infer` モードでは Hook として自動コンパイルされません。

## Provider を配置して値を読み取る

```tsx
function Counter() {
  const { count, setCount } = useCounter()

  return <button onClick={() => setCount(count + 1)}>{count}</button>
}

function App() {
  return <CounterProvider><Counter /></CounterProvider>
}
```

Kerros はレンダー中に読み取ったプロパティを追跡します。未読フィールドの変更では `Counter` は再レンダーされず、Store 全体の深い比較も行いません。

## インストール

| パッケージマネージャー | コマンド |
| --- | --- |
| npm | `npm install @violetflux/kerros` |
| pnpm | `pnpm add @violetflux/kerros` |
| Yarn | `yarn add @violetflux/kerros` |
| Bun | `bun add @violetflux/kerros` |

## 仕組み

Provider は Store Hook を実行し、Context には安定した購読コンテナだけを渡します。コミット済みスナップショットは `subscribe/getSnapshot` で公開され、各コンポーネントは選択結果が変わったときだけ再レンダーされます。

モジュール内の隠れた singleton がないため、Provider の複数配置、props による初期化、テストでの分離、サブツリー単位のスコープが可能です。

## API

```ts
function createStore<TStore, TProps = Record<never, never>>(
  useModel: (props: TProps) => TStore,
): readonly [StoreHook<TStore>, StoreProvider<TProps>]

const [useStream, StreamProvider] = bindStore<Stream>('Stream')
```

返される Store Hook は引数なしで自動追跡を使います。明示的なオブジェクト selector は派生値や計測済みホットスポット向けです。対応する Provider の外では明確なエラーを送出します。

React Element と Portal は自動的に原子的な値になります。`useRef()` と `createRef()` はそのまま返せます。`ref(value)` は Proxy 非互換の値や厳密な同一性が必要な場合だけ使います。

高度な連携として、既存の Headless External Store にだけ `bindStore` を使います。通常の Hook 状態には `createStore` を使ってください。Context は元の Store インスタンスだけを保持し、コンシューマーは `getSnapshot` と `subscribe` を直接利用します。

## ドキュメント

- [はじめに](https://violetflux.github.io/kerros/ja/guide/introduction)
- [インストールと基本](https://violetflux.github.io/kerros/ja/guide/getting-started)
- [Selector](https://violetflux.github.io/kerros/ja/guide/selectors)
- [Store の合成](https://violetflux.github.io/kerros/ja/guide/composition)
- [API](https://violetflux.github.io/kerros/ja/api/)

[MIT License](https://github.com/violetflux/kerros/blob/main/LICENSE)
