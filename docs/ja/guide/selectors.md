# Selector

Kerros の利用側は、常にオブジェクトを明示的に選択します。

```tsx
const { name, save } = useSettings(s => ({
  name: s.profile.name,
  save: s.save,
}))
```

`s.profile.name` のようなネストした読み取りも利用できます。選択したトップレベル値が `Object.is` で変化した場合のみ再レンダーされます。

selector は毎回新しいオブジェクトを返しても、各フィールドの同一性が保たれていれば浅い比較で同一と判定されます。すべてのフィールドが必要でない限り、Store 全体を選択しないでください。

アクションも通常の React 値です。React Compiler を使用しない場合は、同一性が重要な箇所で通常の memo 化を利用できます。
