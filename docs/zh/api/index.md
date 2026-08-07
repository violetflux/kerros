# API 参考

`createStore` 是默认 API。`bindStore` 是高级集成 API，只用于已经由 Headless External Store 持有的状态。

## `createStore(useModel, options?)`

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
  options?: StoreOptions,
): readonly [StoreHook<TStore>, StoreProvider<TProps>]

interface StoreOptions {
  tracking?: boolean
}
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

默认不传 selector，开启自动属性追踪：

```tsx
const { dark, toggle } = useTheme()
```

Kerros 会记录渲染期间读取的对象、数组和深层属性；未读取路径变化时组件不会重渲染。它不会深比较完整 Store。

高级派生值或经过测量的性能热点可以传入返回对象的 selector：

```tsx
const { dark, toggle } = useTheme(s => ({
  dark: s.dark,
  toggle: s.toggle,
}))
```

Kerros 用 `Object.is` 浅比较返回对象的顶层字段。选择字段不变时，组件不会因为 Store 的其他更新而重渲染。

创建 Store 时设置 `tracking: false`，可以让无 selector 调用改为完整 Store 顶层浅比较：

```tsx
const [useTheme, ThemeProvider] = createStore(useThemeModel, {
  tracking: false,
})
```

基础类型 Store 快照使用 `Object.is`。`Map`、`Set`、类实例和其他非普通对象按整体引用处理。所有快照都必须不可变；每次可观察变化都发布新引用。

无 selector 的结果是当前组件的只读追踪快照。可以直接解构、保存在渲染局部变量中、从自定义 Hook 返回，或传给同步渲染的子组件继续读取。不要修改快照，也不要把它保存到 state、ref、模块变量或长期缓存后当作实时状态源；展开、rest 解构、枚举和序列化会形成宽泛订阅。

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
        ↓ 自动追踪记录读取字段
只有读取字段变化的组件重渲染
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

在模块顶层创建 React 绑定。这里只需要自动追踪 Store Hook 和 Provider：

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

展示组件只读取自己需要的秒数：

```tsx
function TimerValue() {
  const { seconds } = useTimer()

  return <span>已经运行 {seconds} 秒</span>
}
```

Timer 每秒发布新快照时，Kerros 通知 React 重新读取；如果自动追踪观察的字段没有变化，对应组件不会重渲染。

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
  nameOrOptions?: string | StoreOptions,
  options?: StoreOptions,
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

- 第一个 Hook 使用与 `createStore` 相同的无 selector 自动追踪
- Provider 的 Context 只保存传入的 Store 实例
- 第三个 Hook 返回当前 Provider 绑定的原 Store 实例，但不订阅快照
- 消费者直接通过 `getSnapshot` 和 `subscribe` 订阅，不创建中间快照容器

读取快照时使用自动追踪 Store Hook：

```tsx
const { running } = useStream()
```

无 selector 自动追踪和 `tracking: false` 的语义与 `createStore` 相同。External Store 必须返回缓存过的不可变快照；修改旧快照或让 `getSnapshot()` 每次创建新对象都会破坏 React External Store 契约。

### 实例 Hook：仅用于高级集成

`useStreamInstance` 是真正的 React Hook，只能在对应 Provider 的后代组件或其他 Hook 中调用。它适合命令式调用，或把当前 Store 实例装配给另一个 Headless 服务：

```tsx
function StreamControls() {
  const stream = useStreamInstance()

  return <button onClick={stream.stop}>停止</button>
}
```

它只从 Context 读取原实例，不订阅快照变化。组件需要根据状态渲染时，仍然使用 `useStream()` 获取追踪快照；显式 selector 只用于派生值和经过测量的性能热点。不要用 `useStreamInstance().getSnapshot()` 绕过订阅，否则 React 不会获得正确的细粒度更新。

实例的创建、启动、停止和销毁仍由 Provider 外部的所有者负责。创建者本来就持有实例时直接使用即可；第三个 Hook 只是供深层后代做命令式集成的逃生口，不是默认读取方式。

响应式 Effect 应在渲染期间从追踪快照读取值并声明正确依赖。只有不参与渲染、需要执行时读取最新状态的命令式 Effect 或 `useEffectEvent` 才使用实例 Hook。`useEffectEvent` 不是公共 action 稳定化 API，不能作为 Store action 返回。

## ESLint 插件

独立的类型感知插件可检查追踪读取、selector、不可变快照、Provider、Effect Event 和 Store 依赖等约束：

```js
import kerros from '@violetflux/eslint-plugin-kerros'

export default [kerros.configs.recommendedTypeChecked]
```

`recommendedTypeChecked` 启用全部规则。超大型仓库可使用 `fastTypeChecked`，继续通过类型识别 Kerros，同时关闭最昂贵的全程序和深层别名检查。两档都要求 TypeScript `projectService`；插件只支持完整 TS/TSX 文件，不分析不完整 Markdown 片段。

## React 版本

| React | 使用的订阅实现 |
| --- | --- |
| React 17 | `use-sync-external-store` 兼容 shim |
| React 18 | 可用时使用 React 原生 `useSyncExternalStore` |
| React 19 | 使用 React 原生能力，并兼容 React Compiler |

Kerros 自身不要求启用 React Compiler。

## 服务端渲染

Kerros 为 `useSyncExternalStore` 提供 `getServerSnapshot`。`createStore` 使用 Provider 的初始结果作为服务端快照，并在提交后发布后续结果；`bindStore` 在服务端渲染期间直接读取绑定 Store。
