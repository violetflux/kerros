# Patrones

## Inicializar con props del Provider

Todas las props salvo `children` se pasan al Hook del Store.

```tsx
const [useDocument, DocumentProvider] = createStore(
  ({ documentId }: { documentId: string }) => {
    const document = useDocumentQuery(documentId)
    return { documentId, document }
  },
)
```

Cuando cambian las props, el Hook se ejecuta de nuevo con normalidad y publica el snapshot confirmado.

## Llamar un Hook de SDK una sola vez

Un Hook de SDK que posee una conexión o cache debe ejecutarse en un único Store.

```tsx
function useStreamStore() {
  const stream = useSdkStream()
  return {
    messages: stream.messages,
    status: stream.status,
    send: stream.send,
  }
}

export const [useStream, StreamProvider] = createStore(useStreamStore)
```

Los demás Stores seleccionan desde `useStream` en vez de volver a llamar al Hook. La conexión y la cache permanecen únicas.

## Dividir un Store grande

Divide por propiedad, tiempo de vida y frecuencia de actualización, no por tamaño de archivo. Conexión, proyección UI, navegación y borrador pueden pertenecer a Stores distintos.

```text
Stream → Thread → Sender
   ↑         Navigation
```

Las dependencias unidireccionales evitan que un borrador que cambia con frecuencia vuelva a renderizar consumers de navegación.

## Evitar proyecciones amplias

```tsx
// Evitar
const { store } = useApp(s => ({ store: s }))

// Preferir
const { threadId, selectThread } = useApp(s => ({
  threadId: s.threadId,
  selectThread: s.selectThread,
}))
```

Las acciones públicas son funciones normales. `useEffectEvent` se reserva para eventos llamados desde un Effect.
