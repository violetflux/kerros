# Composition des stores

Un store peut consommer un autre store. Placez le Provider dont il dépend à l'extérieur :

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

Gardez le graphe de dépendances unidirectionnel. Si le Store A lit le Store B, le Store B ne doit pas lire le Store A. Chaque domaine conserve ainsi sa propre frontière d'abonnement sans masquer les dépendances dans un singleton global.
