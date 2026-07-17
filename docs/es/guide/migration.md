# Migrar desde hox

Sustituye la factory por `createStore` y haz que cada componente seleccione únicamente los campos que necesita:

```tsx
const { count, setCount } = useCounter(s => ({
  count: s.count,
  setCount: s.setCount,
}))
```

Kerros no ofrece exports de compatibilidad ni un campo `store` agregado. Divide los stores globales grandes por dominio y anida sus Providers según el orden de dependencias.

`useEffectEvent` no sirve para estabilizar acciones. Úsalo únicamente para eventos invocados desde un Effect; las acciones públicas del store siguen siendo funciones normales.
