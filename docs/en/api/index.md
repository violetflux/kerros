# API reference

`createStore` is the default API. `bindStore` is an advanced integration API for state that is already owned by a headless external Store.

## `createStore(useModel, options?)`

Turn a React Hook into a consumer Hook and Provider:

```tsx
function useCounterModel() {
  const [count, setCount] = useState(0)
  return { count, setCount }
}

const [useCounter, CounterProvider] = createStore(useCounterModel)
```

Type signature:

```ts
function createStore<TStore, TProps = Record<never, never>>(
  useModel: (props: TProps) => TStore,
  options?: StoreOptions,
): readonly [StoreHook<TStore>, StoreProvider<TProps>]

interface StoreOptions {
  tracking?: boolean
}
```

### `useModel`

`useModel` is the Store implementation Hook. It may call other React Hooks and return the state and actions that should be shared:

```tsx
function useThemeModel() {
  const [dark, setDark] = useState(false)
  const toggle = () => setDark(v => !v)

  return { dark, toggle }
}

const [useTheme, ThemeProvider] = createStore(useThemeModel)
```

It must follow the Rules of Hooks.

Define it as a top-level function named `useXxxModel`. An anonymous initializer remains valid at runtime, but React Compiler `infer` mode does not automatically recognize and compile it as a Hook.

### Return value

`createStore` returns two values:

```tsx
const [useTheme, ThemeProvider] = createStore(useThemeModel)
```

- `useTheme` is the Hook used by components or dependent Stores
- `ThemeProvider` is the React component that creates and owns a Store instance

Domain names such as `useTheme` and `ThemeProvider` are recommended; repeating `Store` is optional.

### Store Hook

The selector-free overload enables automatic property tracking by default:

```tsx
const { dark, toggle } = useTheme()
```

Kerros tracks object, array, and nested properties read during render. A component does not rerender when an unread path changes. The complete Store is not deep-compared.

Pass an object-returning selector for advanced derived values or measured hot spots:

```tsx
const { dark, toggle } = useTheme(s => ({
  dark: s.dark,
  toggle: s.toggle,
}))
```

Kerros shallowly compares the returned object's top-level fields with `Object.is`. The component does not rerender for other Store updates while those selected fields stay equal.

Set `tracking: false` when creating the Store to make selector-free calls compare the complete Store at the top level with shallow equality:

```tsx
const [useTheme, ThemeProvider] = createStore(useThemeModel, {
  tracking: false,
})
```

Primitive Store snapshots use `Object.is`. `Map`, `Set`, class instances, and other non-plain objects are atomic and change only when their reference changes. All snapshots must be immutable; publish a new reference for every observable change.

The selector-free result is the current component's read-only tracked snapshot. You may destructure it, keep it in a render-local variable, return it from a custom Hook, or pass it to a synchronously rendered child. Do not mutate it or retain it in state, a ref, a module variable, or a long-lived cache as a live state object; spread, rest destructuring, enumeration, and serialization create broad subscriptions.

Calling the Hook outside its matching Provider throws:

```text
Kerros store hook must be used within its matching Provider
```

### Provider props

All Provider props except `children` are passed to the Store Hook:

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
<CounterProvider initialCount={10}>
  <Counter />
</CounterProvider>
```

Every mounted Provider creates an independent Store instance.

## Advanced: `bindStore(name?)`

Most applications do not need `bindStore`. Use it only when a library or SDK already owns authoritative state outside React.

### Why this API exists

An existing external Store already has its own snapshot, subscriptions, and lifecycle. Wrapping that snapshot in `createStore` would add a Provider-level subscription and republish every snapshot through a second container. Reimplementing Context plus `useSyncExternalStoreWithSelector` in every SDK adapter duplicates infrastructure instead.

`bindStore` fills only the missing React integration boundary:

- Context scopes the original Store instance
- consumer Hooks select directly from the original snapshot
- the original Store remains the only state owner and publisher

Think of it as a React adapter for an external Store, not a state synchronizer:

```text
External Store owns state
        ↓ subscribe reports a change
React calls getSnapshot for the current snapshot
        ↓ automatic tracking observes reads
Only consumers whose read fields changed rerender
```

React does not keep a second state copy, and Context does not carry snapshots. Context only lets consumers find the Store instance bound by the current Provider.

### Requirements

Use `bindStore` only when all of these are true:

- the Store exists independently of React
- `getSnapshot` returns a cached immutable snapshot
- `getSnapshot` and `subscribe` are stable functions callable without a receiver

For state created by `useState`, `useReducer`, an SDK Hook, or another custom Hook, use `createStore`.

### Complete timer example

This `Timer` owns its seconds, interval, and subscriptions independently of React:

```ts
interface TimerSnapshot {
  running: boolean
  seconds: number
}

class Timer {
  private interval?: ReturnType<typeof setInterval>
  private listeners = new Set<() => void>()
  private seconds = 0
  private snapshot: TimerSnapshot = {
    running: false,
    seconds: 0,
  }

  getSnapshot = () => this.snapshot

  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  start = () => {
    if (this.interval)
      return

    this.interval = setInterval(() => {
      this.seconds += 1
      this.publish()
    }, 1000)

    this.publish()
  }

  stop = () => {
    if (!this.interval)
      return

    clearInterval(this.interval)
    this.interval = undefined
    this.publish()
  }

  private publish() {
    this.snapshot = {
      running: Boolean(this.interval),
      seconds: this.seconds,
    }

    for (const listener of this.listeners)
      listener()
  }
}
```

Create the React binding at module scope. This example only needs the tracked Store Hook and Provider:

```tsx
const [useTimer, TimerBindingProvider] = bindStore<Timer>('Timer')
```

The component that creates the Timer still owns its instance and lifecycle:

```tsx
function TimerExample() {
  const [timer] = useState(() => new Timer())

  useEffect(() => () => timer.stop(), [timer])

  return (
    <TimerBindingProvider store={timer}>
      <TimerValue />
      <button onClick={timer.start}>Start</button>
      <button onClick={timer.stop}>Stop</button>
    </TimerBindingProvider>
  )
}
```

The display reads only the seconds it needs:

```tsx
function TimerValue() {
  const { seconds } = useTimer()

  return <span>Running for {seconds} seconds</span>
}
```

Each Timer publication tells React to read again. If the fields observed by automatic tracking stay equal, that consumer does not rerender.

### Type signature

```ts
interface ExternalStore<TSnapshot> {
  getSnapshot: () => TSnapshot
  subscribe: (listener: () => void) => () => void
}

function bindStore<
  TStore extends ExternalStore<TSnapshot>,
  TSnapshot = ExternalStoreSnapshot<TStore>,
>(
  nameOrOptions?: string | StoreOptions,
  options?: StoreOptions,
): readonly [
  StoreHook<TSnapshot>,
  StoreProvider<{ store: TStore }>,
  () => TStore,
]
```

The optional `name` only sets the generated Provider and Context names shown in React DevTools.

### Usage

```tsx
const [
  useStream,
  StreamBindingProvider,
  useStreamInstance,
] = bindStore<Stream>('Stream')

<StreamBindingProvider store={stream}>
  <App />
</StreamBindingProvider>
```

- the first Hook uses the same selector-free automatic tracking as `createStore`
- the Provider stores only the supplied Store instance in Context
- the third Hook returns the original Store bound by the current Provider without subscribing to its snapshot
- consumers subscribe directly through `getSnapshot` and `subscribe`; no intermediate snapshot container is created

Read snapshots through the tracked Store Hook:

```tsx
const { running } = useStream()
```

Selector-free automatic tracking and `tracking: false` use the same semantics as `createStore`. The bound Store must return a cached immutable snapshot; mutating a previous snapshot or allocating a fresh object from every `getSnapshot()` call breaks React's external Store contract.

### Instance Hook: advanced integrations only

`useStreamInstance` is a real React Hook. Call it only inside descendants of the matching Provider or from another Hook. Use it for imperative commands or to supply the current Store instance to another headless service:

```tsx
function StreamControls() {
  const stream = useStreamInstance()

  return <button onClick={stream.stop}>Stop</button>
}
```

It only reads the original instance from Context and does not subscribe to snapshot changes. Components that render state must still use `useStream()` to obtain a tracked snapshot; explicit selectors remain available for derived values and measured hot spots. Do not replace that with `useStreamInstance().getSnapshot()`, because React would not receive the correct focused subscription.

The owner outside the Provider remains responsible for creating, starting, stopping, and disposing the instance. A creator that already holds the instance should use it directly. The third Hook is an escape hatch for deeply nested imperative integrations, not the default read API.

Reactive Effects should read values from the tracked snapshot during render and declare correct dependencies. Use the instance Hook only for imperative latest-state reads from an Effect or `useEffectEvent` that do not drive rendering. `useEffectEvent` is not a public action-stabilization API and must not be returned as a Store action.

## ESLint plugin

Use the separate type-aware plugin to enforce the tracked-read, selector, immutable snapshot, Provider, Effect Event, and Store dependency constraints:

```js
import kerros from '@violetflux/eslint-plugin-kerros'

export default [kerros.configs.recommendedTypeChecked]
```

`recommendedTypeChecked` enables all rules. `fastTypeChecked` keeps type-aware Kerros identity but disables the most expensive whole-program and deep-alias checks for very large repositories. Both require TypeScript `projectService`; the plugin supports complete TS/TSX files rather than incomplete Markdown snippets.

## React versions

| React | Subscription implementation |
| --- | --- |
| React 17 | `use-sync-external-store` compatibility shim |
| React 18 | React's native `useSyncExternalStore` when available |
| React 19 | React's native implementation, compatible with React Compiler |

React Compiler is optional.

## Server rendering

Kerros supplies `getServerSnapshot` to `useSyncExternalStore`. A `createStore` Provider uses its initial result for the server snapshot and publishes later values only after commit. A `bindStore` Provider reads the bound Store directly during server rendering.
