# Introduction

Kerros is a state-sharing library built around React Hooks.

Write state with the Hooks you already know, pass the Hook to `createStore`, and share it with a group of components. Each component selects the fields it uses and rerenders when that selection changes.

## A minimal example

Create a counter Store:

```tsx
import { createStore } from '@violetflux/kerros'
import { useState } from 'react'

const [useCounter, CounterProvider] = createStore(() => {
  const [count, setCount] = useState(0)

  return { count, setCount }
})
```

Mount the Provider:

```tsx
function App() {
  return (
    <CounterProvider>
      <Counter />
    </CounterProvider>
  )
}
```

Select the fields used by the component:

```tsx
function Counter() {
  const { count, setCount } = useCounter(s => ({
    count: s.count,
    setCount: s.setCount,
  }))

  return <button onClick={() => setCount(count + 1)}>{count}</button>
}
```

That is the complete basic flow:

1. write state as a Hook
2. call `createStore` to get a consumer Hook and Provider
3. mount the Provider
4. select the data a component uses

## Why selectors matter

Suppose a Store contains both a name and a counter:

```tsx
const [useExample, ExampleProvider] = createStore(() => {
  const [name, setName] = useState('Kerros')
  const [count, setCount] = useState(0)

  return { name, setName, count, setCount }
})
```

A component that only displays the name does not care about `count`:

```tsx
function Name() {
  const { name } = useExample(s => ({ name: s.name }))
  return <span>{name}</span>
}
```

Updating `count` does not rerender `Name`, because its selected `name` did not change. There is no need to split the data into several Contexts or wrap the selector in `useCallback`.

## A Store is still an ordinary Hook

`createStore` does not add new state syntax. A Store may use:

- `useState`, `useReducer`, and `useRef`
- your own custom Hooks
- React Context
- Hooks from React Query, SWR, or another SDK
- another Kerros Store

For example, call a connection-owning SDK Hook once:

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

Components can then select `messages`, `status`, or `send` without creating another SDK connection.

## The Provider sets the scope

Every mounted Provider creates an isolated Store instance:

```tsx
<CounterProvider>
  <Counter />
</CounterProvider>

<CounterProvider>
  <Counter />
</CounterProvider>
```

These counters do not share data. Put a Provider at the application root for application-wide state, or around an editor when only that editor needs the Store.

Kerros does not create a hidden global singleton. The component tree shows where a Store is created and who can use it.

## When to use Kerros

Kerros is useful when:

- several components need to share one group of Hook state
- an SDK Hook should run once and expose data to several components
- a large Store should be split by route, workspace, or feature
- every test needs a fresh Store instance
- one page needs several isolated instances of the same Store

Keep `useState` local when only one component needs the state. Choose a standalone external Store when the state must live completely outside React.

Continue with [Quick start](./getting-started) to build a complete task Store.
