# 自动追踪与 Selector

Kerros 的 Store Hook 默认使用自动属性追踪。调用时不传参数，返回值可以理解为当前组件的只读追踪快照。

## 默认：自动属性追踪

```tsx
function Avatar() {
  const { online } = useUser()
  return <span>{online ? '在线' : '离线'}</span>
}
```

Kerros 会记录组件渲染期间读取的对象、数组和深层属性。未读取字段发生变化时，`Avatar` 不会重渲染；Kerros 也不会深比较完整 Store。

快照可以直接解构，也可以像 Valtio 的 `useSnapshot` 一样先保存为当前渲染的局部变量：

```tsx
const { profile, setOnline } = useUser()
const snapshot = useUser()
const name = snapshot.profile.name
```

可以把快照或其中的嵌套对象传给同步渲染的子组件，子组件渲染期间的属性读取仍会被追踪。也可以从自定义 Hook 返回快照，在同一条渲染链中继续读取。

不要修改快照，也不要把它保存到 state、ref、模块变量或长期缓存后再当作实时状态源使用。`Object.keys`、对象展开、rest 解构和序列化会枚举完整对象，因此会形成宽泛订阅。

Effect 应在渲染期间读取所需值并声明正确依赖：

```tsx
const snapshot = useUser()
const name = snapshot.profile.name

useEffect(() => {
  reportName(name)
}, [name])
```

## 深层属性与条件读取

自动追踪会沿着实际读取的属性路径工作：

```tsx
function Profile() {
  const { profile } = useUser()
  return <strong>{profile.name}</strong>
}
```

这个组件会观察 `profile.name`。数组索引和属性枚举同样会被追踪；条件读取会在组件进入新分支的那次渲染后更新订阅。

`Map`、`Set`、类实例等原子对象按完整引用比较；基础类型 Store 快照使用 `Object.is`。

## React 值与严格身份

React Element 和 Portal 会在访问路径到达它们时被惰性识别，Kerros 直接返回原值，不创建 Proxy。标准 `useRef()` 和 `createRef()` 容器也可以直接返回；React 17、18、19 下的 DOM ref、`forwardRef` 和 `useImperativeHandle` 都不需要额外包装：

```tsx
function usePanelModel() {
  const containerRef = useRef<HTMLDivElement>(null)
  return { containerRef, icon: <PanelIcon /> }
}
```

只有第三方对象不能接受 Proxy，或者业务必须保留严格对象身份时，才使用 `ref()`：

```tsx
import { ref } from '@violetflux/kerros'

const client = ref(new ThirdPartyClient())
```

原子值只按引用观察。原地修改 `client` 或 `Map` / `Set` 不会发布更新；需要响应式变化时，应给对应快照字段换成新引用。标准 React ref 同样不是响应式状态，修改 `.current` 本身不会让组件重渲染。

## 高级用法：显式 Selector

派生值或经过测量的性能热点可以使用显式 selector：

```tsx
const { name, online } = useUser(s => ({
  name: s.profile.name,
  online: s.online,
}))
```

selector 直接写在调用位置，参数统一命名为 `s`。Kerros 用 `Object.is` 浅比较返回对象的顶层字段，外层对象可以每次重新创建。

不要在 selector 内创建不稳定的数组、对象或函数：

```tsx
// 避免：每次读取 Store 都会创建新数组
const { onlineUsers } = useUser(s => ({
  onlineUsers: s.users.filter(user => user.online),
}))
```

应在 model 中创建并缓存派生值，再选择稳定字段。也不要使用 `s => ({ value: s })` 选择完整 Store。

## 关闭自动追踪

只有当无 selector 调用需要对完整 Store 做顶层浅比较时，才设置 `{ tracking: false }`：

```tsx
const [useUser, UserProvider] = createStore(useUserModel, {
  tracking: false,
})
```

这是顶层浅比较，不是深比较；显式 selector 的行为不受影响。
