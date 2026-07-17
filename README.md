<p align="center">
  <a href="https://violetflux.github.io/kerros/">
    <img src="https://raw.githubusercontent.com/violetflux/kerros/main/docs/public/banner.svg" alt="Kerros — selector-first React stores" width="100%" />
  </a>
</p>

<p align="center">
  English ·
  <a href="https://github.com/violetflux/kerros/blob/main/README.zh-CN.md">简体中文</a> ·
  <a href="https://github.com/violetflux/kerros/blob/main/README.ja.md">日本語</a> ·
  <a href="https://github.com/violetflux/kerros/blob/main/README.ko.md">한국어</a> ·
  <a href="https://github.com/violetflux/kerros/blob/main/README.de.md">Deutsch</a> ·
  <a href="https://github.com/violetflux/kerros/blob/main/README.fr.md">Français</a> ·
  <a href="https://github.com/violetflux/kerros/blob/main/README.es.md">Español</a>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@violetflux/kerros"><img src="https://img.shields.io/npm/v/@violetflux/kerros?color=7c3aed" alt="npm version" /></a>
  <a href="https://github.com/violetflux/kerros/actions/workflows/ci.yml"><img src="https://github.com/violetflux/kerros/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="https://bundlephobia.com/package/@violetflux/kerros"><img src="https://img.shields.io/bundlephobia/minzip/@violetflux/kerros?label=gzip&color=2563eb" alt="minified gzip size" /></a>
  <a href="https://github.com/violetflux/kerros/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/@violetflux/kerros" alt="MIT license" /></a>
</p>

Kerros is a lightweight React state-sharing library based on Hooks and selectors.

Write state as an ordinary custom Hook, wrap it with `createStore`, and share it below a Provider. Each component selects only the fields it uses.

## Install

| Package manager | Command |
| --- | --- |
| npm | `npm install @violetflux/kerros` |
| pnpm | `pnpm add @violetflux/kerros` |
| Yarn | `yarn add @violetflux/kerros` |
| Bun | `bun add @violetflux/kerros` |

React 17, React 18, and React 19 are supported.

## Quick start

### Create a Store

Any custom Hook can become a Kerros Store:

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

`createStore` returns two values: the Hook used by components and its matching Provider.

The Store is still a normal React Hook. It may use `useState`, `useReducer`, Context, SDK Hooks, or your own custom Hooks.

### Mount the Provider

Only descendants of `TaskProvider` may use `useTask`:

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

### Use the Store

Pass a selector that returns the fields used by the component:

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
          <button onClick={() => finishTask(task.id)}>Done</button>
        </li>
      ))}
    </ul>
  )
}
```

Kerros shallowly compares the selector object's top-level fields. When those selected fields stay equal, other Store updates do not rerender `TaskList`. The selector can stay inline and does not need `useCallback`.

## Why Kerros?

- **Just Hooks** — there are no reducers, actions, proxies, or new state syntax to learn
- **Focused rerenders** — a component updates only when the fields returned by its selector change
- **Provider scope** — mount a Store at the application root, inside a route, or around one widget
- **Multiple instances** — every mounted Provider creates an isolated Store instance
- **Store composition** — an inner Store can use an outer Store like any other Hook
- **React 17–19** — one package works across all three React generations

## Multiple instances

Each `TaskProvider` owns independent state:

```tsx
<TaskProvider>
  <h2>Personal tasks</h2>
  <TaskList />
</TaskProvider>

<TaskProvider>
  <h2>Team tasks</h2>
  <TaskList />
</TaskProvider>
```

Each `TaskList` automatically reads its nearest Provider.

## Store dependencies

A Store may call another Store directly. For example, a task Store can read the current account:

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

Mount Providers in dependency order and keep dependencies one-way:

```tsx
<AccountProvider>
  <TaskProvider>
    <App />
  </TaskProvider>
</AccountProvider>
```

## Provider props

Provider props are passed to the Store Hook:

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

- `useStoreValue` follows the Rules of Hooks
- Provider props, excluding `children`, are passed to `useStoreValue`
- the returned Store Hook requires an object-returning selector
- using the Store Hook outside its matching Provider throws a clear error
- Provider instances work with Strict Mode and server rendering

Kerros uses the official `use-sync-external-store` shim for React 17 and prefers React's native implementation in React 18 and 19. React Compiler is optional.

## Documentation

- [Introduction](https://violetflux.github.io/kerros/guide/introduction)
- [Quick start](https://violetflux.github.io/kerros/guide/getting-started)
- [Selectors and rerenders](https://violetflux.github.io/kerros/guide/selectors)
- [Store dependencies](https://violetflux.github.io/kerros/guide/composition)
- [Migration from hox](https://violetflux.github.io/kerros/guide/migration)
- [API reference](https://violetflux.github.io/kerros/api/)

## License

[MIT](https://github.com/violetflux/kerros/blob/main/LICENSE)
