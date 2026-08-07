# Seguimiento automático y selectores

Por defecto, Kerros sigue automáticamente las propiedades leídas:

```tsx
const snapshot = useSettings()
const { profile, save } = snapshot
```

El valor devuelto es un snapshot de seguimiento de solo lectura para el render actual. Se siguen las lecturas anidadas de objetos y arrays; cambiar campos no leídos no vuelve a renderizar el componente. El snapshot puede guardarse en una variable local del render, devolverse desde un custom Hook o pasarse a un hijo renderizado de forma síncrona. No lo modifiques ni lo conserves como estado vivo en state, refs, variables de módulo o cachés duraderas. El spread, la desestructuración rest, la enumeración y la serialización crean suscripciones amplias.

Los elementos y portales de React se detectan automáticamente como valores atómicos. Los contenedores estándar de `useRef()` y `createRef()` se pueden devolver directamente en React 17, 18 y 19. Usa `ref(value)` solo para objetos de terceros incompatibles con Proxy o cuando sea imprescindible conservar la identidad estricta. Las mutaciones internas de valores atómicos no son reactivas; publica una referencia nueva para provocar un render.

Los selectores de objeto explícitos quedan para valores derivados y puntos críticos medidos. Sus campos superiores se comparan con `Object.is`. No selecciones el Store completo.

Las acciones son valores normales de React. Sin React Compiler, usa las herramientas habituales de memoización cuando sea importante mantener su identidad.
