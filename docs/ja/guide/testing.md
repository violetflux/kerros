# テスト

Kerros Provider は通常の React コンポーネントです。テストごとに新しい Provider を配置すると、状態は自然に分離されます。

```tsx
test('increments', async () => {
  const user = userEvent.setup()
  render(<CounterProvider><Counter /></CounterProvider>)

  await user.click(screen.getByRole('button'))
  expect(screen.getByRole('button')).toHaveTextContent('1')
})
```

テスト間でリセットすべきグローバル Store はありません。

## 購読の分離を確認する

購読動作そのものがテスト対象の場合だけレンダー回数を数えます。選択していないフィールドを更新し、consumer が再レンダーされないことを確認します。

```tsx
const selected = useExample(s => ({
  value: s.value,
  setIgnored: s.setIgnored,
}))
```

`value` と `setIgnored` の参照が変わらない限り、別フィールドの更新はコンポーネントを再レンダーしません。

再利用可能な Store パッケージでは次をテストしてください。

- 対応する Provider 外での利用
- Provider props の初期化と更新
- consumer の unmount 後の購読解除
- React Strict Mode
- サーバーレンダリング
- 一方向の Store 間依存
- selector 結果が同じ場合のレンダー抑制

Kerros は React 17、18、19 で同じテストスイートを実行します。
