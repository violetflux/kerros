# Store-Komposition

Stores können andere Stores verwenden. Der Provider der Abhängigkeit steht außen:

```tsx
function useSessionStoreValue() {
  const [user, setUser] = useState<User | null>(null)
  return { user, setUser }
}

const [useSession, SessionProvider] = createStore(useSessionStoreValue)

function usePermissionsStoreValue() {
  const { user } = useSession(s => ({ user: s.user }))
  return { canEdit: user?.role === 'editor' }
}

const [usePermissions, PermissionsProvider] = createStore(usePermissionsStoreValue)
```

Halte den Abhängigkeitsgraphen einseitig. Wenn Store A Store B liest, darf Store B nicht wiederum Store A lesen. So besitzt jede Domäne ihre eigene Abonnementgrenze, ohne Abhängigkeiten in einem globalen Singleton zu verstecken.
