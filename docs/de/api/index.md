# API-Referenz

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

Der Eingabe-Hook darf React Hooks verwenden und erhält alle Provider-Props außer `children`.

Definiere ihn als Top-Level-Funktion mit einem Namen wie `useXxxModel`. Ein anonymer Initializer bleibt zur Laufzeit gültig, wird vom React Compiler im `infer`-Modus aber nicht automatisch als Hook erkannt und kompiliert.

Ohne Argument verwendet der Store Hook automatisches Property-Tracking. Explizite Objekt-Selektoren bleiben für abgeleitete Werte und gemessene Hotspots verfügbar; ihre obersten Felder werden flach verglichen. Außerhalb des Providers wird ein eindeutiger Fehler ausgelöst.

Jeder Provider besitzt einen stabilen External-Store-Container. Snapshots werden nur an ausgewählte Abonnenten gemeldet, ohne den Context-Wert zu ändern.

## Fortgeschrittene Integration: `bindStore`

Normalerweise ist `createStore` die richtige Wahl. Nur wenn ein bestehender Headless External Store stabile Funktionen `getSnapshot` und `subscribe` bereitstellt, bindet `bindStore` ihn direkt, ohne Snapshots zu kopieren.

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

Der Context enthält nur die ursprüngliche Store-Instanz; der erste Hook verwendet standardmäßig automatisches Tracking. `useStreamInstance` ist nur für imperative Zugriffe gedacht und abonniert keine Snapshots. Gerenderter Zustand muss den ersten Hook verwenden.

Kerros unterstützt React `^17`, `^18` und `^19` über `use-sync-external-store/shim/with-selector`.
