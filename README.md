<p align="center">
  <a href="https://violetflux.github.io/kerros/">
    <img src="https://raw.githubusercontent.com/violetflux/kerros/main/docs/public/banner.svg" alt="Kerros — share state between React components" width="100%" />
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
  <a href="https://github.com/violetflux/kerros/tree/main/skills/kerros"><img src="https://img.shields.io/badge/Agent_Skill-Kerros-7c3aed" alt="Kerros Agent Skill" /></a>
  <a href="https://github.com/violetflux/kerros/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/@violetflux/kerros" alt="MIT license" /></a>
</p>

Kerros is a lightweight way to share state between React components.

Write a Store the same way you write a custom Hook. When local state needs to be shared, pass it to `createStore`, mount its Provider, and let each component select what it needs.

> [!TIP]
> **Install with your coding agent** — paste this sentence into your coding agent to install both the dependency and the project Skill:

```text
Install @violetflux/kerros with this project's package manager, then run npx skills add violetflux/kerros --skill kerros --agent '*' -y to install the Kerros Skill for every compatible coding agent in this project.
```

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

`createStore` returns two values: the Hook used by components and its matching Provider.

The Store is still a normal React Hook. It may use `useState`, `useReducer`, Context, SDK Hooks, or your own custom Hooks.

Keep the initializer as a top-level named Hook such as `useTaskModel`. Anonymous initializers still work at runtime, but React Compiler `infer` mode does not automatically compile them as Hooks.

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

Read the Store directly. Kerros automatically tracks the properties read while this component renders:

```tsx
function TaskList() {
  const { tasks, finishTask } = useTask()

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

Changing an unread field does not rerender `TaskList`. Property tracking follows object, array, and nested reads; it does not perform deep equality over the whole Store.

## Install

| Package manager | Command |
| --- | --- |
| npm | `npm install @violetflux/kerros` |
| pnpm | `pnpm add @violetflux/kerros` |
| Yarn | `yarn add @violetflux/kerros` |
| Bun | `bun add @violetflux/kerros` |

React 17, React 18, and React 19 are supported.

## Why Kerros?

- **Almost nothing new to learn** — reuse the React knowledge you already have; if you can write a custom Hook, you can write a Store
- **Designed for flexible refactoring** — Stores and components use the same Hook API, so local state can become shared state with very little work
- **Local and application-wide state** — Provider placement determines the Store scope, balancing flexibility with simplicity
- **Avoid Context-wide rerenders** — Context carries a stable container and components rerender only when an observed value changes
- **TypeScript support** — Store and selector types are inferred without duplicate declarations

## From state management to state sharing

Libraries such as Redux, Zustand, and Recoil can all share data, but their central job is still to organize state, update it, and define how data flows. “State management” is the right name for them.

Kerros focuses on a smaller and more direct problem. It does not invent a new data model or prescribe how async logic should work. It answers one question: **how can a piece of Hook state be shared between React components?**

Passing `value` and `onChange` through layer after layer damages component boundaries. Moving everything into one global Store does not automatically make an application scalable or maintainable either.

Sharing frequently changing state through React Context directly also causes repeated work: every Context value change rerenders all consumers. Kerros keeps Provider scoping and multiple instances, but Context carries only a stable container. Automatic tracking observes render-time reads, so unrelated Store updates do not rerender a component.

Kerros stays simple, lightweight, and reliable. Write local state as an ordinary Hook, share it only when necessary, use a Provider to set its scope, and let automatic tracking observe what each component reads.

## Subscription modes

The selector-free form is the default and usually the best starting point:

```tsx
const { count, setCount } = useCounter()
```

- `useStore()` automatically tracks object, array, and nested properties read during render.
- `useStore(selector)` is the advanced path for derived values and measured hot spots. Its returned object's top-level fields are shallowly compared with `Object.is`.
- `createStore(model, { tracking: false })` and `bindStore({ tracking: false })` make selector-free reads compare the complete Store at the top level instead.

Primitive snapshots use `Object.is`. `Map`, `Set`, class instances, and other non-plain objects are treated as atomic references. Store and external Store snapshots must be immutable: publish a new reference for every observable change.

Do not save, return, spread, serialize, or pass the complete selector-free result around. Read properties immediately, normally by destructuring. Effects and `useEffectEvent` may perform imperative reads from `useInstance()`, but rendered state must use the subscribed Store Hook; never expose an Effect Event as a public Store action.

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

### `createStore` (default)

```ts
function createStore<TStore, TProps = Record<never, never>>(
  useModel: (props: TProps) => TStore,
  options?: { tracking?: boolean },
): readonly [StoreHook<TStore>, StoreProvider<TProps>]
```

- `useModel` follows the Rules of Hooks
- Provider props, excluding `children`, are passed to `useModel`
- the returned Store Hook accepts either no argument for automatic tracking or an object-returning selector
- using the Store Hook outside its matching Provider throws a clear error
- Provider instances work with Strict Mode and server rendering

### Advanced: bind an existing external Store

Most applications only need `createStore`. Use `bindStore` when a library or SDK already owns authoritative state outside React and exposes stable `getSnapshot` and `subscribe` functions.

Without this API, an integration must either repeat the Context and selector subscription code or copy the external snapshot through a second Store. `bindStore` provides Provider scoping and selectors while keeping the original Store as the only state owner.

```tsx
const [useStream, StreamBindingProvider] = bindStore<Stream>('Stream')

<StreamBindingProvider store={stream}>
  <App />
</StreamBindingProvider>
```

The Provider stores only the original Store instance in Context. Consumers subscribe directly, so Kerros does not copy snapshots or add another publication layer. The component that creates the Store keeps lifecycle and imperative access.

In one sentence: `bindStore` is a React adapter for an external Store, not a state synchronizer. State remains only in the original Store; React reads it with `getSnapshot` after a subscription notification.

If the state begins in `useState`, `useReducer`, an SDK Hook, or another custom Hook, keep using `createStore`.

Kerros uses the official `use-sync-external-store` shim for React 17 and prefers React's native implementation in React 18 and 19. React Compiler is optional.

## ESLint guardrails

Install the separate type-aware plugin for the safest default usage:

```sh
npm install --save-dev @violetflux/eslint-plugin-kerros @typescript-eslint/parser
```

```js
import kerros from '@violetflux/eslint-plugin-kerros'

export default [kerros.configs.recommendedTypeChecked]
```

`recommendedTypeChecked` enables all 17 rules as errors and uses TypeScript `projectService`. Very large repositories may use `kerros.configs.fastTypeChecked`, which keeps type-aware Store recognition but disables the most expensive whole-program and deep analyses. See the [measured ESLint benchmark](https://github.com/violetflux/kerros/blob/main/benchmarks/eslint/RESULTS.md); the fast profile is a tradeoff, not an untyped fallback. The plugin analyzes complete TS/TSX files, not incomplete Markdown snippets.

For maintainers, npm Trusted Publisher entries must be configured for both `@violetflux/kerros` and `@violetflux/eslint-plugin-kerros`. That npm-side configuration is the only release step outside this repository; CI checks and publishes the runtime first, then the plugin.

## Documentation

- [Introduction](https://violetflux.github.io/kerros/guide/introduction)
- [Quick start](https://violetflux.github.io/kerros/guide/getting-started)
- [Selectors and rerenders](https://violetflux.github.io/kerros/guide/selectors)
- [Store dependencies](https://violetflux.github.io/kerros/guide/composition)
- [Migration from hox](https://violetflux.github.io/kerros/guide/migration)
- [API reference](https://violetflux.github.io/kerros/api/)

## License

[MIT](https://github.com/violetflux/kerros/blob/main/LICENSE)
