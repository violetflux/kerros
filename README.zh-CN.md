<p align="center">
  <a href="https://violetflux.github.io/kerros/zh/">
    <img src="https://raw.githubusercontent.com/violetflux/kerros/main/docs/public/banner.svg" alt="Kerros — selector 优先的 React Store" width="100%" />
  </a>
</p>

<p align="center">
  <a href="https://github.com/violetflux/kerros/blob/main/README.md">English</a> ·
  简体中文 ·
  <a href="https://github.com/violetflux/kerros/blob/main/README.ja.md">日本語</a> ·
  <a href="https://github.com/violetflux/kerros/blob/main/README.ko.md">한국어</a> ·
  <a href="https://github.com/violetflux/kerros/blob/main/README.de.md">Deutsch</a> ·
  <a href="https://github.com/violetflux/kerros/blob/main/README.fr.md">Français</a> ·
  <a href="https://github.com/violetflux/kerros/blob/main/README.es.md">Español</a>
</p>

Kerros 让 React 状态继续待在它本来就该在的位置：Hook 内部、Provider 之下。它提供精确的 selector 订阅，但不要求你改用 reducer、action、proxy 或全局单例。

- **原生 Hook 心智**：Store 就是普通 React Hook
- **Selector 优先**：每个消费者显式选择一个对象
- **精确重渲染**：对选中对象的顶层字段执行 `Object.is` 浅比较
- **Provider 作用域**：每个 Provider 实例拥有相互隔离的 Store
- **可组合**：内层 Store 可以通过单向依赖消费外层 Store
- **React 17–19**：基于官方 `useSyncExternalStore` 兼容 shim

## 安装

| 包管理器 | 命令 |
| --- | --- |
| npm | `npm install @violetflux/kerros` |
| pnpm | `pnpm add @violetflux/kerros` |
| Yarn | `yarn add @violetflux/kerros` |
| Bun | `bun add @violetflux/kerros` |

## 创建 Store

把一个 Hook 交给 `createStore`，它会返回供组件调用的 Hook 和对应 Provider。

```tsx
import { createStore } from '@violetflux/kerros'
import { useState } from 'react'

export const [useCounter, CounterProvider] = createStore(() => {
  const [count, setCount] = useState(0)
  return { count, setCount }
})
```

这个 Hook 仍然可以正常使用 `useState`、`useReducer`、Context、SDK Hook 和自定义 Hook。

## 挂载并选择需要的字段

```tsx
function Counter() {
  const { count, setCount } = useCounter(s => ({
    count: s.count,
    setCount: s.setCount,
  }))

  return <button onClick={() => setCount(count + 1)}>{count}</button>
}

function App() {
  return (
    <CounterProvider>
      <Counter />
    </CounterProvider>
  )
}
```

selector 可以直接内联。未选中的字段发生变化时，`Counter` 不会因此重渲染。

## 为什么需要 Kerros？

Context 很适合表达所有权和依赖注入，但 Context value 变化通常会让所有消费者失效。外部 Store 可以精确订阅，却经常是全局单例，并引入另一套状态模型。

Kerros 把两者的优势组合起来：Provider 运行你的 Store Hook；Context 只传递稳定订阅容器；Hook 提交后的快照通过 `subscribe/getSnapshot` 发布；组件只在 selector 结果变化时重渲染。

没有隐藏的模块单例，因此同一 Provider 可以多次挂载、通过 props 初始化、在测试中隔离，也可以只服务某棵子树。

## 常用配方

### 选择嵌套字段

```tsx
const { name, save } = useProfile(s => ({
  name: s.user.profile.name,
  save: s.actions.save,
}))
```

### 使用 Provider props 初始化

```tsx
const [useTheme, ThemeProvider] = createStore(
  ({ initialDark }: { initialDark: boolean }) => {
    const [dark, setDark] = useState(initialDark)
    return { dark, setDark }
  },
)
```

### 跨 Store 组合

内层 Store 可以选择外层 Store 的字段。依赖必须保持单向，Provider 按依赖顺序挂载。

```tsx
const [usePermissions, PermissionsProvider] = createStore(() => {
  const { user } = useSession(s => ({ user: s.user }))
  return { canEdit: user?.role === 'editor' }
})
```

拆分大型 Store 时，应按状态所有权和更新频率拆分，而不是按文件长度拆分。底层 Store 不应反向读取依赖它的 Store。

## API

```ts
function createStore<TStore, TProps = Record<never, never>>(
  useStoreValue: (props: TProps) => TStore,
): readonly [StoreHook<TStore>, StoreProvider<TProps>]
```

- `useStoreValue` 必须遵守 Hooks 规则
- 除 `children` 外的 Provider props 会传给 `useStoreValue`
- Store Hook 必须接收一个返回对象的 selector
- 在对应 Provider 外调用会抛出明确错误
- 支持 Strict Mode、服务端渲染和 Provider 多实例隔离

## React 兼容性

| React | 实现 |
| --- | --- |
| 17 | 使用 `use-sync-external-store` shim |
| 18 | 可用时使用原生 `useSyncExternalStore` |
| 19 | 使用原生能力，并兼容 React Compiler |

## 文档

- [介绍](https://violetflux.github.io/kerros/zh/guide/introduction)
- [开始使用](https://violetflux.github.io/kerros/zh/guide/getting-started)
- [Selector](https://violetflux.github.io/kerros/zh/guide/selectors)
- [Store 组合](https://violetflux.github.io/kerros/zh/guide/composition)
- [从 hox 迁移](https://violetflux.github.io/kerros/zh/guide/migration)
- [API 参考](https://violetflux.github.io/kerros/zh/api/)

## 许可证

[MIT](https://github.com/violetflux/kerros/blob/main/LICENSE)
