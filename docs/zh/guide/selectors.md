# Selector

每个 Kerros 消费者都要明确选择一个对象：

```tsx
const { name, save } = useSettings(s => ({
  name: s.profile.name,
  save: s.save,
}))
```

`s.profile.name` 这样的深层读取可以直接使用。只有选中的顶层值按照 `Object.is` 发生变化时，组件才会重新渲染。

## 浅比较

下面的 selector 每次都会创建新对象，但只要 `name` 和 `save` 的引用不变，选择结果就仍然相等：

```tsx
s => ({ name: s.profile.name, save: s.save })
```

除非组件确实依赖全部字段，否则不要选择整个 Store。公开动作是普通 React 值；未使用 React Compiler 时，可在身份稳定性有意义的地方使用 React 常规 memo 能力。
