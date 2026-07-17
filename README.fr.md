<p align="center">
  <a href="https://violetflux.github.io/kerros/fr/"><img src="https://raw.githubusercontent.com/violetflux/kerros/main/docs/public/banner.svg" alt="Kerros" width="100%" /></a>
</p>

<p align="center">
  <a href="https://github.com/violetflux/kerros/blob/main/README.md">English</a> ·
  <a href="https://github.com/violetflux/kerros/blob/main/README.zh-CN.md">简体中文</a> ·
  <a href="https://github.com/violetflux/kerros/blob/main/README.ja.md">日本語</a> ·
  <a href="https://github.com/violetflux/kerros/blob/main/README.ko.md">한국어</a> ·
  <a href="https://github.com/violetflux/kerros/blob/main/README.de.md">Deutsch</a> ·
  Français ·
  <a href="https://github.com/violetflux/kerros/blob/main/README.es.md">Español</a>
</p>

Kerros conserve l'état React là où il se trouve naturellement : dans les Hooks et sous les Providers. Il ajoute des abonnements précis par sélecteur sans imposer reducers, actions, proxies ou singleton global.

- Un Store est un Hook React ordinaire
- Les sélecteurs renvoient un objet contenant les valeurs nécessaires
- Les champs de premier niveau sont comparés avec `Object.is`
- Chaque Provider possède une instance de Store isolée
- Les Stores se composent grâce à des dépendances unidirectionnelles
- Compatible avec React 17, 18 et 19

> [!TIP]
> **Installer avec votre Coding Agent** : collez cette phrase dans votre Coding Agent pour installer à la fois la dépendance et le Skill du projet.

```text
Installe @violetflux/kerros avec le gestionnaire de paquets du projet, puis exécute npx skills add violetflux/kerros --skill kerros --agent '*' -y afin d'installer le Skill Kerros pour tous les Coding Agents compatibles.
```

## Créer un Store

```tsx
import { createStore } from '@violetflux/kerros'
import { useState } from 'react'

export const [useCounter, CounterProvider] = createStore(() => {
  const [count, setCount] = useState(0)
  return { count, setCount }
})
```

Le Hook du Store peut continuer à utiliser `useState`, `useReducer`, Context, des Hooks SDK et vos Hooks personnalisés.

## Monter le Provider et sélectionner les valeurs

```tsx
function Counter() {
  const { count, setCount } = useCounter(s => ({
    count: s.count,
    setCount: s.setCount,
  }))
  return <button onClick={() => setCount(count + 1)}>{count}</button>
}

function App() {
  return <CounterProvider><Counter /></CounterProvider>
}
```

Le sélecteur peut rester en ligne. La modification d'un champ non sélectionné ne provoque pas un nouveau rendu de `Counter`.

## Installation

| Gestionnaire | Commande |
| --- | --- |
| npm | `npm install @violetflux/kerros` |
| pnpm | `pnpm add @violetflux/kerros` |
| Yarn | `yarn add @violetflux/kerros` |
| Bun | `bun add @violetflux/kerros` |

## Fonctionnement

Le Provider exécute le Hook du Store et Context ne transporte qu'un conteneur d'abonnement stable. Les snapshots validés sont publiés via `subscribe/getSnapshot`. Un composant n'est rendu à nouveau que lorsque sa sélection change.

Sans singleton de module caché, un même Provider peut être monté plusieurs fois, initialisé par des props, isolé dans les tests ou limité à un sous-arbre.

## API

```ts
function createStore<TStore, TProps = Record<never, never>>(
  useStoreValue: (props: TProps) => TStore,
): readonly [StoreHook<TStore>, StoreProvider<TProps>]
```

Le Hook retourné exige un sélecteur qui renvoie un objet. Son utilisation hors du Provider correspondant lève une erreur claire. Strict Mode et le rendu serveur sont pris en charge.

## Documentation

- [Introduction](https://violetflux.github.io/kerros/fr/guide/introduction)
- [Bien démarrer](https://violetflux.github.io/kerros/fr/guide/getting-started)
- [Sélecteurs](https://violetflux.github.io/kerros/fr/guide/selectors)
- [Composition des Stores](https://violetflux.github.io/kerros/fr/guide/composition)
- [API](https://violetflux.github.io/kerros/fr/api/)

[Licence MIT](https://github.com/violetflux/kerros/blob/main/LICENSE)
