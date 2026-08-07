# Suivi automatique et sélecteurs

Par défaut, Kerros suit automatiquement les propriétés lues :

```tsx
const { profile, save } = useSettings()
```

Les lectures imbriquées d'objets et de tableaux sont suivies ; modifier un champ non lu ne relance pas le rendu. Lisez immédiatement le résultat complet sans le stocker, l'étaler ni le transmettre.

Les sélecteurs d'objet explicites restent disponibles pour les valeurs dérivées et les points chauds mesurés. Leurs champs de premier niveau sont comparés avec `Object.is`. Ne sélectionnez pas le Store complet.

Les actions sont des valeurs React ordinaires. Sans React Compiler, utilisez les outils de mémoïsation habituels lorsque leur identité doit rester stable.
