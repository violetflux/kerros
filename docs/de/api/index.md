# API-Referenz

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

Der Eingabe-Hook darf React Hooks verwenden und erhält alle Provider-Props außer `children`.

Definiere ihn als Top-Level-Funktion mit einem Namen wie `useXxxStoreValue`. Ein anonymer Initializer bleibt zur Laufzeit gültig, wird vom React Compiler im `infer`-Modus aber nicht automatisch als Hook erkannt und kompiliert.

Der zurückgegebene Store Hook verlangt einen Selektor, der ein Objekt zurückgibt. Felder auf oberster Ebene werden flach verglichen. Außerhalb des passenden Providers wird ein eindeutiger Fehler ausgelöst.

Jeder Provider besitzt einen stabilen External-Store-Container. Snapshots werden nur an ausgewählte Abonnenten gemeldet, ohne den Context-Wert zu ändern.

Kerros unterstützt React `^17`, `^18` und `^19` über `use-sync-external-store/shim/with-selector`.
