# Store 조합

Store는 다른 Store를 사용할 수 있습니다. 의존 대상 Provider를 바깥에 배치하세요.

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

의존성 그래프는 단방향이어야 합니다. Store A가 Store B를 읽는다면 Store B가 Store A를 다시 읽어서는 안 됩니다. 이렇게 하면 전역 싱글턴에 의존성을 숨기지 않고 도메인별 구독 경계를 유지할 수 있습니다.
