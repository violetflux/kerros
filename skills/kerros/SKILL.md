---
name: kerros
description: Use when implementing, refactoring, reviewing, or testing shared React state with @violetflux/kerros, including createStore, bindStore, automatic property tracking, Provider scoping, explicit selectors, external Stores, cross-Store composition, Hox or Context migrations, and React 17–19 compatibility.
---

# Kerros

Build shared state from ordinary React Hooks. Keep Provider scope and multiple instances while automatic property tracking prevents unrelated consumers from rerendering by default.

## Workflow

1. Inspect the project package manager, React version, existing state owner, Provider tree, and naming conventions.
2. Keep state local when only one component needs it. Create a Kerros Store only when several components need the same Hook state.
3. Group state by domain and identify one authoritative owner for every mutable value.
4. Use `createStore` by default. Use the advanced `bindStore` API only when an authoritative headless external Store already exists.
5. Mount the Provider at the narrowest shared ancestor and let consumers immediately destructure the fields they read.
6. Order composed Providers from dependency to dependent and reject circular Store dependencies.
7. Run the project's typecheck, tests, lint, and the narrowest useful render test.

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

Define the Store implementation as a top-level named Hook ending in `Model`, then pass that function to `createStore`. The model may return both state and actions. Name the public pair after the domain; do not repeat `Store` unless the codebase already requires it.

```tsx
import { createStore } from '@violetflux/kerros'
import { useState } from 'react'

function useCounterModel() {
  const [count, setCount] = useState(0)
  const increment = () => setCount(v => v + 1)

  return { count, increment }
}

export const [useCounter, CounterProvider] = createStore(useCounterModel)
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

Call the Store Hook without a selector and immediately destructure the fields used by the component:

```tsx
function Counter() {
  const { count, increment } = useCounter()

  return <button onClick={increment}>{count}</button>
}
```

Kerros automatically tracks object, array, and nested property reads made during render. An update to an unread field must not rerender this component; Kerros does not deep-compare the complete Store.

## Subscription modes

- `useStore()` is the default and returns a read-only tracked render snapshot. It may be destructured, kept in a render-local variable, returned from a custom Hook, or passed to a synchronously rendered child. Do not mutate it or retain it as a live state object; spread, rest destructuring, enumeration, and serialization create broad subscriptions.
- `useStore(s => ({ ... }))` is the advanced path for derived values or measured hot spots. Keep the selector inline, name its parameter `s`, and return an object whose top-level fields are shallowly compared with `Object.is`.
- `createStore(model, { tracking: false })` and `bindStore({ tracking: false })` disable automatic tracking for selector-free calls and compare the complete Store at the top level instead.
- Primitive Store snapshots use `Object.is`. `Map`, `Set`, class instances, and other atomic objects are tracked by reference as a whole.

## Advanced external Store binding

Most applications should stop at `createStore`. Use `bindStore` only when a headless Store already owns authoritative state outside React and exposes stable `getSnapshot` and `subscribe` functions.

```tsx
import { bindStore } from '@violetflux/kerros'

export const [
  useStream,
  StreamBindingProvider,
  useStreamInstance,
] = bindStore<Stream>('Stream')
```

Mount the original instance without mirroring its snapshot:

```tsx
<StreamBindingProvider store={stream}>
  <App />
</StreamBindingProvider>
```

Treat `useStream()` as a read-only tracked render snapshot: destructure it, keep it in a render-local variable, return it from a custom Hook, or pass it to a synchronously rendered child. Use an explicit selector only for derived values or measured hot spots. Do not mutate the snapshot or retain it as a live state object. Use `useStreamInstance()` only in Provider descendants that need imperative commands, imperative latest-state reads that do not drive rendering, or must supply the current instance to another headless service. It reads Context without subscribing to snapshots, so never use `useStreamInstance().getSnapshot()` for rendered state.

Keep creation, start, stop, and disposal in the owner that creates the instance. If that owner already has the instance, use it directly instead of calling the instance Hook.

Do not replace this with `createStore(() => useSyncExternalStore(...))`; that subscribes the Provider to the entire external snapshot and republishes it through a second container.

## React Compiler and identity

- Generate `useXxxModel` as a top-level function by default. Anonymous initializers remain valid at runtime, but React Compiler `infer` mode does not automatically recognize and compile them as Hooks.
- Let the Store producer own action identity. React Compiler may stabilize ordinary returned actions; without Compiler support, use `useCallback` only when a consumer or effect requires a stable action reference.
- Do not claim that Kerros or `use-context-selector` can determine whether two newly allocated functions are semantically equivalent. Both can compare references, not function behavior.
- For explicit selectors, Kerros shallowly compares the selected object's top-level fields; `use-context-selector` applies `Object.is` to the selector result, so a newly allocated object is different.
- Do not recommend migrating to `use-context-selector` merely to avoid Context-wide rerenders. Kerros already keeps a stable Context container and publishes committed snapshots through `useSyncExternalStoreWithSelector`.

## Provider props

Accept initialization or scope-specific inputs as Store Hook props. Pass them to the generated Provider instead of reading mutable module globals.

```tsx
function useGreetingModel(props: { initialName: string }) {
  const [name, setName] = useState(props.initialName)
  return { name, setName }
}

const [useGreeting, GreetingProvider] = createStore(useGreetingModel)

<GreetingProvider initialName="Ada">
  <Profile />
</GreetingProvider>
```

## Compose Stores

An inner Store may call an outer Store Hook. Mount the dependency first and keep the graph one-way.

```tsx
function useSessionModel() {
  const [userId, setUserId] = useState<string>()
  return { userId, setUserId }
}

const [useSession, SessionProvider] = createStore(useSessionModel)

function usePermissionsModel() {
  const { userId } = useSession()
  return { canEdit: Boolean(userId) }
}

const [usePermissions, PermissionsProvider] = createStore(usePermissionsModel)

function Providers({ children }: PropsWithChildren) {
  return (
    <SessionProvider>
      <PermissionsProvider>{children}</PermissionsProvider>
    </SessionProvider>
  )
}
```

## Guardrails

- Use `createStore` for state owned by a React Hook. Treat `bindStore` as an advanced adapter for an already-authoritative headless Store; do not mirror that snapshot through another Hook Store.
- Prefer selector-free reads with immediate destructuring. Do not let the tracked result escape render through saving, returning, spreading, serializing, or passing it as an argument.
- When an explicit selector is justified, return an object of concrete fields and actions. Do not use array selectors or select the complete Store.
- Do not wrap inline selectors with `useCallback`; Kerros handles selector identity.
- Keep public actions as ordinary functions unless their reference stability is an explicit producer-side requirement. In React 19, use `useEffectEvent` only for events called from Effects, never as a public Store action.
- Do not mirror the same mutable state across Stores. Read it from its authoritative Store or move ownership.
- Do not create circular Store dependencies. Split ownership or invert the Provider order.
- Do not call a Store Hook outside its matching Provider; Kerros intentionally throws a clear error.
- Do not replace scoped Providers with a hidden module singleton. Put an application-wide Provider at the root only when the state is truly application-wide.
- Preserve SDK caches, subscriptions, and streams under a single owner. Bind an existing headless Store directly; call a connection-owning SDK Hook inside one `createStore` initializer only when no external Store instance exists.
- Respect the project's React version. Avoid React 19-only APIs when the consuming project still supports React 17 or 18.

## Migrate existing state

- From React Context: keep the Provider boundary, move the changing value into `createStore`, and replace broad `useContext` reads with selector-free tracked access.
- From Hox: replace the factory with `createStore`, add the explicit Provider, remove compatibility exports, and migrate consumers to immediate selector-free access.
- From a global Store: split by domain only when ownership and dependencies stay clear; do not split merely by field count.

## Verify

- Confirm all consumers are below the correct Provider and multiple Provider instances stay isolated.
- Search Kerros `createStore` calls and confirm every initializer references a top-level `useXxxModel` function. Search `bindStore` calls and confirm the supplied Store owns a stable immutable snapshot.
- Test Provider props, Strict Mode, subscription cleanup, and the outside-Provider error when changing Store infrastructure.
- Add a render-count test showing that changing an unread field does not rerender the consumer.
- Search for tracked-result escape, broad Store reads, whole-Store or array selectors, duplicate subscriptions, and dependency cycles.
- Run the consuming project's existing validation commands without introducing a new package manager.
