# Store dependencies

A Kerros Store is a React Hook, so one Store may call another Store directly.

This example makes a task Store depend on the current account.

## Create the account Store

First create the Store that other Stores will use:

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

## Read it from the task Store

Call `useAccount` inside the task Store exactly as you would inside a component:

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

When the account changes, the task Store receives the new `user`.

## Mount Providers in dependency order

`TaskProvider` calls `useAccount`, so it must be rendered inside `AccountProvider`:

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

Read the Provider order as the dependency order:

```text
Account → Task
```

## Avoid circular dependencies

If the task Store reads the account Store, the account Store must not read the task Store back:

```text
Account → Task → Account  // invalid
```

When a cycle appears, reconsider ownership instead of adding a global variable:

- the signed-in user belongs to Account
- the task list belongs to Task
- shared calculations can be ordinary functions
- operations coordinating both Stores can live in an outer component or a new higher-level Store

Longer chains follow the same rule:

```tsx
<AccountProvider>
  <TaskProvider>
    <EditorProvider>
      <App />
    </EditorProvider>
  </TaskProvider>
</AccountProvider>
```

`Editor` may read `Task` and `Account`; `Task` may read `Account`; dependencies never point back outward.
