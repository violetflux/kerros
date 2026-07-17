# Referencia API

## `createStore`

```ts
function createStore<TStore, TProps = Record<never, never>>(
  useStoreValue: (props: TProps) => TStore,
): readonly [StoreHook<TStore>, StoreProvider<TProps>]
```

El Hook de entrada puede usar Hooks de React y recibe todas las props del Provider excepto `children`.

El Hook de store devuelto exige un selector que retorne un objeto. Los campos del nivel superior se comparan superficialmente. Si se llama fuera de su Provider correspondiente, lanza un error claro.

Cada Provider posee un contenedor de store externo estable. Publica snapshots solo a los suscriptores seleccionados sin cambiar el valor del Context.

Kerros admite React `^17`, `^18` y `^19` mediante `use-sync-external-store/shim/with-selector`.
