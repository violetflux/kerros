# Migration von hox

Ersetze die Factory durch `createStore` und destrukturiere in jeder Komponente direkt die benötigten Felder. Kerros verfolgt die Zugriffe automatisch:

```tsx
const { count, setCount } = useCounter()
```

Kerros bietet absichtlich keinen Kompatibilitäts-Export und kein aggregiertes `store`-Feld. Große globale Stores sollten in Domänen-Stores aufgeteilt und ihre Provider in Abhängigkeitsreihenfolge verschachtelt werden.

`useEffectEvent` dient nicht zur Stabilisierung von Aktionen. Es gehört ausschließlich zu Ereignissen, die innerhalb eines Effects aufgerufen werden; öffentliche Store-Aktionen bleiben normale Funktionen.
