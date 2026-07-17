# Sélecteurs

Chaque consommateur Kerros sélectionne explicitement un objet :

```tsx
const { name, save } = useSettings(s => ({
  name: s.profile.name,
  save: s.save,
}))
```

Les lectures imbriquées comme `s.profile.name` fonctionnent directement. Le composant n'est rendu à nouveau que lorsqu'une valeur sélectionnée au premier niveau change selon `Object.is`.

Un sélecteur peut renvoyer un nouvel objet à chaque rendu : tant que l'identité de ses champs reste stable, la comparaison superficielle conserve le résultat précédent. Évitez de sélectionner tout le store si le composant n'utilise pas tous ses champs.

Les actions sont des valeurs React ordinaires. Sans React Compiler, utilisez les outils de mémoïsation habituels lorsque leur identité doit rester stable.
