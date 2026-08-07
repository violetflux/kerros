# Muster

## Über Provider props initialisieren

Alle Provider props außer `children` werden an den Store Hook übergeben.

```tsx
function useDocumentModel({ documentId }: { documentId: string }) {
  const document = useDocumentQuery(documentId)
  return { documentId, document }
}

const [useDocument, DocumentProvider] = createStore(useDocumentModel)
```

Bei geänderten props läuft der Hook normal erneut und veröffentlicht den bestätigten Snapshot.

## Einen SDK Hook nur einmal aufrufen

Ein SDK Hook, der Verbindung oder Cache besitzt, sollte in genau einem Store aufgerufen werden.

```tsx
function useStreamModel() {
  const stream = useSdkStream()
  return {
    messages: stream.messages,
    status: stream.status,
    send: stream.send,
  }
}

export const [useStream, StreamProvider] = createStore(useStreamModel)
```

Andere Stores lesen die benötigten Felder direkt mit `useStream()`, statt den SDK Hook erneut aufzurufen. Kerros verfolgt die Zugriffe automatisch, sodass Verbindung und Cache einmalig bleiben.

## Einen großen Store teilen

Teile nach Eigentümerschaft, Lebensdauer und Updatefrequenz, nicht nach Dateigröße. Verbindung, UI-Projektion, Navigation und Entwurf können getrennte Stores sein.

```text
Stream → Thread → Sender
   ↑         Navigation
```

Einseitige Abhängigkeiten verhindern, dass ein häufig geänderter Entwurf Navigation-Consumer neu rendert.

## Breite Projektionen vermeiden

```tsx
// Vermeiden
const { store } = useApp(s => ({ store: s }))

// Bevorzugen
const { threadId, selectThread } = useApp()
```

Öffentliche Actions sind normale Funktionen. `useEffectEvent` gehört nur zu Ereignissen, die aus Effects aufgerufen werden.
