# API 参考

Kerros 只有一个公共函数：`createStore`。

## `createStore(useStoreValue)`

把一个 React Hook 转成消费 Hook 和 Provider：

```tsx
const [useCounter, CounterProvider] = createStore(() => {
  const [count, setCount] = useState(0)
  return { count, setCount }
})
```

类型签名：

```ts
function createStore<TStore, TProps = Record<never, never>>(
  useStoreValue: (props: TProps) => TStore,
): readonly [StoreHook<TStore>, StoreProvider<TProps>]
```

### `useStoreValue`

`useStoreValue` 就是 Store 的实现 Hook。它可以调用其他 React Hook，并把要共享的状态和动作放进返回对象：

```tsx
const [useTheme, ThemeProvider] = createStore(() => {
  const [dark, setDark] = useState(false)
  const toggle = () => setDark(v => !v)

  return { dark, toggle }
})
```

它必须遵守 React 的 Hooks 规则。

### 返回值

`createStore` 返回两个值：

```tsx
const [useTheme, ThemeProvider] = createStore(/* ... */)
```

- `useTheme`：组件或下游 Store 使用的 Hook
- `ThemeProvider`：创建并持有 Store 实例的 React 组件

建议按业务命名为 `useTheme`、`ThemeProvider`，不必重复添加 `Store`。

### Store Hook

Store Hook 必须传一个返回对象的 selector：

```tsx
const { dark, toggle } = useTheme(s => ({
  dark: s.dark,
  toggle: s.toggle,
}))
```

Kerros 用 `Object.is` 浅比较返回对象的顶层字段。选择字段不变时，组件不会因为 Store 的其他更新而重渲染。

Store Hook 只能在对应 Provider 内调用，否则会抛出：

```text
Kerros store hook must be used within its matching Provider
```

### Provider props

除了 `children`，Provider 的其他 props 都会传给 Store Hook：

```tsx
interface CounterProps {
  initialCount: number
}

const [useCounter, CounterProvider] = createStore(
  ({ initialCount }: CounterProps) => {
    const [count, setCount] = useState(initialCount)
    return { count, setCount }
  },
)
```

```tsx
<CounterProvider initialCount={10}>
  <Counter />
</CounterProvider>
```

每挂载一个 Provider，就会创建一个独立 Store 实例。

## React 版本

| React | 使用的订阅实现 |
| --- | --- |
| React 17 | `use-sync-external-store` 兼容 shim |
| React 18 | 可用时使用 React 原生 `useSyncExternalStore` |
| React 19 | 使用 React 原生能力，并兼容 React Compiler |

Kerros 自身不要求启用 React Compiler。

## 服务端渲染

Kerros 为 `useSyncExternalStore` 提供 `getServerSnapshot`。Provider 的初始结果用于服务端快照，客户端只在 Provider 提交后发布后续结果，避免消费者读取未提交的渲染。
