# Suivi automatique et sélecteurs

Par défaut, Kerros suit automatiquement les propriétés lues :

```tsx
const snapshot = useSettings()
const { profile, save } = snapshot
```

La valeur retournée est un snapshot de suivi en lecture seule pour le rendu courant. Les lectures imbriquées d'objets et de tableaux sont suivies ; modifier un champ non lu ne relance pas le rendu. Le snapshot peut rester dans une variable locale au rendu, être retourné par un custom Hook ou être transmis à un enfant rendu synchroniquement. Ne le modifiez pas et ne le conservez pas comme état vivant dans un state, une ref, une variable de module ou un cache durable. Le spread, la déstructuration rest, l'énumération et la sérialisation créent des abonnements larges.

Les sélecteurs d'objet explicites restent disponibles pour les valeurs dérivées et les points chauds mesurés. Leurs champs de premier niveau sont comparés avec `Object.is`. Ne sélectionnez pas le Store complet.

Les actions sont des valeurs React ordinaires. Sans React Compiler, utilisez les outils de mémoïsation habituels lorsque leur identité doit rester stable.
