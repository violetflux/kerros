import { noWholeStoreSelector } from '../src/rules/no-whole-store-selector'
import { selectorParameterName } from '../src/rules/selector-parameter-name'
import { filename, ruleTester } from './rule-tester'

const binding = `
  import { createStore } from '@violetflux/kerros'
  function useCounterModel() { return { count: 0, items: [] as string[] } }
  const [useCounter, CounterProvider] = createStore(useCounterModel)
`

ruleTester.run('no-whole-store-selector', noWholeStoreSelector, {
  valid: [
    { filename, code: `${binding}; function Component() { return useCounter(s => ({ count: s.count })).count }` },
    { filename, code: `${binding}; function Component() { return useCounter(s => ({ same: s === s })).same }` },
    {
      filename,
      code: `${binding}; function Component() { return useCounter(s => { if (s.count > 0) { const snapshot = s; snapshot.count } { const snapshot = { count: 0 }; return { snapshot } } }) }`,
    },
  ],
  invalid: [
    {
      filename,
      code: `${binding}; function Component() { return useCounter(s => ({ value: s })).value.count }`,
      errors: [{ messageId: 'wholeStore' }],
    },
    {
      filename,
      code: `${binding}; function Component() { return useCounter(s => s).count }`,
      errors: [{ messageId: 'wholeStore' }],
    },
    {
      filename,
      code: `import { useShared as selectShared } from '@fixtures/bindings'; function Component() { return selectShared(s => ({ snapshot: s })) }`,
      errors: [{ messageId: 'wholeStore' }],
    },
    {
      filename,
      code: `${binding}; function Component() { return useCounter(s => { const snapshot = s; return { snapshot } }) }`,
      errors: [{ messageId: 'wholeStore' }],
    },
    {
      filename,
      code: `${binding}; function Component() { return useCounter(s => { if (s.count > 0) { const snapshot = s; return { snapshot } } return { count: s.count } }) }`,
      errors: [{ messageId: 'wholeStore' }],
    },
  ],
})

ruleTester.run('selector-parameter-name', selectorParameterName, {
  valid: [
    { filename, code: `${binding}; function Component() { return useCounter(s => ({ count: s.count })).count }` },
    { filename, code: `function useCounter(select: (value: { count: number }) => object) { return select({ count: 0 }) }; useCounter(store => ({ count: store.count }))` },
    { filename, code: `import { useShared as selectShared } from '@fixtures/bindings'; selectShared(function select(s) { return { count: s.count } })` },
  ],
  invalid: [
    {
      filename,
      code: `${binding}; function Component() { return useCounter(store => ({ count: store.count })).count }`,
      errors: [{ messageId: 'parameterName' }],
    },
    {
      filename,
      code: `import { useShared as selectShared } from '@fixtures/bindings'; selectShared(function select(store) { return { count: store.count } })`,
      errors: [{ messageId: 'parameterName' }],
    },
  ],
})
