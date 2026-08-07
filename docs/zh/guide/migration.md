# 从 hox 迁移

Kerros 的 `createStore` API 和 hox 很接近，结构上的主要区别是 Kerros 要求显式挂载 Provider。0.2 默认对无 selector 读取启用自动属性追踪。

## 迁移普通 Store

hox 的普通 Store：

```tsx
import { createStore } from 'hox'

export const [useCounter, CounterProvider] = createStore(() => {
  const [count, setCount] = useState(0)
  return { count, setCount }
})
```

Store 定义基本不用改，只替换导入：

```tsx
import { createStore } from '@violetflux/kerros'

function useCounterModel() {
  const [count, setCount] = useState(0)
  return { count, setCount }
}

export const [useCounter, CounterProvider] = createStore(useCounterModel)
```

原来的组件可以继续保持简洁读取：

```tsx
const { count, setCount } = useCounter()
```

Kerros 会自动追踪渲染期间读取的属性。高级派生值或经过测量的性能热点仍可使用显式 selector：

```tsx
const { count, setCount } = useCounter(s => ({
  count: s.count,
  setCount: s.setCount,
}))
```

如果希望分阶段迁移，可以给 `createStore` 传 `{ tracking: false }`。此时无 selector 调用使用完整 Store 顶层浅比较；这是兼容与性能取舍，不是深比较。

## 迁移全局 Store

hox 可以通过 `createGlobalStore` 和 `HoxRoot` 隐式注册全局 Store：

```tsx
import { createGlobalStore } from 'hox'

export const [useAccount, getAccount] = createGlobalStore(() => {
  const [user, setUser] = useState<User | null>(null)
  return { user, setUser }
})
```

Kerros 不提供隐藏的全局 Store。改用 `createStore`：

```tsx
import { createStore } from '@violetflux/kerros'

function useAccountModel() {
  const [user, setUser] = useState<User | null>(null)
  return { user, setUser }
}

export const [useAccount, AccountProvider] = createStore(useAccountModel)
```

然后把 Provider 放到应用根部：

```tsx
createRoot(document.getElementById('root')!).render(
  <AccountProvider>
    <App />
  </AccountProvider>,
)
```

如果有多个根级 Store，就按依赖顺序嵌套：

```tsx
<AccountProvider>
  <TaskProvider>
    <App />
  </TaskProvider>
</AccountProvider>
```

## 替换 `getXxxStore`

Kerros 没有 `getAccount()` 这样的 React 外静态读取 API。组件和 Store 内统一通过 Store Hook 读取：

```tsx
const { user } = useAccount()
```

如果日志、请求拦截器或其他 React 外代码需要用户信息，应把需要的值作为参数传进去，或者把这部分状态交给真正独立于 React 的外部 Store。不要为了静态读取再维护第二份镜像状态。

## 拆分原来的大型 global store

迁移时不必把所有字段一次放进新的根 Store。可以按职责拆分：

```text
Account → Task → Editor
```

先创建底层 Store，再让上层 Store 通过无参数 Hook 和自动追踪读取它。输入草稿、弹窗开关这类高频局部状态也可以单独放到更近的 Provider 中。

## `useMemoizedFn` 与 `useEffectEvent`

Store 对组件暴露的动作使用普通函数即可。如果项目启用了 React Compiler，由 Compiler 处理它能够证明安全的引用稳定性；没有 Compiler 时，继续遵循普通 React 的函数引用规则。

React 19 的 `useEffectEvent` 只用于 Effect 内部事件，不用于包装按钮点击、提交动作或其他公共 Store 方法。

迁移完成后，可以全仓检查 `hox`、`HoxRoot`、`createGlobalStore`、`getXxxStore` 和 `useMemoizedFn` 是否还有残留。

建议安装 `@violetflux/eslint-plugin-kerros` 并默认启用 `recommendedTypeChecked`，提前发现 Proxy 逃逸、宽泛读取、快照修改、不稳定 Provider、错误 Effect Event action 和依赖循环。超大型类型化仓库评估压测取舍后可使用 `fastTypeChecked`。
