# API reference

`createStore` is the default API. `bindStore` is an advanced integration API for state that is already owned by a headless external Store.

## `createStore(useStoreValue)`

Turn a React Hook into a consumer Hook and Provider:

```tsx
function useCounterStoreValue() {
  const [count, setCount] = useState(0)
  return { count, setCount }
}

const [useCounter, CounterProvider] = createStore(useCounterStoreValue)
```

Type signature:

```ts
function createStore<TStore, TProps = Record<never, never>>(
  useStoreValue: (props: TProps) => TStore,
): readonly [StoreHook<TStore>, StoreProvider<TProps>]
```

### `useStoreValue`

`useStoreValue` is the Store implementation Hook. It may call other React Hooks and return the state and actions that should be shared:

```tsx
function useThemeStoreValue() {
  const [dark, setDark] = useState(false)
  const toggle = () => setDark(v => !v)

  return { dark, toggle }
}

const [useTheme, ThemeProvider] = createStore(useThemeStoreValue)
```

It must follow the Rules of Hooks.

Define it as a top-level function named `useXxxStoreValue`. An anonymous initializer remains valid at runtime, but React Compiler `infer` mode does not automatically recognize and compile it as a Hook.

### Return value

`createStore` returns two values:

```tsx
const [useTheme, ThemeProvider] = createStore(useThemeStoreValue)
```

- `useTheme` is the Hook used by components or dependent Stores
- `ThemeProvider` is the React component that creates and owns a Store instance

Domain names such as `useTheme` and `ThemeProvider` are recommended; repeating `Store` is optional.

### Store Hook

The Store Hook requires an object-returning selector:

```tsx
const { dark, toggle } = useTheme(s => ({
  dark: s.dark,
  toggle: s.toggle,
}))
```

Kerros shallowly compares the returned object's top-level fields with `Object.is`. The component does not rerender for other Store updates while those selected fields stay equal.

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

function useCounterStoreValue({ initialCount }: CounterProps) {
  const [count, setCount] = useState(initialCount)
  return { count, setCount }
}

const [useCounter, CounterProvider] = createStore(useCounterStoreValue)
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
        ↓ selector chooses fields
Only consumers whose selection changed rerender
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

Create the React binding at module scope. This example only needs the selector Hook and Provider:

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

The display selects only the seconds it needs:

```tsx
function TimerValue() {
  const { seconds } = useTimer(snapshot => ({
    seconds: snapshot.seconds,
  }))

  return <span>Running for {seconds} seconds</span>
}
```

Each Timer publication tells React to read again. If the selector result stays equal, that consumer does not rerender.

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
  name?: string,
): readonly [
  StoreHook<TSnapshot>,
  StoreProvider<{ store: TStore }>,
]
```

The optional `name` only sets the generated Provider and Context names shown in React DevTools.

### Usage

```tsx
const [useStream, StreamBindingProvider] = bindStore<Stream>('Stream')

<StreamBindingProvider store={stream}>
  <App />
</StreamBindingProvider>
```

- the first Hook selects snapshot fields with the same shallow-equality behavior as `createStore`
- the Provider stores only the supplied Store instance in Context
- consumers subscribe directly through `getSnapshot` and `subscribe`; no intermediate snapshot container is created

Read snapshots through the selector Hook:

```tsx
const { running } = useStream(snapshot => ({
  running: snapshot.running,
}))
```

`bindStore` does not expose an instance Hook and does not create, start, stop, or dispose the external Store. Keep the instance and those responsibilities in the component or SDK layer that creates it, then pass the instance to other owners explicitly when needed.

## React versions

| React | Subscription implementation |
| --- | --- |
| React 17 | `use-sync-external-store` compatibility shim |
| React 18 | React's native `useSyncExternalStore` when available |
| React 19 | React's native implementation, compatible with React Compiler |

React Compiler is optional.

## Server rendering

Kerros supplies `getServerSnapshot` to `useSyncExternalStore`. A `createStore` Provider uses its initial result for the server snapshot and publishes later values only after commit. A `bindStore` Provider reads the bound Store directly during server rendering.
