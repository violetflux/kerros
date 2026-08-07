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

El Hook de store devuelto exige un selector que retorne un objeto. Los campos del nivel superior se comparan superficialmente. Si se llama fuera de su Provider correspondiente, lanza un error claro.

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

El Context solo contiene la instancia original y el primer Hook se suscribe con un selector. El tercer Hook `useStreamInstance` devuelve la instancia original para integraciones imperativas avanzadas, pero no se suscribe a snapshots. Usa siempre el Hook con selector para renderizar estado. El propietario de la instancia sigue gestionando su creación, inicio, parada y destrucción.

Kerros admite React `^17`, `^18` y `^19` mediante `use-sync-external-store/shim/with-selector`.
