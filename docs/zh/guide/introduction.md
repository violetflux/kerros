# 介绍

Kerros 是一个基于 React Hook 的状态共享库。

你先用熟悉的 Hook 写状态，再用 `createStore` 把它交给一组组件共享。组件通过 selector 选择自己需要的数据，并在选择结果变化时重渲染。

## 一个最小例子

下面是一个完整的计数器 Store：

```tsx
import { createStore } from '@violetflux/kerros'
import { useState } from 'react'

const [useCounter, CounterProvider] = createStore(() => {
  const [count, setCount] = useState(0)

  return { count, setCount }
})
```

把 Provider 放到组件树中：

```tsx
function App() {
  return (
    <CounterProvider>
      <Counter />
    </CounterProvider>
  )
}
```

然后在组件中选择需要的字段：

```tsx
function Counter() {
  const { count, setCount } = useCounter(s => ({
    count: s.count,
    setCount: s.setCount,
  }))

  return <button onClick={() => setCount(count + 1)}>{count}</button>
}
```

这就是 Kerros 的全部基础用法：

1. 用 Hook 写状态
2. 用 `createStore` 得到消费 Hook 和 Provider
3. 挂载 Provider
4. 用 selector 取数据

## 为什么需要 selector

假设 Store 同时保存用户名和计数：

```tsx
const [useExample, ExampleProvider] = createStore(() => {
  const [name, setName] = useState('Kerros')
  const [count, setCount] = useState(0)

  return { name, setName, count, setCount }
})
```

只显示用户名的组件不需要关心 `count`：

```tsx
function Name() {
  const { name } = useExample(s => ({ name: s.name }))
  return <span>{name}</span>
}
```

`count` 更新时，`Name` 选择到的 `name` 没有变化，因此它不会重新渲染。你不需要手写多个 Context，也不需要给 selector 包 `useCallback`。

## Store 仍然是普通 Hook

`createStore` 没有发明新的状态语法。Store 内部仍然可以使用：

- `useState`、`useReducer`、`useRef`
- 你自己的 custom Hook
- React Context
- React Query、SWR 或其他 SDK 提供的 Hook
- 另一个 Kerros Store

例如，一个 SDK Hook 只需要调用一次：

```tsx
const [useChat, ChatProvider] = createStore(() => {
  const chat = useChatSdk()

  return {
    messages: chat.messages,
    status: chat.status,
    send: chat.send,
  }
})
```

页面里的组件再分别选择 `messages`、`status` 或 `send`，不必重复创建 SDK 连接。

## Provider 决定 Store 的范围

每个 Provider 都会创建一个独立的 Store 实例：

```tsx
<CounterProvider>
  <Counter />
</CounterProvider>

<CounterProvider>
  <Counter />
</CounterProvider>
```

上面两个计数器的数据互不影响。如果 Store 要服务整个应用，就把 Provider 放到根节点；如果只服务一个编辑器，就把 Provider 放到编辑器外面。

Kerros 不创建隐藏的全局单例，Store 在哪里创建、由谁使用，可以直接从组件树中看出来。

## 什么时候适合用 Kerros

Kerros 适合这些场景：

- 多个组件要共享一组 Hook 状态
- 一个 SDK Hook 只想调用一次，再把结果分给多个组件
- 大 Store 需要按工作区、页面或功能拆成多个小 Store
- 测试中需要为每个用例创建独立状态
- 同一个页面需要挂载多个相互隔离的 Store 实例

如果状态只属于一个组件，继续使用 `useState` 就够了。如果状态必须脱离 React 独立运行，则应选择独立的外部 Store。

接下来阅读[快速上手](./getting-started)，从一个任务列表开始完整使用 Kerros。
