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

## Compose Providers inside your application

`composeProviders` and `withProps` are not Kerros APIs. If an application has several Providers, add this small utility to the application itself:

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

Then list Providers in dependency order:

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

The first Provider is outermost and the last is innermost, so the array still expresses:

```text
Stream → Thread → Navigation → Sender
```

Use the local `withProps` helper when a Provider needs fixed props:

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

Use `withProps` at module scope for configuration that does not change. Pass dynamic props directly to a Provider instead of creating a new wrapper during every component render. These helpers stay in the application and add no runtime code to Kerros.

## Provider props and `key`

`createStore` infers Provider props from the Store Hook parameter:

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

`ThreadProvider` now requires `threadId`:

```tsx
<ThreadProvider threadId={threadId}>
  <Thread />
</ThreadProvider>
```

A Provider is an ordinary React component, so React's `key` is supported:

```tsx
<ThreadProvider key={threadId} threadId={threadId}>
  <Thread />
</ThreadProvider>
```

The `threadId` prop reaches the Store Hook; `key` does not. React owns `key` and remounts the Provider with a fresh Store instance when it changes, resetting internal state such as `draft`. Without `key`, updated Provider props rerun the Store Hook while existing React state is preserved.
