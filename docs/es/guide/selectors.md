# Seguimiento automático y selectores

Por defecto, Kerros sigue automáticamente las propiedades leídas:

```tsx
const { profile, save } = useSettings()
```

Se siguen las lecturas anidadas de objetos y arrays; cambiar campos no leídos no vuelve a renderizar el componente. Lee el resultado inmediatamente y no lo guardes, expandas ni pases completo.

Los selectores de objeto explícitos quedan para valores derivados y puntos críticos medidos. Sus campos superiores se comparan con `Object.is`. No selecciones el Store completo.

Las acciones son valores normales de React. Sin React Compiler, usa las herramientas habituales de memoización cuando sea importante mantener su identidad.
