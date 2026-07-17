---
name: kerros
description: Implement, refactor, review, or test shared React state with @violetflux/kerros. Use for createStore, Provider scoping, selector subscriptions, cross-Store composition, migrating from Hox or frequently changing React Context, preventing Context-wide rerenders, and React 17–19 compatibility.
---

# Kerros

Build shared state from ordinary React Hooks. Keep Provider scope and multiple instances while selectors prevent unrelated consumers from rerendering.

## Workflow

1. Inspect the project package manager, React version, existing state owner, Provider tree, and naming conventions.
2. Keep state local when only one component needs it. Create a Kerros Store only when several components need the same Hook state.
3. Group state by domain and identify one authoritative owner for every mutable value.
4. Create the Store, mount its Provider at the narrowest shared ancestor, and migrate consumers to focused selectors.
5. Order composed Providers from dependency to dependent and reject circular Store dependencies.
6. Run the project's typecheck, tests, lint, and the narrowest useful render test.

## Install

Use the package manager already present in the project:

```sh
npm install @violetflux/kerros
pnpm add @violetflux/kerros
yarn add @violetflux/kerros
bun add @violetflux/kerros
```

Kerros supports React 17, 18, and 19. Do not change package managers or create an additional lockfile.

## Core pattern

Write the Store as an ordinary Hook directly inside `createStore`. Name the public pair after the domain; do not repeat `Store` unless the codebase already requires it.

```tsx
import { createStore } from '@violetflux/kerros'
import { useState } from 'react'

export const [useCounter, CounterProvider] = createStore(() => {
  const [count, setCount] = useState(0)
  const increment = () => setCount(v => v + 1)

  return { count, increment }
})
```

Mount the Provider at the narrowest ancestor shared by all consumers:

```tsx
function App() {
  return (
    <CounterProvider>
      <Counter />
    </CounterProvider>
  )
}
```

Select an object containing only the fields the component reads. Keep the selector inline and use `s` as its parameter:

```tsx
function Counter() {
  const { count, increment } = useCounter(s => ({
    count: s.count,
    increment: s.increment,
  }))

  return <button onClick={increment}>{count}</button>
}
```

Kerros shallowly compares the selected object's top-level fields with `Object.is`. An update to an unselected field must not rerender this component.

## Provider props

Accept initialization or scope-specific inputs as Store Hook props. Pass them to the generated Provider instead of reading mutable module globals.

```tsx
const [useGreeting, GreetingProvider] = createStore((props: { initialName: string }) => {
  const [name, setName] = useState(props.initialName)
  return { name, setName }
})

<GreetingProvider initialName="Ada">
  <Profile />
</GreetingProvider>
```

## Compose Stores

An inner Store may call an outer Store Hook. Mount the dependency first and keep the graph one-way.

```tsx
const [useSession, SessionProvider] = createStore(() => {
  const [userId, setUserId] = useState<string>()
  return { userId, setUserId }
})

const [usePermissions, PermissionsProvider] = createStore(() => {
  const { userId } = useSession(s => ({ userId: s.userId }))
  return { canEdit: Boolean(userId) }
})

function Providers({ children }: PropsWithChildren) {
  return (
    <SessionProvider>
      <PermissionsProvider>{children}</PermissionsProvider>
    </SessionProvider>
  )
}
```

## Guardrails

- Require every Store read to use an object selector. Do not use array selectors.
- Select concrete fields and actions. Do not expose or select a changing aggregate Store snapshot.
- Do not wrap inline selectors with `useCallback`; Kerros handles selector identity.
- Keep public actions as ordinary functions. In React 19, use `useEffectEvent` only for events called from Effects, never as a public Store action.
- Do not mirror the same mutable state across Stores. Read it from its authoritative Store or move ownership.
- Do not create circular Store dependencies. Split ownership or invert the Provider order.
- Do not call a Store Hook outside its matching Provider; Kerros intentionally throws a clear error.
- Do not replace scoped Providers with a hidden module singleton. Put an application-wide Provider at the root only when the state is truly application-wide.
- Preserve SDK caches, subscriptions, and streams under a single owning Store when duplicating the Hook would duplicate external work.
- Respect the project's React version. Avoid React 19-only APIs when the consuming project still supports React 17 or 18.

## Migrate existing state

- From React Context: keep the Provider boundary, move the changing value into `createStore`, and replace broad `useContext` reads with focused selectors.
- From Hox: replace the factory with `createStore`, add the explicit Provider, remove compatibility exports, and migrate every consumer to an object selector.
- From a global Store: split by domain only when ownership and dependencies stay clear; do not split merely by field count.

## Verify

- Confirm all consumers are below the correct Provider and multiple Provider instances stay isolated.
- Test Provider props, Strict Mode, subscription cleanup, and the outside-Provider error when changing Store infrastructure.
- Add a render-count test showing that changing an unselected field does not rerender the consumer.
- Search for broad Store selections, array selectors, duplicate subscriptions, and dependency cycles.
- Run the consuming project's existing validation commands without introducing a new package manager.
