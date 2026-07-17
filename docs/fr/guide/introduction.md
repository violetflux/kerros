# Introduction

Kerros est un petit pont entre les Hooks React, la propriété exprimée par Context et les abonnements ciblés d'un Store externe.

L'état reste un Hook ordinaire :

```tsx
function useCounterStore() {
  const [count, setCount] = useState(0)
  return { count, setCount }
}

const [useCounter, CounterProvider] = createStore(useCounterStore)
```

Le Provider détermine **où le Store existe**. Le sélecteur détermine **quels changements un composant observe**.

## Le problème résolu

React Context exprime bien la propriété et l'injection de dépendances, mais une modification du Context value invalide tous les consumers. Un Store externe au niveau du module permet des abonnements ciblés, mais il est global par défaut et introduit souvent un autre modèle d'état.

Kerros garde les deux frontières explicites :

| Sujet | Réponse de Kerros |
| --- | --- |
| Modèle d'état | Hooks React ordinaires |
| Propriété | Emplacement du Provider |
| Mises à jour | Abonnements `useSyncExternalStore` |
| Rendus | Sélecteur objet avec comparaison superficielle |
| Instances multiples | Monter plusieurs Providers |
| Données entre Stores | Imbrication unidirectionnelle des Providers |

Context ne transporte qu'un conteneur d'abonnement stable. Le Hook du Store publie les snapshots validés et chaque composant ne s'abonne qu'à sa projection.

## Cas adaptés

- état appartenant à une route, un workspace, un éditeur, une session ou un sous-arbre fonctionnel
- utilisation directe de Hooks React ou SDK dans le Store
- abonnements ciblés sans grande zone globale de nouveaux rendus
- initialisation d'une instance par les props du Provider
- instances isolées dans les tests

Les dépendances entre Stores doivent rester unidirectionnelles. Si B lit A, montez A à l'extérieur et ne faites pas relire B par A.

Continuez avec [Bien démarrer](./getting-started) ou [Composition des Stores](./composition).
