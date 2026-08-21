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

Kerros mantiene el estado de React donde pertenece: dentro de Hooks y bajo Providers. El seguimiento automático de propiedades evita renderizados innecesarios por defecto; los selectores explícitos siguen disponibles para valores derivados y puntos críticos.

- Un Store es un Hook de React normal
- `useStore()` sigue automáticamente las propiedades leídas
- Los selectores explícitos son una optimización avanzada
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

function useCounterModel() {
  const [count, setCount] = useState(0)
  return { count, setCount }
}

export const [useCounter, CounterProvider] = createStore(useCounterModel)
```

El Hook del Store puede seguir usando `useState`, `useReducer`, Context, Hooks de SDK y Hooks personalizados.

Define el initializer como un Hook con nombre en el nivel superior, por ejemplo `useCounterModel`. Los initializers anónimos siguen funcionando en runtime, pero React Compiler no los compila automáticamente como Hooks en modo `infer`.

## Montar el Provider y leer valores

```tsx
function Counter() {
  const { count, setCount } = useCounter()
  return <button onClick={() => setCount(count + 1)}>{count}</button>
}

function App() {
  return <CounterProvider><Counter /></CounterProvider>
}
```

Kerros sigue las propiedades leídas durante el renderizado. Cambiar un campo no leído no vuelve a renderizar `Counter`, sin comparar profundamente todo el Store.

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
  useModel: (props: TProps) => TStore,
): readonly [StoreHook<TStore>, StoreProvider<TProps>, StoreGetter<TStore>]

const [useStream, StreamProvider] = bindStore<Stream>('Stream')
```

Sin argumentos, el Hook devuelto usa seguimiento automático. Los selectores de objeto explícitos quedan para valores derivados y puntos críticos medidos. Usarlo fuera de su Provider produce un error claro.

El tercer getter lee fuera de React el último Provider confirmado. Con `scope?: string | number | symbol` en el Provider selecciona la instancia más reciente que coincida exactamente. No se suscribe y lanza un error si no hay un Provider disponible.

Los elementos y portales de React son atómicos automáticamente. `useRef()` y `createRef()` se pueden devolver directamente; `ref(value)` se reserva para valores incompatibles con Proxy o identidad estricta.

`bindStore` es una integración avanzada solo para un Headless External Store existente. Para el estado normal de Hooks, usa `createStore`. El Context solo contiene la instancia original; los consumidores utilizan directamente `getSnapshot` y `subscribe`.

## Documentación

- [Introducción](https://violetflux.github.io/kerros/es/guide/introduction)
- [Primeros pasos](https://violetflux.github.io/kerros/es/guide/getting-started)
- [Selectores](https://violetflux.github.io/kerros/es/guide/selectors)
- [Composición de Stores](https://violetflux.github.io/kerros/es/guide/composition)
- [API](https://violetflux.github.io/kerros/es/api/)

[Licencia MIT](https://github.com/violetflux/kerros/blob/main/LICENSE)
