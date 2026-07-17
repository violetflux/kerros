# Store composition

Stores can consume other stores. Put the dependency Provider outside the dependent Provider:

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

Keep the dependency graph one-way. If Store A reads Store B, Store B must not read Store A. This gives each domain its own subscription boundary without hiding dependencies in a global singleton.
