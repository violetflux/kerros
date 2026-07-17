# Selector 与重渲染

Kerros 的 Store Hook 必须传 selector。selector 接收完整 Store，返回当前组件需要的对象。

## 选择一个字段

假设用户 Store 返回这些数据：

```tsx
import { createStore } from '@violetflux/kerros'
import { useState } from 'react'

const [useUser, UserProvider] = createStore(() => {
  const [profile, setProfile] = useState({
    name: 'Violet',
    city: 'Hangzhou',
  })
  const [online, setOnline] = useState(false)

  return { profile, setProfile, online, setOnline }
})
```

头像组件只需要在线状态：

```tsx
function Avatar() {
  const { online } = useUser(s => ({ online: s.online }))

  return <span>{online ? '在线' : '离线'}</span>
}
```

修改 `profile` 不会让 `Avatar` 重渲染，因为它只订阅了 `online`。

## 一次选择多个字段

selector 返回一个对象，所以可以把状态和动作一起取出来：

```tsx
function OnlineButton() {
  const { online, setOnline } = useUser(s => ({
    online: s.online,
    setOnline: s.setOnline,
  }))

  return (
    <button onClick={() => setOnline(!online)}>
      {online ? '设为离线' : '设为在线'}
    </button>
  )
}
```

selector 直接写在调用位置即可，不需要 `useCallback`。

## 可以选择深层字段

`s.profile.name` 这样的写法可以直接使用：

```tsx
const { name } = useUser(s => ({ name: s.profile.name }))
```

Kerros 比较的是 selector 返回对象的顶层字段。上面的顶层字段是 `name`，所以只有名字变化时组件才会重渲染；`profile.city` 变化不会影响它。

下面两种选择范围并不相同：

```tsx
// profile 对象引用变化时重渲染
const { profile } = useUser(s => ({ profile: s.profile }))

// 只有 name 变化时重渲染
const { name } = useUser(s => ({ name: s.profile.name }))
```

## 顶层浅比较

每次调用 selector 都会创建一个新对象：

```tsx
s => ({ online: s.online, setOnline: s.setOnline })
```

Kerros 不比较这个外层对象本身，而是用 `Object.is` 逐个比较 `online` 和 `setOnline`。两个字段都没变，选择结果就视为相同。

这也意味着不要在 selector 里临时创建数组或对象：

```tsx
// 每次都会得到新数组，无法保持相等
const { onlineUsers } = useUser(s => ({
  onlineUsers: s.users.filter(user => user.online),
}))
```

把这类派生值放回 Store Hook，并用普通 React 能力维护它的引用：

```tsx
const onlineUsers = useMemo(
  () => users.filter(user => user.online),
  [users],
)

return { users, onlineUsers }
```

组件再直接选择 `onlineUsers`：

```tsx
const { onlineUsers } = useUser(s => ({ onlineUsers: s.onlineUsers }))
```

## 不要选择整个 Store

下面的写法会让组件订阅所有字段：

```tsx
const { value } = useUser(s => ({ value: s }))
```

这样虽然能运行，但失去了 selector 的意义。组件应该直接选择自己使用的字段：

```tsx
const { name, online } = useUser(s => ({
  name: s.profile.name,
  online: s.online,
}))
```

Store 越大，选择范围越应该具体。
