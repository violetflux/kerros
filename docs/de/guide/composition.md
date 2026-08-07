# Store-Komposition

Stores können andere Stores verwenden. Der Provider der Abhängigkeit steht außen:

```tsx
function useSessionModel() {
  const [user, setUser] = useState<User | null>(null)
  return { user, setUser }
}

const [useSession, SessionProvider] = createStore(useSessionModel)

function usePermissionsModel() {
  const { user } = useSession()
  return { canEdit: user?.role === 'editor' }
}

const [usePermissions, PermissionsProvider] = createStore(usePermissionsModel)
```

Halte den Abhängigkeitsgraphen einseitig. Wenn Store A Store B liest, darf Store B nicht wiederum Store A lesen. So besitzt jede Domäne ihre eigene Abonnementgrenze, ohne Abhängigkeiten in einem globalen Singleton zu verstecken.
