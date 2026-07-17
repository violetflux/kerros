# Store 组合

Store 可以消费其他 Store。把依赖方的 Provider 放在被依赖 Provider 内层：

```tsx
const [useSession, SessionProvider] = createStore(() => {
  const [user, setUser] = useState<User | null>(null)
  return { user, setUser }
})

const [usePermissions, PermissionsProvider] = createStore(() => {
  const { user } = useSession(s => ({ user: s.user }))
  return { canEdit: user?.role === 'editor' }
})

function Providers({ children }: PropsWithChildren) {
  return (
    <SessionProvider>
      <PermissionsProvider>{children}</PermissionsProvider>
    </SessionProvider>
  )
}
```

依赖图必须保持单向：如果 Store A 读取 Store B，Store B 就不能反向读取 Store A。这样每个领域都有独立订阅边界，也不会把依赖隐藏在全局单例里。
