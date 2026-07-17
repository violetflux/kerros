# Pruebas

Los Providers de Kerros son componentes de React normales. Monta un Provider nuevo en cada prueba para aislar el estado de forma natural.

```tsx
test('increments', async () => {
  const user = userEvent.setup()
  render(<CounterProvider><Counter /></CounterProvider>)

  await user.click(screen.getByRole('button'))
  expect(screen.getByRole('button')).toHaveTextContent('1')
})
```

No existe un Store global que deba reiniciarse entre pruebas.

## Verificar el aislamiento de suscripciones

Cuenta renderizados solo cuando el comportamiento de suscripción sea el objetivo de la prueba. Cambia un campo no seleccionado y comprueba que el consumer no se renderiza otra vez.

```tsx
const selected = useExample(s => ({
  value: s.value,
  setIgnored: s.setIgnored,
}))
```

Mientras `value` y `setIgnored` mantengan su identidad, actualizar otro campo no debe renderizar de nuevo el componente.

Una biblioteca reutilizable debe cubrir:

- uso fuera del Provider correspondiente
- inicialización y actualización de props del Provider
- cancelación de la suscripción tras desmontar el consumer
- React Strict Mode
- renderizado en servidor
- dependencias unidireccionales entre Stores
- ausencia de renderizado si no cambia el resultado del selector

Kerros ejecuta la misma suite con React 17, 18 y 19.
