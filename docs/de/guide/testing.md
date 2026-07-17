# Testen

Kerros Provider sind normale React-Komponenten. Ein neuer Provider pro Test isoliert den State automatisch.

```tsx
test('increments', async () => {
  const user = userEvent.setup()
  render(<CounterProvider><Counter /></CounterProvider>)

  await user.click(screen.getByRole('button'))
  expect(screen.getByRole('button')).toHaveTextContent('1')
})
```

Zwischen Tests muss kein globaler Store zurückgesetzt werden.

## Abonnement-Isolation prüfen

Zähle Renders nur, wenn das Abonnementverhalten selbst getestet wird. Ändere ein nicht ausgewähltes Feld und prüfe, dass der Consumer nicht erneut rendert.

```tsx
const selected = useExample(s => ({
  value: s.value,
  setIgnored: s.setIgnored,
}))
```

Bleiben `value` und `setIgnored` identisch, darf die Änderung eines anderen Feldes die Komponente nicht neu rendern.

Eine wiederverwendbare Store-Bibliothek sollte Folgendes abdecken:

- Verwendung außerhalb des passenden Providers
- Initialisierung und Aktualisierung über Provider props
- Abmeldung nach dem Unmount eines Consumers
- React Strict Mode
- Server Rendering
- einseitige Store-Abhängigkeiten
- keine Rerenders bei unverändertem Selektorergebnis

Kerros führt dieselbe Testsuite mit React 17, 18 und 19 aus.
