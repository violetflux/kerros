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

Kerros 是一个基于 React Hook 和 selector 的轻量状态共享库。

你只需要用熟悉的 custom Hook 写状态，再用 `createStore` 包装一下，就能在 Provider 内的组件之间共享。每个组件通过 selector 选择自己使用的字段。

## 安装

| 包管理器 | 命令 |
| --- | --- |
| npm | `npm install @violetflux/kerros` |
| pnpm | `pnpm add @violetflux/kerros` |
| Yarn | `yarn add @violetflux/kerros` |
| Bun | `bun add @violetflux/kerros` |

支持 React 17、React 18 和 React 19。

## 快速上手

### 创建 Store

任意 custom Hook 都可以变成 Kerros Store：

```tsx
import { createStore } from '@violetflux/kerros'
import { useState } from 'react'

interface Task {
  id: string
  title: string
}

export const [useTask, TaskProvider] = createStore(() => {
  const [tasks, setTasks] = useState<Task[]>([])

  const addTask = (task: Task) => {
    setTasks(v => [...v, task])
  }

  const finishTask = (taskId: string) => {
    setTasks(v => v.filter(task => task.id !== taskId))
  }

  return { tasks, addTask, finishTask }
})
```

`createStore` 返回两个值：组件调用的 Hook 和对应的 Provider。

Store 仍然是普通 React Hook，可以继续使用 `useState`、`useReducer`、Context、SDK Hook 或其他 custom Hook。

### 挂载 Provider

只有 `TaskProvider` 的子节点可以调用 `useTask`：

```tsx
function App() {
  return (
    <TaskProvider>
      <Header />
      <TaskList />
    </TaskProvider>
  )
}
```

### 使用 Store

给 `useTask` 传入 selector，只返回组件使用的字段：

```tsx
function TaskList() {
  const { tasks, finishTask } = useTask(s => ({
    tasks: s.tasks,
    finishTask: s.finishTask,
  }))

  return (
    <ul>
      {tasks.map(task => (
        <li key={task.id}>
          {task.title}
          <button onClick={() => finishTask(task.id)}>完成</button>
        </li>
      ))}
    </ul>
  )
}
```

Kerros 会浅比较 selector 返回对象的顶层字段。只要这些选中字段保持不变，Store 的其他更新就不会让 `TaskList` 重渲染。selector 可以直接写在调用位置，不需要 `useCallback`。

## 为什么用 Kerros

- **就是 Hook**：不需要学习 reducer、action、proxy 或新的状态语法
- **精确重渲染**：只有 selector 返回的字段变化时组件才更新
- **Provider 作用域**：Store 可以放在应用根部、路由内部或一个组件外层
- **多个实例**：每个 Provider 都会创建独立的 Store
- **Store 组合**：内层 Store 可以像普通 Hook 一样读取外层 Store
- **React 17–19**：同一个包兼容三个 React 大版本

## 多个实例

每个 `TaskProvider` 都拥有独立状态：

```tsx
<TaskProvider>
  <h2>个人任务</h2>
  <TaskList />
</TaskProvider>

<TaskProvider>
  <h2>团队任务</h2>
  <TaskList />
</TaskProvider>
```

每个 `TaskList` 会自动读取离自己最近的 Provider。

## Store 之间的依赖

一个 Store 可以直接调用另一个 Store。例如任务 Store 读取当前账户：

```tsx
export const [useTask, TaskProvider] = createStore(() => {
  const { user } = useAccount(s => ({ user: s.user }))
  const [tasks, setTasks] = useState<Task[]>([])

  const addTask = (title: string) => {
    if (!user)
      return

    setTasks(v => [...v, {
      id: crypto.randomUUID(),
      title,
      assigneeId: user.id,
    }])
  }

  return { tasks, addTask }
})
```

按依赖顺序挂 Provider，并保持单向依赖：

```tsx
<AccountProvider>
  <TaskProvider>
    <App />
  </TaskProvider>
</AccountProvider>
```

## Provider props

Provider props 会传给 Store Hook：

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
<CounterProvider initialCount={42}>
  <Counter />
</CounterProvider>
```

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
- 支持 Strict Mode、服务端渲染和 Provider 多实例

React 17 使用官方 `use-sync-external-store` shim；React 18 和 19 可用时优先使用 React 原生实现。React Compiler 不是必需项。

## 文档

- [介绍](https://violetflux.github.io/kerros/zh/guide/introduction)
- [快速上手](https://violetflux.github.io/kerros/zh/guide/getting-started)
- [Selector 与重渲染](https://violetflux.github.io/kerros/zh/guide/selectors)
- [Store 之间的依赖](https://violetflux.github.io/kerros/zh/guide/composition)
- [从 hox 迁移](https://violetflux.github.io/kerros/zh/guide/migration)
- [API 参考](https://violetflux.github.io/kerros/zh/api/)

## 许可证

[MIT](https://github.com/violetflux/kerros/blob/main/LICENSE)
