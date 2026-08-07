<p align="center">
  <a href="https://violetflux.github.io/kerros/es/"><img src="https://raw.githubusercontent.com/violetflux/kerros/main/docs/public/banner.svg" alt="Kerros" width="100%" /></a>
</p>

<p align="center">
  <a href="https://github.com/violetflux/kerros/blob/main/README.md">English</a> ·
  <a href="https://github.com/violetflux/kerros/blob/main/README.zh-CN.md">简体中文</a> ·
  <a href="https://github.com/violetflux/kerros/blob/main/README.ja.md">日本語</a> ·
  <a href="https://github.com/violetflux/kerros/blob/main/README.ko.md">한국어</a> ·
  <a href="https://github.com/violetflux/kerros/blob/main/README.de.md">Deutsch</a> ·
  <a href="https://github.com/violetflux/kerros/blob/main/README.fr.md">Français</a> ·
  Español
</p>

Kerros mantiene el estado de React donde pertenece de forma natural: dentro de Hooks y bajo Providers. Añade suscripciones precisas mediante selectores sin imponer reducers, actions, proxies ni un singleton global.

- Un Store es un Hook de React normal
- Los selectores devuelven un objeto con los valores necesarios
- Los campos superiores se comparan superficialmente con `Object.is`
- Cada Provider posee una instancia de Store aislada
- Los Stores se componen mediante dependencias unidireccionales
- Compatible con React 17, 18 y 19

> [!TIP]
> **Instalar con tu Coding Agent**: pega esta frase en tu Coding Agent para instalar la dependencia y el Skill del proyecto a la vez.

```text
Instala @violetflux/kerros con el gestor de paquetes del proyecto y después ejecuta npx skills add violetflux/kerros --skill kerros --agent '*' -y para instalar el Skill de Kerros en todos los Coding Agents compatibles.
```

## Crear un Store

```tsx
import { createStore } from '@violetflux/kerros'
import { useState } from 'react'

function useCounterStoreValue() {
  const [count, setCount] = useState(0)
  return { count, setCount }
}

export const [useCounter, CounterProvider] = createStore(useCounterStoreValue)
```

El Hook del Store puede seguir usando `useState`, `useReducer`, Context, Hooks de SDK y Hooks personalizados.

Define el initializer como un Hook con nombre en el nivel superior, por ejemplo `useCounterStoreValue`. Los initializers anónimos siguen funcionando en runtime, pero React Compiler no los compila automáticamente como Hooks en modo `infer`.

## Montar el Provider y seleccionar valores

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

El selector puede escribirse en línea. Cambiar un campo no seleccionado no vuelve a renderizar `Counter`.

## Instalación

| Gestor | Comando |
| --- | --- |
| npm | `npm install @violetflux/kerros` |
| pnpm | `pnpm add @violetflux/kerros` |
| Yarn | `yarn add @violetflux/kerros` |
| Bun | `bun add @violetflux/kerros` |

## Cómo funciona

El Provider ejecuta el Hook del Store y Context solo transporta un contenedor de suscripción estable. Los snapshots confirmados se publican mediante `subscribe/getSnapshot`. Cada componente se renderiza de nuevo únicamente cuando cambia su selección.

Sin un singleton de módulo oculto, el mismo Provider puede montarse varias veces, inicializarse con props, aislarse en pruebas o limitarse a un subárbol.

## API

```ts
function createStore<TStore, TProps = Record<never, never>>(
  useStoreValue: (props: TProps) => TStore,
): readonly [StoreHook<TStore>, StoreProvider<TProps>]

const [useStream, StreamProvider] = bindStore<Stream>('Stream')
```

El Hook devuelto requiere un selector que retorne un objeto. Usarlo fuera de su Provider correspondiente produce un error claro. Admite Strict Mode y renderizado en servidor.

`bindStore` es una integración avanzada solo para un Headless External Store existente. Para el estado normal de Hooks, usa `createStore`. El Context solo contiene la instancia original; los consumidores utilizan directamente `getSnapshot` y `subscribe`.

## Documentación

- [Introducción](https://violetflux.github.io/kerros/es/guide/introduction)
- [Primeros pasos](https://violetflux.github.io/kerros/es/guide/getting-started)
- [Selectores](https://violetflux.github.io/kerros/es/guide/selectors)
- [Composición de Stores](https://violetflux.github.io/kerros/es/guide/composition)
- [API](https://violetflux.github.io/kerros/es/api/)

[Licencia MIT](https://github.com/violetflux/kerros/blob/main/LICENSE)
