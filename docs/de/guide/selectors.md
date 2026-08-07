# Automatisches Tracking und Selektoren

Standardmäßig werden gelesene Properties automatisch verfolgt:

```tsx
const { profile, save } = useSettings()
```

Verschachtelte Objekt- und Array-Zugriffe werden verfolgt; Änderungen an ungelesenen Feldern rendern die Komponente nicht neu. Das Ergebnis muss sofort gelesen und darf nicht gespeichert, verteilt oder weitergereicht werden.

Explizite Objekt-Selektoren bleiben für abgeleitete Werte und gemessene Hotspots verfügbar. Ihre obersten Felder werden mit `Object.is` verglichen. Wähle niemals den gesamten Store aus.

Aktionen sind normale React-Werte. Ohne React Compiler können die üblichen Memo-Werkzeuge genutzt werden, wenn stabile Identitäten relevant sind.
