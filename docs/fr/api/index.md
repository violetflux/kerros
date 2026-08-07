# Référence API

## `createStore`

```ts
function createStore<TStore, TProps = Record<never, never>>(
  useModel: (props: TProps) => TStore,
): readonly [StoreHook<TStore>, StoreProvider<TProps>]
```

```tsx
function useCounterModel() {
  const [count, setCount] = useState(0)
  return { count, setCount }
}

const [useCounter, CounterProvider] = createStore(useCounterModel)
```

Le Hook d'entrée peut utiliser les Hooks React et reçoit toutes les props du Provider sauf `children`.

Définissez-le comme une fonction de premier niveau nommée selon la forme `useXxxModel`. Un initializer anonyme reste valide à l'exécution, mais React Compiler ne le reconnaît ni ne le compile automatiquement comme Hook en mode `infer`.

Sans argument, le Hook utilise le suivi automatique des propriétés. Les sélecteurs d'objet explicites servent aux valeurs dérivées et aux points chauds mesurés ; leurs champs de premier niveau sont comparés superficiellement. Hors du Provider, une erreur explicite est levée.

Chaque Provider possède un conteneur de store externe stable. Il publie les snapshots uniquement aux abonnés concernés sans modifier la valeur du Context.

## Intégration avancée : `bindStore`

Utilisez normalement `createStore`. Seulement lorsqu'un Headless External Store existant expose des fonctions `getSnapshot` et `subscribe` stables, `bindStore` le lie directement sans copier ses snapshots.

```tsx
const [
  useStream,
  StreamProvider,
  useStreamInstance,
] = bindStore<Stream>('Stream')

<StreamProvider store={stream}>
  <App />
</StreamProvider>
```

Le Context ne contient que l'instance d'origine ; le premier Hook utilise le suivi automatique par défaut. `useStreamInstance` est réservé aux lectures impératives et ne s'abonne pas aux snapshots. L'état rendu doit utiliser le premier Hook.

Kerros prend en charge React `^17`, `^18` et `^19` grâce à `use-sync-external-store/shim/with-selector`.
