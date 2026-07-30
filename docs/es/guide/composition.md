# Composición de stores

Un store puede consumir otro store. Coloca fuera el Provider del que depende:

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

Mantén el grafo de dependencias en una sola dirección. Si el Store A lee el Store B, el Store B no debe leer el Store A. Así cada dominio conserva su propio límite de suscripción sin ocultar dependencias en un singleton global.
