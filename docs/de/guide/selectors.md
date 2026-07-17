# Selektoren

Jeder Kerros-Consumer wählt ausdrücklich ein Objekt aus:

```tsx
const { name, save } = useSettings(s => ({
  name: s.profile.name,
  save: s.save,
}))
```

Verschachtelte Zugriffe wie `s.profile.name` funktionieren direkt. Eine Komponente rendert nur neu, wenn sich ein ausgewählter Wert auf oberster Ebene gemäß `Object.is` ändert.

Ein Selektor darf bei jedem Render ein neues Objekt zurückgeben. Solange die Identitäten seiner Felder gleich bleiben, erkennt der flache Vergleich dasselbe Ergebnis. Wähle nicht den gesamten Store aus, außer die Komponente benötigt wirklich jedes Feld.

Aktionen sind normale React-Werte. Ohne React Compiler können die üblichen Memo-Werkzeuge genutzt werden, wenn stabile Identitäten relevant sind.
