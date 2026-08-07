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

Kerros lässt React-State dort, wo er natürlich hingehört: in Hooks und unter Providern. Automatisches Property-Tracking verhindert standardmäßig unnötige Renders; explizite Selektoren bleiben für abgeleitete Werte und Hotspots verfügbar.

- Ein Store ist ein normaler React Hook
- `useStore()` verfolgt gelesene Properties automatisch
- Explizite Selektoren sind eine fortgeschrittene Optimierung
- Jeder Provider besitzt eine isolierte Store-Instanz
- Stores lassen sich über einseitige Abhängigkeiten komponieren
- Unterstützt React 17, 18 und 19

> [!TIP]
> **Mit deinem Coding Agent installieren**: Füge diesen Satz in deinen Coding Agent ein, um Abhängigkeit und Projekt-Skill gemeinsam zu installieren.

```text
Installiere @violetflux/kerros mit dem Paketmanager dieses Projekts und führe danach npx skills add violetflux/kerros --skill kerros --agent '*' -y aus, um den Kerros Skill für alle kompatiblen Coding Agents zu installieren.
```

## Store erstellen

```tsx
import { createStore } from '@violetflux/kerros'
import { useState } from 'react'

function useCounterModel() {
  const [count, setCount] = useState(0)
  return { count, setCount }
}

export const [useCounter, CounterProvider] = createStore(useCounterModel)
```

Im Store Hook können weiterhin `useState`, `useReducer`, Context, SDK Hooks und eigene Hooks verwendet werden.

Definiere den Initializer als benannten Hook auf Modulebene, zum Beispiel `useCounterModel`. Anonyme Initializer funktionieren weiterhin zur Laufzeit, werden vom React Compiler im `infer`-Modus aber nicht automatisch als Hooks kompiliert.

## Provider einbinden und Werte lesen

```tsx
function Counter() {
  const { count, setCount } = useCounter()
  return <button onClick={() => setCount(count + 1)}>{count}</button>
}

function App() {
  return <CounterProvider><Counter /></CounterProvider>
}
```

Kerros verfolgt die beim Rendern gelesenen Properties. Änderungen an ungelesenen Feldern rendern `Counter` nicht neu; ein Deep-Vergleich des gesamten Stores findet nicht statt.

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
  useModel: (props: TProps) => TStore,
): readonly [StoreHook<TStore>, StoreProvider<TProps>]

const [useStream, StreamProvider] = bindStore<Stream>('Stream')
```

Der zurückgegebene Store Hook verwendet ohne Argument automatisches Tracking. Explizite Objekt-Selektoren sind für abgeleitete Werte und gemessene Hotspots verfügbar. Außerhalb des passenden Providers wird ein verständlicher Fehler ausgelöst.

`bindStore` ist eine fortgeschrittene Integration ausschließlich für einen bestehenden Headless External Store. Für normalen Hook-Zustand bleibt `createStore` die richtige Wahl. Der Context enthält nur die ursprüngliche Store-Instanz; Verbraucher verwenden `getSnapshot` und `subscribe` direkt.

## Dokumentation

- [Einführung](https://violetflux.github.io/kerros/de/guide/introduction)
- [Erste Schritte](https://violetflux.github.io/kerros/de/guide/getting-started)
- [Selektoren](https://violetflux.github.io/kerros/de/guide/selectors)
- [Store-Komposition](https://violetflux.github.io/kerros/de/guide/composition)
- [API](https://violetflux.github.io/kerros/de/api/)

[MIT License](https://github.com/violetflux/kerros/blob/main/LICENSE)
