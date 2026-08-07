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

> [!TIP]
> **使用 Coding Agent 安装**：复制下面这句话并粘贴给你的 Coding Agent，它会同时安装依赖和当前项目的 Skill：

```text
使用当前项目的包管理器安装 @violetflux/kerros，然后运行 npx skills add violetflux/kerros --skill kerros --agent '*' -y，为当前项目中所有兼容的 Coding Agent 安装 Kerros Skill。
```

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

function useTaskModel() {
  const [tasks, setTasks] = useState<Task[]>([])

  const addTask = (task: Task) => {
    setTasks(v => [...v, task])
  }

  const finishTask = (taskId: string) => {
    setTasks(v => v.filter(task => task.id !== taskId))
  }

  return { tasks, addTask, finishTask }
}

export const [useTask, TaskProvider] = createStore(useTaskModel)
```

`createStore` 返回两个值：组件调用的 Hook 和对应的 Provider。

Store 仍然是普通 React Hook，可以继续使用 `useState`、`useReducer`、Context、SDK Hook 或其他 custom Hook。

请把 initializer 写成 `useTaskModel` 这类同文件顶层命名 Hook。匿名 initializer 在运行时仍然可用，但 React Compiler 的 `infer` 模式不会自动把它识别并编译为 Hook。

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

直接读取 Store。Kerros 会自动追踪组件渲染期间访问的属性：

```tsx
function TaskList() {
  const { tasks, finishTask } = useTask()

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

没有读取的字段发生变化时，`TaskList` 不会重渲染。自动追踪支持对象、数组和深层属性访问，不会对完整 Store 做深比较。

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
- **解决 Context 的重复渲染问题**：Context 只传递稳定容器，组件观察到的值不变时不会重渲染
- **优秀的 TypeScript 支持**：Store 和 selector 类型自动推断，不需要重复声明

## 从状态管理到状态共享

Redux、Zustand、Recoil 这些状态管理库当然也能解决数据共享问题，但它们最核心的能力仍然是组织数据、操作数据和约束数据流，因此它们应该被称为“状态管理”工具。

Kerros 想解决的问题更小，也更直接。它不发明新的数据结构，不规定异步和数据流应该怎么写，只聚焦一个痛点：**如何在多个 React 组件间共享一段 Hook 状态。**

层层传递 `value`、`onChange` 会逐渐破坏组件边界；粗暴地把数据全部塞进一个全局 Store，也不会自动让应用获得更好的扩展性和可维护性。

直接用 React Context 共享变化频繁的状态也会带来重复渲染：Context value 每次变化，所有消费者都会更新。Kerros 保留 Provider 的作用域和多实例能力，但 Context 只传递稳定容器；自动追踪根据渲染期间的读取建立订阅，无关 Store 更新不会触发组件重渲染。

Kerros 简单、轻量、可靠。先把状态写成普通 Hook，需要共享时再交给 `createStore`；Provider 决定状态共享到哪里，自动追踪决定每个组件订阅什么。

## 三种订阅模式

不传 selector 是默认用法，也是多数场景的起点：

```tsx
const { count, setCount } = useCounter()
```

- `useStore()`：自动追踪渲染期间读取的对象、数组和深层属性。
- `useStore(selector)`：用于高级派生值和经过测量的性能热点；Kerros 用 `Object.is` 浅比较 selector 返回对象的顶层字段。
- `createStore(model, { tracking: false })` 或 `bindStore({ tracking: false })`：关闭自动追踪，无 selector 读取改为完整 Store 顶层浅比较。

基础类型快照使用 `Object.is`。`Map`、`Set`、类实例及其他非普通对象按整体引用处理。Store 和 External Store 快照必须保持不可变：每次可观察变化都发布新引用。

不要保存、返回、展开、序列化或传递无 selector 的完整结果；应立即读取属性，通常直接解构。Effect 与 `useEffectEvent` 可以通过 `useInstance()` 做命令式读取，但参与渲染的状态必须使用订阅 Hook；也不要把 Effect Event 暴露成公共 Store action。

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
function useTaskModel() {
  const { user } = useAccount()
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
}

export const [useTask, TaskProvider] = createStore(useTaskModel)
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

function useCounterModel({ initialCount }: CounterProps) {
  const [count, setCount] = useState(initialCount)
  return { count, setCount }
}

const [useCounter, CounterProvider] = createStore(useCounterModel)
```

```tsx
<CounterProvider initialCount={42}>
  <Counter />
</CounterProvider>
```

## API

### `createStore`（默认用法）

```ts
function createStore<TStore, TProps = Record<never, never>>(
  useModel: (props: TProps) => TStore,
  options?: { tracking?: boolean },
): readonly [StoreHook<TStore>, StoreProvider<TProps>]
```

- `useModel` 必须遵守 Hooks 规则
- 除 `children` 外的 Provider props 会传给 `useModel`
- Store Hook 可不传参数使用自动追踪，也可传入返回对象的 selector
- 在对应 Provider 外调用会抛出明确错误
- 支持 Strict Mode、服务端渲染和 Provider 多实例

### 高级用法：绑定已有 External Store

绝大多数应用只需要 `createStore`。只有当某个库或 SDK 已经在 React 外持有权威状态，并提供稳定的 `getSnapshot` 和 `subscribe` 函数时，才使用 `bindStore`。

没有这个 API 时，集成层只能重复实现 Context 和 selector 订阅，或者把 External Store 快照复制进第二个 Store。`bindStore` 只提供 Provider 作用域和 selector，原 Store 仍是唯一状态所有者。

```tsx
const [useStream, StreamBindingProvider] = bindStore<Stream>('Stream')

<StreamBindingProvider store={stream}>
  <App />
</StreamBindingProvider>
```

Provider 的 Context 只保存原 Store 实例，组件直接订阅它；Kerros 不复制快照，也不增加中间发布层。创建 Store 的组件继续负责生命周期和命令式访问。

一句话理解：`bindStore` 是 External Store 的 React 适配器，不是状态同步器。状态仍只存在于原 Store 中，React 在收到订阅通知后通过 `getSnapshot` 读取它。

如果状态来自 `useState`、`useReducer`、SDK Hook 或其他 custom Hook，继续使用 `createStore`。

React 17 使用官方 `use-sync-external-store` shim；React 18 和 19 可用时优先使用 React 原生实现。React Compiler 不是必需项。

## ESLint 防护规则

建议安装独立的类型感知插件，并默认使用最严格配置：

```sh
npm install --save-dev @violetflux/eslint-plugin-kerros @typescript-eslint/parser
```

```js
import kerros from '@violetflux/eslint-plugin-kerros'

export default [kerros.configs.recommendedTypeChecked]
```

`recommendedTypeChecked` 把全部 17 条规则设为 error，并启用 TypeScript `projectService`。超大型仓库可改用 `kerros.configs.fastTypeChecked`：它仍然通过类型识别真实 Kerros Hook，只关闭最昂贵的全程序与深层分析。请参考[真实 ESLint 压测](https://github.com/violetflux/kerros/blob/main/benchmarks/eslint/RESULTS.md)；fast 是性能取舍，不是不可靠的命名降级。插件首版只分析完整 TS/TSX 文件，不分析不完整 Markdown 代码块。

维护者还需要分别为 `@violetflux/kerros` 和 `@violetflux/eslint-plugin-kerros` 配置 npm Trusted Publisher。这是唯一的仓库外发布步骤；仓库内工作流会先检查并发布运行库，再发布插件。

## 文档

- [介绍](https://violetflux.github.io/kerros/zh/guide/introduction)
- [快速上手](https://violetflux.github.io/kerros/zh/guide/getting-started)
- [Selector 与重渲染](https://violetflux.github.io/kerros/zh/guide/selectors)
- [Store 之间的依赖](https://violetflux.github.io/kerros/zh/guide/composition)
- [从 hox 迁移](https://violetflux.github.io/kerros/zh/guide/migration)
- [API 参考](https://violetflux.github.io/kerros/zh/api/)

## 许可证

[MIT](https://github.com/violetflux/kerros/blob/main/LICENSE)
