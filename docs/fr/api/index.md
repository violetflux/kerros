# Référence API

## `createStore`

```ts
function createStore<TStore, TProps = Record<never, never>>(
  useStoreValue: (props: TProps) => TStore,
): readonly [StoreHook<TStore>, StoreProvider<TProps>]
```

```tsx
function useCounterStoreValue() {
  const [count, setCount] = useState(0)
  return { count, setCount }
}

const [useCounter, CounterProvider] = createStore(useCounterStoreValue)
```

Le Hook d'entrée peut utiliser les Hooks React et reçoit toutes les props du Provider sauf `children`.

Définissez-le comme une fonction de premier niveau nommée selon la forme `useXxxStoreValue`. Un initializer anonyme reste valide à l'exécution, mais React Compiler ne le reconnaît ni ne le compile automatiquement comme Hook en mode `infer`.

Le Hook de store renvoyé exige un sélecteur qui retourne un objet. Les champs du premier niveau sont comparés superficiellement. Un appel hors du Provider correspondant déclenche une erreur explicite.

Chaque Provider possède un conteneur de store externe stable. Il publie les snapshots uniquement aux abonnés concernés sans modifier la valeur du Context.

## Intégration avancée : `bindStore`

Utilisez normalement `createStore`. Seulement lorsqu'un Headless External Store existant expose des fonctions `getSnapshot` et `subscribe` stables, `bindStore` le lie directement sans copier ses snapshots.

```tsx
const [useStream, StreamProvider] = bindStore<Stream>('Stream')

<StreamProvider store={stream}>
  <App />
</StreamProvider>
```

Le Context ne contient que l'instance d'origine et le premier Hook s'y abonne avec un sélecteur. Le propriétaire qui crée l'instance reste responsable de son démarrage, de son arrêt, de sa destruction et des accès impératifs.

Kerros prend en charge React `^17`, `^18` et `^19` grâce à `use-sync-external-store/shim/with-selector`.
