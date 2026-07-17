# Einführung

Kerros ist eine kleine Brücke zwischen React Hooks, Context-Eigentümerschaft und gezielten External-Store-Abonnements.

State bleibt ein normaler Hook:

```tsx
function useCounterStore() {
  const [count, setCount] = useState(0)
  return { count, setCount }
}

const [useCounter, CounterProvider] = createStore(useCounterStore)
```

Der Provider bestimmt, **wo der Store existiert**. Der Selektor bestimmt, **welche Änderungen eine Komponente beobachtet**.

## Das gelöste Problem

React Context eignet sich für Eigentümerschaft und Dependency Injection, aber eine Änderung des Context value invalidiert alle Consumer. Ein External Store auf Modulebene bietet gezielte Abonnements, ist jedoch standardmäßig global und führt oft ein separates State-Modell ein.

Kerros hält beide Grenzen explizit:

| Aspekt | Kerros |
| --- | --- |
| State-Modell | Normale React Hooks |
| Eigentümerschaft | Position des Providers |
| Updates | `useSyncExternalStore`-Abonnements |
| Rerenders | Objekt-Selektor mit flachem Vergleich |
| Mehrere Instanzen | Provider mehrfach einbinden |
| Daten zwischen Stores | Einseitige Provider-Verschachtelung |

Context transportiert nur einen stabilen Abonnement-Container, nicht den wechselnden Snapshot. Der Store Hook veröffentlicht bestätigte Snapshots und jede Komponente abonniert nur ihre Projektion.

## Geeignete Anwendungsfälle

- State gehört zu Route, Workspace, Editor, Session oder Feature-Teilbaum
- React Hooks oder SDK Hooks sollen direkt im Store verwendet werden
- gezielte Abonnements ohne eine große globale Rerender-Domäne
- Initialisierung einer Store-Instanz über Provider props
- isolierte Store-Instanzen in Tests

Store-Abhängigkeiten müssen einseitig bleiben. Wenn B aus A liest, muss A außen liegen und darf nicht zurück aus B lesen.

Weiter geht es mit [Erste Schritte](./getting-started) oder [Store-Komposition](./composition).
