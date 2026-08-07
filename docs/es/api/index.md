# Referencia API

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

El Hook de entrada puede usar Hooks de React y recibe todas las props del Provider excepto `children`.

Defínelo como una función de nivel superior con un nombre como `useXxxModel`. Un initializer anónimo sigue siendo válido en runtime, pero React Compiler no lo reconoce ni lo compila automáticamente como Hook en modo `infer`.

Sin argumentos, el Hook usa seguimiento automático de propiedades. Los selectores de objeto explícitos quedan para valores derivados y puntos críticos medidos; sus campos superiores se comparan superficialmente. Fuera del Provider lanza un error claro.

Cada Provider posee un contenedor de store externo estable. Publica snapshots solo a los suscriptores seleccionados sin cambiar el valor del Context.

## Integración avanzada: `bindStore`

Usa normalmente `createStore`. Solo cuando un Headless External Store existente expone funciones estables `getSnapshot` y `subscribe`, `bindStore` lo vincula directamente sin copiar sus snapshots.

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

El Context solo contiene la instancia original; el primer Hook usa seguimiento automático por defecto. `useStreamInstance` queda para lecturas imperativas y no se suscribe a snapshots. El estado renderizado debe usar el primer Hook.

Kerros admite React `^17`, `^18` y `^19` mediante `use-sync-external-store/shim/with-selector`.
