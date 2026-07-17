# Store の合成

Store は他の Store を利用できます。依存される Provider を外側に配置します。

```tsx
const [useSession, SessionProvider] = createStore(() => {
  const [user, setUser] = useState<User | null>(null)
  return { user, setUser }
})

const [usePermissions, PermissionsProvider] = createStore(() => {
  const { user } = useSession(s => ({ user: s.user }))
  return { canEdit: user?.role === 'editor' }
})
```

依存関係は一方向に保ってください。Store A が Store B を読む場合、Store B から Store A を読んではいけません。これにより、依存をグローバルなシングルトンに隠さず、ドメインごとの購読境界を維持できます。
