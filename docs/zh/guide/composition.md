# Store 之间的依赖

Kerros Store 本质上是 React Hook，所以一个 Store 可以直接调用另一个 Store。

下面用“任务依赖当前账户”作为例子。

## 创建账户 Store

先创建被依赖的账户 Store：

```tsx
import { createStore } from '@violetflux/kerros'
import { useState } from 'react'

interface User {
  id: string
  name: string
}

export const [useAccount, AccountProvider] = createStore(() => {
  const [user, setUser] = useState<User | null>(null)

  return { user, setUser }
})
```

## 在任务 Store 中读取账户

任务 Store 直接调用 `useAccount`，用法和组件中完全一样：

```tsx
interface Task {
  id: string
  title: string
  assigneeId: string
}

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

账户切换后，任务 Store 会收到新的 `user`。任务组件不需要再单独读取账户 Store。

## 按依赖顺序挂 Provider

`TaskProvider` 创建时要调用 `useAccount`，所以它必须放在 `AccountProvider` 内部：

```tsx
function Providers({ children }: PropsWithChildren) {
  return (
    <AccountProvider>
      <TaskProvider>
        {children}
      </TaskProvider>
    </AccountProvider>
  )
}
```

可以把 Provider 顺序直接理解为依赖顺序：

```text
Account → Task
```

左边的 Store 先创建，右边的 Store 可以读取左边。

## 不要形成循环依赖

如果任务 Store 已经读取账户 Store，就不要再让账户 Store 读取任务 Store：

```text
Account → Task → Account  // 错误：无法安排 Provider 顺序
```

遇到循环时，不要用额外全局变量绕过去。应该重新判断状态属于谁：

- 登录用户属于 Account
- 任务列表属于 Task
- 两边都需要的纯计算可以提取成普通函数
- 同时控制多个 Store 的操作可以放到更外层组件或新的上层 Store

## 三层依赖

多个 Store 按同样规则继续嵌套：

```tsx
<AccountProvider>
  <TaskProvider>
    <EditorProvider>
      <App />
    </EditorProvider>
  </TaskProvider>
</AccountProvider>
```

对应关系是：

```text
Account → Task → Editor
```

`Editor` 可以读取 `Task` 和 `Account`，`Task` 可以读取 `Account`，但依赖不能反向。

## 在项目中组合 Provider

`composeProviders` 和 `withProps` 不是 Kerros API。Provider 较多时，可以在自己的项目里添加下面这个通用工具：

```tsx title="utils/context.tsx"
import type { ComponentType, ReactNode } from 'react'

type Provider = ComponentType<{ children: ReactNode }>

export function composeProviders(providers: Provider[]) {
  return function Providers({ children }: { children: ReactNode }) {
    return providers.reduceRight(
      (tree, Provider) => <Provider>{tree}</Provider>,
      children,
    )
  }
}

export function withProps<TProps extends object>(
  Component: ComponentType<TProps & { children: ReactNode }>,
  props: TProps,
): Provider {
  return function Provider({ children }) {
    return <Component {...props}>{children}</Component>
  }
}
```

然后按相同的依赖顺序写成数组：

```tsx
import { composeProviders } from '@/utils/context'

export const AppProvider = composeProviders([
  StreamProvider,
  ThreadProvider,
  NavigationProvider,
  SenderProvider,
])
```

```tsx
<AppProvider>
  <App />
</AppProvider>
```

数组中的第一个 Provider 在最外层，最后一个在最内层。因此这段代码仍然表示：

```text
Stream → Thread → Navigation → Sender
```

如果某个 Provider 需要固定 props，使用项目内的 `withProps` 绑定：

```tsx
import { composeProviders, withProps } from '@/utils/context'

export const AppProvider = composeProviders([
  withProps(ApiProvider, { baseUrl: '/api' }),
  StreamProvider,
  ThreadProvider,
  NavigationProvider,
  SenderProvider,
])
```

`withProps` 适合在模块作用域绑定不会变化的配置。动态 props 直接传给 Provider，不要在组件渲染期间反复创建新的包装组件。这两个工具不会进入 Kerros 包，也不会增加 Kerros 的运行时代码。

## Provider props 与 `key`

`createStore` 会根据 Store Hook 的参数推导 Provider props：

```tsx
interface ThreadProps {
  threadId: string
}

export const [useThread, ThreadProvider] = createStore(
  ({ threadId }: ThreadProps) => {
    const [draft, setDraft] = useState('')
    return { threadId, draft, setDraft }
  },
)
```

`ThreadProvider` 现在必须接收 `threadId`：

```tsx
<ThreadProvider threadId={threadId}>
  <Thread />
</ThreadProvider>
```

Provider 也是普通 React 组件，所以支持 React 的 `key`：

```tsx
<ThreadProvider key={threadId} threadId={threadId}>
  <Thread />
</ThreadProvider>
```

`threadId` prop 会传给 Store Hook；`key` 不会作为 prop 传入，它只由 React 使用。`key` 改变时，旧 Provider 会卸载并创建全新的 Store 实例，因此上例会同时重置 `draft` 等内部状态。不加 `key` 时，Provider props 更新会重新运行 Store Hook，但已有的 React state 会继续保留。

对于大型应用，优先拆成多个职责明确的小 Store，再让 Provider 顺序清楚地表达依赖关系。
