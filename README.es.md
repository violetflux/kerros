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
> **Instalar con Codex**: pega esta frase en Codex para instalar la dependencia y el Skill del proyecto a la vez.

```text
Instala @violetflux/kerros con el gestor de paquetes del proyecto y después ejecuta npx skills add violetflux/kerros --skill kerros --agent codex -y.
```

## Crear un Store

```tsx
import { createStore } from '@violetflux/kerros'
import { useState } from 'react'

export const [useCounter, CounterProvider] = createStore(() => {
  const [count, setCount] = useState(0)
  return { count, setCount }
})
```

El Hook del Store puede seguir usando `useState`, `useReducer`, Context, Hooks de SDK y Hooks personalizados.

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
```

El Hook devuelto requiere un selector que retorne un objeto. Usarlo fuera de su Provider correspondiente produce un error claro. Admite Strict Mode y renderizado en servidor.

## Documentación

- [Introducción](https://violetflux.github.io/kerros/es/guide/introduction)
- [Primeros pasos](https://violetflux.github.io/kerros/es/guide/getting-started)
- [Selectores](https://violetflux.github.io/kerros/es/guide/selectors)
- [Composición de Stores](https://violetflux.github.io/kerros/es/guide/composition)
- [API](https://violetflux.github.io/kerros/es/api/)

[Licencia MIT](https://github.com/violetflux/kerros/blob/main/LICENSE)
