# Référence API

## `createStore`

```ts
function createStore<TStore, TProps = Record<never, never>>(
  useStoreValue: (props: TProps) => TStore,
): readonly [StoreHook<TStore>, StoreProvider<TProps>]
```

Le Hook d'entrée peut utiliser les Hooks React et reçoit toutes les props du Provider sauf `children`.

Le Hook de store renvoyé exige un sélecteur qui retourne un objet. Les champs du premier niveau sont comparés superficiellement. Un appel hors du Provider correspondant déclenche une erreur explicite.

Chaque Provider possède un conteneur de store externe stable. Il publie les snapshots uniquement aux abonnés concernés sans modifier la valeur du Context.

Kerros prend en charge React `^17`, `^18` et `^19` grâce à `use-sync-external-store/shim/with-selector`.
