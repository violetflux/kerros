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

对于大型应用，优先拆成多个职责明确的小 Store，再让 Provider 顺序清楚地表达依赖关系。
