# Tests

Les Providers Kerros sont des composants React ordinaires. Montez un nouveau Provider dans chaque test pour isoler naturellement l'état.

```tsx
test('increments', async () => {
  const user = userEvent.setup()
  render(<CounterProvider><Counter /></CounterProvider>)

  await user.click(screen.getByRole('button'))
  expect(screen.getByRole('button')).toHaveTextContent('1')
})
```

Aucun Store global ne doit être réinitialisé entre les tests.

## Vérifier l'isolation des abonnements

Ne comptez les rendus que lorsque le comportement d'abonnement est la cible du test. Modifiez un champ non sélectionné et vérifiez que le consumer n'est pas rendu à nouveau.

```tsx
const selected = useExample(s => ({
  value: s.value,
  setIgnored: s.setIgnored,
}))
```

Tant que `value` et `setIgnored` conservent leur identité, la modification d'un autre champ ne doit pas relancer le rendu.

Une bibliothèque réutilisable doit couvrir :

- utilisation hors du Provider correspondant
- initialisation et mise à jour des props du Provider
- désabonnement après le démontage du consumer
- React Strict Mode
- rendu serveur
- dépendances unidirectionnelles entre Stores
- absence de rendu si le résultat du sélecteur ne change pas

Kerros exécute la même suite avec React 17, 18 et 19.
