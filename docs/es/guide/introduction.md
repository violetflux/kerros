# Introducción

Kerros es un pequeño puente entre los Hooks de React, la propiedad expresada por Context y las suscripciones precisas de un Store externo.

El estado sigue siendo un Hook normal:

```tsx
function useCounterStore() {
  const [count, setCount] = useState(0)
  return { count, setCount }
}

const [useCounter, CounterProvider] = createStore(useCounterStore)
```

El Provider decide **dónde existe el Store**. El selector decide **qué cambios observa un componente**.

## El problema que resuelve

React Context modela bien la propiedad y la inyección de dependencias, pero cambiar el Context value invalida todos los consumers. Un Store externo a nivel de módulo ofrece suscripciones precisas, aunque es global por defecto y suele introducir otro modelo de estado.

Kerros mantiene ambos límites explícitos:

| Tema | Respuesta de Kerros |
| --- | --- |
| Modelo de estado | Hooks de React normales |
| Propiedad | Posición del Provider |
| Actualizaciones | Suscripciones `useSyncExternalStore` |
| Renderizados | Selector de objeto con comparación superficial |
| Varias instancias | Montar el Provider varias veces |
| Datos entre Stores | Providers anidados en una dirección |

Context solo transporta un contenedor de suscripción estable. El Hook del Store publica snapshots confirmados y cada componente se suscribe únicamente a su proyección.

## Cuándo encaja

- estado perteneciente a una ruta, workspace, editor, sesión o subárbol funcional
- uso directo de Hooks de React o SDK dentro del Store
- suscripciones precisas sin un gran dominio global de renderizados
- inicialización de una instancia mediante props del Provider
- instancias aisladas en pruebas

Las dependencias entre Stores deben ser unidireccionales. Si B lee A, monta A por fuera y evita que A vuelva a leer B.

Continúa con [Primeros pasos](./getting-started) o [Composición de Stores](./composition).
