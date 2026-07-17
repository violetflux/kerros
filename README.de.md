<p align="center">
  <a href="https://violetflux.github.io/kerros/de/"><img src="https://raw.githubusercontent.com/violetflux/kerros/main/docs/public/banner.svg" alt="Kerros" width="100%" /></a>
</p>

<p align="center">
  <a href="https://github.com/violetflux/kerros/blob/main/README.md">English</a> ·
  <a href="https://github.com/violetflux/kerros/blob/main/README.zh-CN.md">简体中文</a> ·
  <a href="https://github.com/violetflux/kerros/blob/main/README.ja.md">日本語</a> ·
  <a href="https://github.com/violetflux/kerros/blob/main/README.ko.md">한국어</a> ·
  Deutsch ·
  <a href="https://github.com/violetflux/kerros/blob/main/README.fr.md">Français</a> ·
  <a href="https://github.com/violetflux/kerros/blob/main/README.es.md">Español</a>
</p>

Kerros lässt React-State dort, wo er natürlich hingehört: in Hooks und unter Providern. Die Bibliothek ergänzt gezielte Selector-Abonnements, ohne Reducer, Actions, Proxies oder globale Singletons vorzuschreiben.

- Ein Store ist ein normaler React Hook
- Selektoren geben ein Objekt mit den benötigten Werten zurück
- Oberste Felder werden flach mit `Object.is` verglichen
- Jeder Provider besitzt eine isolierte Store-Instanz
- Stores lassen sich über einseitige Abhängigkeiten komponieren
- Unterstützt React 17, 18 und 19

## Store erstellen

```tsx
import { createStore } from '@violetflux/kerros'
import { useState } from 'react'

export const [useCounter, CounterProvider] = createStore(() => {
  const [count, setCount] = useState(0)
  return { count, setCount }
})
```

Im Store Hook können weiterhin `useState`, `useReducer`, Context, SDK Hooks und eigene Hooks verwendet werden.

## Provider einbinden und Werte auswählen

```tsx
function Counter() {
  const { count, setCount } = useCounter(s => ({
    count: s.count,
    setCount: s.setCount,
  }))
  return <button onClick={() => setCount(count + 1)}>{count}</button>
}

function App() {
  return <CounterProvider><Counter /></CounterProvider>
}
```

Der Selektor darf inline stehen. Änderungen an nicht ausgewählten Feldern rendern `Counter` nicht neu.

## Installation

| Paketmanager | Befehl |
| --- | --- |
| npm | `npm install @violetflux/kerros` |
| pnpm | `pnpm add @violetflux/kerros` |
| Yarn | `yarn add @violetflux/kerros` |
| Bun | `bun add @violetflux/kerros` |

## Funktionsweise

Der Provider führt den Store Hook aus und gibt über Context nur einen stabilen Abonnement-Container weiter. Bestätigte Snapshots werden mit `subscribe/getSnapshot` veröffentlicht. Eine Komponente rendert nur neu, wenn sich ihre Auswahl ändert.

Ohne verstecktes Modul-Singleton kann derselbe Provider mehrfach eingebunden, über Props initialisiert, in Tests isoliert oder auf einen Teilbaum begrenzt werden.

## API

```ts
function createStore<TStore, TProps = Record<never, never>>(
  useStoreValue: (props: TProps) => TStore,
): readonly [StoreHook<TStore>, StoreProvider<TProps>]
```

Der zurückgegebene Store Hook verlangt einen Selektor, der ein Objekt liefert. Außerhalb des passenden Providers wird ein verständlicher Fehler ausgelöst. Strict Mode und Server Rendering werden unterstützt.

## Dokumentation

- [Einführung](https://violetflux.github.io/kerros/de/guide/introduction)
- [Erste Schritte](https://violetflux.github.io/kerros/de/guide/getting-started)
- [Selektoren](https://violetflux.github.io/kerros/de/guide/selectors)
- [Store-Komposition](https://violetflux.github.io/kerros/de/guide/composition)
- [API](https://violetflux.github.io/kerros/de/api/)

[MIT License](https://github.com/violetflux/kerros/blob/main/LICENSE)
