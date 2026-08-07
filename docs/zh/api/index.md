# API 参考

`createStore` 是默认 API。`bindStore` 是高级集成 API，只用于已经由 Headless External Store 持有的状态。

## `createStore(useModel)`

把一个 React Hook 转成消费 Hook 和 Provider：

```tsx
function useCounterModel() {
  const [count, setCount] = useState(0)
  return { count, setCount }
}

const [useCounter, CounterProvider] = createStore(useCounterModel)
```

类型签名：

```ts
function createStore<TStore, TProps = Record<never, never>>(
  useModel: (props: TProps) => TStore,
): readonly [StoreHook<TStore>, StoreProvider<TProps>]
```

### `useModel`

`useModel` 就是 Store 的实现 Hook。它可以调用其他 React Hook，并把要共享的状态和动作放进返回对象：

```tsx
function useThemeModel() {
  const [dark, setDark] = useState(false)
  const toggle = () => setDark(v => !v)

  return { dark, toggle }
}

const [useTheme, ThemeProvider] = createStore(useThemeModel)
```

它必须遵守 React 的 Hooks 规则。

请把它定义成 `useXxxModel` 形式的顶层函数。匿名 initializer 在运行时仍然合法，但 React Compiler 的 `infer` 模式不会自动把它识别并编译为 Hook。

### 返回值

`createStore` 返回两个值：

```tsx
const [useTheme, ThemeProvider] = createStore(useThemeModel)
```

- `useTheme`：组件或下游 Store 使用的 Hook
- `ThemeProvider`：创建并持有 Store 实例的 React 组件

建议按业务命名为 `useTheme`、`ThemeProvider`，不必重复添加 `Store`。

### Store Hook

Store Hook 必须传一个返回对象的 selector：

```tsx
const { dark, toggle } = useTheme(s => ({
  dark: s.dark,
  toggle: s.toggle,
}))
```

Kerros 用 `Object.is` 浅比较返回对象的顶层字段。选择字段不变时，组件不会因为 Store 的其他更新而重渲染。

Store Hook 只能在对应 Provider 内调用，否则会抛出：

```text
Kerros store hook must be used within its matching Provider
```

### Provider props

除了 `children`，Provider 的其他 props 都会传给 Store Hook：

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

每挂载一个 Provider，就会创建一个独立 Store 实例。

## 高级用法：`bindStore(name?)`

绝大多数应用不需要 `bindStore`。只有当某个库或 SDK 已经在 React 外持有权威状态时，才使用它。

### 为什么需要这个 API

已有的 External Store 已经拥有自己的快照、订阅和生命周期。如果再用 `createStore` 包装它，Provider 会先订阅完整快照，再通过第二个容器重新发布每次更新；如果每个 SDK 适配层都手写 Context 和 `useSyncExternalStoreWithSelector`，又会重复基础设施代码。

`bindStore` 只补齐缺少的 React 集成边界：

- Context 负责限定原 Store 实例的作用域
- 消费 Hook 直接从原快照选择字段
- 原 Store 仍是唯一的状态所有者和发布者

可以把它理解为“External Store 的 React 适配器”，而不是“状态同步器”：

```text
External Store 持有状态
        ↓ subscribe 通知变化
React 调用 getSnapshot 读取当前快照
        ↓ selector 选择字段
只有选择结果变化的组件重渲染
```

React 不保存第二份状态，Context 也不保存快照。Context 只负责让组件找到当前 Provider 绑定的 Store 实例。

### 使用条件

只有同时满足以下条件时才使用 `bindStore`：

- Store 独立于 React 存在
- `getSnapshot` 返回缓存过的不可变快照
- `getSnapshot` 和 `subscribe` 引用稳定，并且调用时不依赖 `this`

状态来自 `useState`、`useReducer`、SDK Hook 或其他 custom Hook 时，使用 `createStore`。

### 完整计时器示例

下面的 `Timer` 独立于 React 维护秒数、定时任务和订阅：

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

在模块顶层创建 React 绑定。这里只需要 selector Hook 和 Provider：

```tsx
const [useTimer, TimerBindingProvider] = bindStore<Timer>('Timer')
```

创建 Timer 的组件仍然拥有实例和生命周期：

```tsx
function TimerExample() {
  const [timer] = useState(() => new Timer())

  useEffect(() => () => timer.stop(), [timer])

  return (
    <TimerBindingProvider store={timer}>
      <TimerValue />
      <button onClick={timer.start}>开始</button>
      <button onClick={timer.stop}>停止</button>
    </TimerBindingProvider>
  )
}
```

展示组件只选择自己需要的秒数：

```tsx
function TimerValue() {
  const { seconds } = useTimer(s => ({
    seconds: s.seconds,
  }))

  return <span>已经运行 {seconds} 秒</span>
}
```

Timer 每秒发布新快照时，Kerros 通知 React 重新读取；如果 selector 结果没有变化，对应组件不会重渲染。

### 类型签名

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
  () => TStore,
]
```

可选的 `name` 只用于设置 React DevTools 中展示的 Provider 和 Context 名称。

### 使用方式

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

- 第一个 Hook 使用 selector 读取快照，浅比较语义与 `createStore` 相同
- Provider 的 Context 只保存传入的 Store 实例
- 第三个 Hook 返回当前 Provider 绑定的原 Store 实例，但不订阅快照
- 消费者直接通过 `getSnapshot` 和 `subscribe` 订阅，不创建中间快照容器

读取快照时使用 selector Hook：

```tsx
const { running } = useStream(s => ({
  running: s.running,
}))
```

### 实例 Hook：仅用于高级集成

`useStreamInstance` 是真正的 React Hook，只能在对应 Provider 的后代组件或其他 Hook 中调用。它适合命令式调用，或把当前 Store 实例装配给另一个 Headless 服务：

```tsx
function StreamControls() {
  const stream = useStreamInstance()

  return <button onClick={stream.stop}>停止</button>
}
```

它只从 Context 读取原实例，不订阅快照变化。组件需要根据状态渲染时，仍然使用 `useStream(selector)`；不要用 `useStreamInstance().getSnapshot()` 绕过 selector，否则 React 不会获得正确的细粒度订阅。

实例的创建、启动、停止和销毁仍由 Provider 外部的所有者负责。创建者本来就持有实例时直接使用即可；第三个 Hook 只是供深层后代做命令式集成的逃生口，不是默认读取方式。

## React 版本

| React | 使用的订阅实现 |
| --- | --- |
| React 17 | `use-sync-external-store` 兼容 shim |
| React 18 | 可用时使用 React 原生 `useSyncExternalStore` |
| React 19 | 使用 React 原生能力，并兼容 React Compiler |

Kerros 自身不要求启用 React Compiler。

## 服务端渲染

Kerros 为 `useSyncExternalStore` 提供 `getServerSnapshot`。`createStore` 使用 Provider 的初始结果作为服务端快照，并在提交后发布后续结果；`bindStore` 在服务端渲染期间直接读取绑定 Store。
