# 自动追踪与 Selector

Kerros 的 Store Hook 默认使用自动属性追踪。调用时不传参数，并立即读取组件需要的字段。

## 默认：自动属性追踪

```tsx
function Avatar() {
  const { online } = useUser()
  return <span>{online ? '在线' : '离线'}</span>
}
```

Kerros 会记录组件渲染期间读取的对象、数组和深层属性。未读取字段发生变化时，`Avatar` 不会重渲染；Kerros 也不会深比较完整 Store。

追踪结果必须立即使用。解构和直接读取属性是安全写法：

```tsx
const { profile, setOnline } = useUser()
const name = useUser().profile.name
```

不要保存、返回、展开、序列化或传递完整结果，否则会扩大订阅范围，或让仅用于当前渲染的 Proxy 逃逸。

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
