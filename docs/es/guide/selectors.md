# Selectores

Cada consumidor de Kerros selecciona explícitamente un objeto:

```tsx
const { name, save } = useSettings(s => ({
  name: s.profile.name,
  save: s.save,
}))
```

Las lecturas anidadas como `s.profile.name` funcionan directamente. El componente solo vuelve a renderizar cuando cambia un valor seleccionado del nivel superior según `Object.is`.

Un selector puede devolver un objeto nuevo en cada renderizado; mientras se mantenga la identidad de sus campos, la comparación superficial conserva el resultado anterior. No selecciones todo el store salvo que el componente necesite realmente todos sus campos.

Las acciones son valores normales de React. Sin React Compiler, usa las herramientas habituales de memoización cuando sea importante mantener su identidad.
