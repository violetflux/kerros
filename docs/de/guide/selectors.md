# Automatisches Tracking und Selektoren

Standardmäßig werden gelesene Properties automatisch verfolgt:

```tsx
const snapshot = useSettings()
const { profile, save } = snapshot
```

Der Rückgabewert ist ein schreibgeschützter Tracking-Snapshot für den aktuellen Render. Verschachtelte Objekt- und Array-Zugriffe werden verfolgt; Änderungen an ungelesenen Feldern rendern die Komponente nicht neu. Der Snapshot darf in einer renderlokalen Variable gehalten, aus einem custom Hook zurückgegeben oder an ein synchron gerendertes Kind weitergereicht werden. Verändere ihn nicht und speichere ihn nicht als Live-Zustand in State, Refs, Modulvariablen oder langlebigen Caches. Spread, Rest-Destrukturierung, Aufzählung und Serialisierung erzeugen breite Abonnements.

Explizite Objekt-Selektoren bleiben für abgeleitete Werte und gemessene Hotspots verfügbar. Ihre obersten Felder werden mit `Object.is` verglichen. Wähle niemals den gesamten Store aus.

Aktionen sind normale React-Werte. Ohne React Compiler können die üblichen Memo-Werkzeuge genutzt werden, wenn stabile Identitäten relevant sind.
