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

Kerros conserve l'état React là où il se trouve naturellement : dans les Hooks et sous les Providers. Le suivi automatique des propriétés évite par défaut les rendus inutiles ; les sélecteurs explicites restent disponibles pour les valeurs dérivées et les points chauds.

- Un Store est un Hook React ordinaire
- `useStore()` suit automatiquement les propriétés lues
- Les sélecteurs explicites sont une optimisation avancée
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

function useCounterModel() {
  const [count, setCount] = useState(0)
  return { count, setCount }
}

export const [useCounter, CounterProvider] = createStore(useCounterModel)
```

Le Hook du Store peut continuer à utiliser `useState`, `useReducer`, Context, des Hooks SDK et vos Hooks personnalisés.

Définissez l'initializer comme un Hook nommé au niveau du module, par exemple `useCounterModel`. Les initializers anonymes fonctionnent toujours à l'exécution, mais React Compiler ne les compile pas automatiquement comme Hooks en mode `infer`.

## Monter le Provider et lire les valeurs

```tsx
function Counter() {
  const { count, setCount } = useCounter()
  return <button onClick={() => setCount(count + 1)}>{count}</button>
}

function App() {
  return <CounterProvider><Counter /></CounterProvider>
}
```

Kerros suit les propriétés lues pendant le rendu. La modification d'un champ non lu ne provoque pas un nouveau rendu de `Counter`, sans comparaison profonde du Store complet.

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
  useModel: (props: TProps) => TStore,
): readonly [StoreHook<TStore>, StoreProvider<TProps>]

const [useStream, StreamProvider] = bindStore<Stream>('Stream')
```

Sans argument, le Hook retourné active le suivi automatique. Les sélecteurs d'objet explicites servent aux valeurs dérivées et aux points chauds mesurés. Son utilisation hors du Provider lève une erreur claire.

Les éléments et portails React sont automatiquement atomiques. `useRef()` et `createRef()` peuvent être retournés directement ; `ref(value)` est réservé aux valeurs incompatibles avec Proxy ou à l'identité stricte.

`bindStore` est une intégration avancée réservée à un Headless External Store existant. Pour un état Hook ordinaire, utilisez `createStore`. Le Context ne contient que l'instance d'origine ; les consommateurs utilisent directement `getSnapshot` et `subscribe`.

## Documentation

- [Introduction](https://violetflux.github.io/kerros/fr/guide/introduction)
- [Bien démarrer](https://violetflux.github.io/kerros/fr/guide/getting-started)
- [Sélecteurs](https://violetflux.github.io/kerros/fr/guide/selectors)
- [Composition des Stores](https://violetflux.github.io/kerros/fr/guide/composition)
- [API](https://violetflux.github.io/kerros/fr/api/)

[Licence MIT](https://github.com/violetflux/kerros/blob/main/LICENSE)
