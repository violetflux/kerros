# Modèles

## Initialiser avec les props du Provider

Toutes les props sauf `children` sont transmises au Hook du Store.

```tsx
const [useDocument, DocumentProvider] = createStore(
  ({ documentId }: { documentId: string }) => {
    const document = useDocumentQuery(documentId)
    return { documentId, document }
  },
)
```

Une modification des props réexécute normalement le Hook et publie le snapshot validé.

## Appeler un Hook SDK une seule fois

Un Hook SDK propriétaire d'une connexion ou d'un cache doit être appelé dans un seul Store.

```tsx
function useStreamStore() {
  const stream = useSdkStream()
  return {
    messages: stream.messages,
    status: stream.status,
    send: stream.send,
  }
}

export const [useStream, StreamProvider] = createStore(useStreamStore)
```

Les autres Stores sélectionnent depuis `useStream` au lieu de rappeler le Hook SDK. La connexion et le cache restent uniques.

## Découper un grand Store

Découpez selon la propriété, la durée de vie et la fréquence des mises à jour, pas selon la taille du fichier. Connexion, projection UI, navigation et brouillon peuvent appartenir à des Stores distincts.

```text
Stream → Thread → Sender
   ↑         Navigation
```

Des dépendances unidirectionnelles empêchent un brouillon très actif de rendre à nouveau les consumers de navigation.

## Éviter les projections trop larges

```tsx
// À éviter
const { store } = useApp(s => ({ store: s }))

// À préférer
const { threadId, selectThread } = useApp(s => ({
  threadId: s.threadId,
  selectThread: s.selectThread,
}))
```

Les actions publiques sont des fonctions ordinaires. `useEffectEvent` est réservé aux événements appelés depuis un Effect.
