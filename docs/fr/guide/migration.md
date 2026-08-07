# Migrer depuis hox

Remplacez la factory par `createStore`, puis déstructurez directement les champs nécessaires dans chaque composant. Kerros suit automatiquement les accès :

```tsx
const { count, setCount } = useCounter()
```

Kerros ne fournit volontairement ni export de compatibilité ni champ `store` agrégé. Découpez les gros stores globaux par domaine et imbriquez leurs Providers selon l'ordre des dépendances.

`useEffectEvent` n'est pas un outil de stabilité des actions. Réservez-le aux événements appelés depuis un Effect ; les actions publiques du store restent des fonctions ordinaires.
