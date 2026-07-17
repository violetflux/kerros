<p align="center">
  <a href="https://violetflux.github.io/kerros/zh/">
    <img src="https://raw.githubusercontent.com/violetflux/kerros/main/docs/public/banner.svg" alt="Kerros — 在 React 组件间共享状态" width="100%" />
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

Kerros 是一个在 React 组件间共享状态的轻量方案。

你怎么写 custom Hook，就可以怎么写 Store。只有当局部状态需要被多个组件使用时，再交给 `createStore`，用 Provider 决定共享范围，用 selector 选择组件真正需要的数据。

## 安装

| 包管理器 | 命令 |
| --- | --- |
| npm | `npm install @violetflux/kerros` |
| pnpm | `pnpm add @violetflux/kerros` |
| Yarn | `yarn add @violetflux/kerros` |
| Bun | `bun add @violetflux/kerros` |

支持 React 17、React 18 和 React 19。

## 为什么要用 Kerros？

- **几乎没有学习成本**：直接复用已有的 React 知识，你怎么写 custom Hook，就可以怎么写 Store
- **为灵活重构而设计**：Store 和组件使用同一套 Hook API，可以近乎零成本地把组件局部状态转换成组件间共享状态
- **同时支持局部状态和全局状态**：Provider 决定 Store 的作用域，在灵活和简单之间取得平衡
- **解决 Context 的重复渲染问题**：Context 只传递稳定容器，selector 选择结果不变的组件不会重渲染
- **优秀的 TypeScript 支持**：Store 和 selector 类型自动推断，不需要重复声明

## 从状态管理到状态共享

Redux、Zustand、Recoil 这些状态管理库当然也能解决数据共享问题，但它们最核心的能力仍然是组织数据、操作数据和约束数据流，因此它们应该被称为“状态管理”工具。

Kerros 想解决的问题更小，也更直接。它不发明新的数据结构，不规定异步和数据流应该怎么写，只聚焦一个痛点：**如何在多个 React 组件间共享一段 Hook 状态。**

层层传递 `value`、`onChange` 会逐渐破坏组件边界；粗暴地把数据全部塞进一个全局 Store，也不会自动让应用获得更好的扩展性和可维护性。

直接用 React Context 共享变化频繁的状态也会带来重复渲染：Context value 每次变化，所有消费者都会更新。Kerros 保留 Provider 的作用域和多实例能力，但 Context 只传递稳定容器；组件通过 selector 订阅数据，只有选择结果变化时才重渲染。

Kerros 简单、轻量、可靠。先把状态写成普通 Hook，需要共享时再交给 `createStore`；Provider 决定状态共享到哪里，selector 决定每个组件订阅什么。

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
