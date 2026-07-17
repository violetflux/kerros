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

Kerros は React の状態を Hook の中、Provider の下という自然な場所に保ちます。reducer、action、proxy、グローバル singleton を導入せず、selector による限定的な購読を追加します。

- Store は通常の React Hook
- selector は必要な値だけをオブジェクトで返す
- 選択したトップレベルフィールドを `Object.is` で浅く比較
- Provider ごとに独立した Store インスタンス
- 一方向の依存関係で Store を合成可能
- React 17、18、19 をサポート

## インストール

| パッケージマネージャー | コマンド |
| --- | --- |
| npm | `npm install @violetflux/kerros` |
| pnpm | `pnpm add @violetflux/kerros` |
| Yarn | `yarn add @violetflux/kerros` |
| Bun | `bun add @violetflux/kerros` |

## Store を作成する

```tsx
import { createStore } from '@violetflux/kerros'
import { useState } from 'react'

export const [useCounter, CounterProvider] = createStore(() => {
  const [count, setCount] = useState(0)
  return { count, setCount }
})
```

Store Hook 内では `useState`、`useReducer`、Context、SDK Hook、カスタム Hook をそのまま利用できます。

## Provider を配置して値を選択する

```tsx
function Counter() {
  const { count, setCount } = useCounter(s => ({
    count: s.count,
    setCount: s.setCount,
  }))

  return <button onClick={() => setCount(count + 1)}>{count}</button>
}

function App() {
  return <CounterProvider><Counter /></CounterProvider>
}
```

selector はインラインで記述できます。選択していないフィールドの変更では `Counter` は再レンダーされません。

## 仕組み

Provider は Store Hook を実行し、Context には安定した購読コンテナだけを渡します。コミット済みスナップショットは `subscribe/getSnapshot` で公開され、各コンポーネントは選択結果が変わったときだけ再レンダーされます。

モジュール内の隠れた singleton がないため、Provider の複数配置、props による初期化、テストでの分離、サブツリー単位のスコープが可能です。

## API

```ts
function createStore<TStore, TProps = Record<never, never>>(
  useStoreValue: (props: TProps) => TStore,
): readonly [StoreHook<TStore>, StoreProvider<TProps>]
```

返される Store Hook にはオブジェクトを返す selector が必須です。対応する Provider の外で呼び出すと明確なエラーを送出します。Strict Mode とサーバーレンダリングをサポートします。

## ドキュメント

- [はじめに](https://violetflux.github.io/kerros/ja/guide/introduction)
- [インストールと基本](https://violetflux.github.io/kerros/ja/guide/getting-started)
- [Selector](https://violetflux.github.io/kerros/ja/guide/selectors)
- [Store の合成](https://violetflux.github.io/kerros/ja/guide/composition)
- [API](https://violetflux.github.io/kerros/ja/api/)

[MIT License](https://github.com/violetflux/kerros/blob/main/LICENSE)
