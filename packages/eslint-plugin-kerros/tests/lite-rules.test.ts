import { Linter } from 'eslint'
import { describe, expect, it } from 'vitest'
import { configs } from '../src'

/** Lint one complete TypeScript file through the public lightweight preset. */
function lint(code: string) {
  return new Linter().verify(code, [configs.recommended as never], { filename: 'case.tsx' })
}

const binding = `
  import { createStore } from '@violetflux/kerros'
  function useCounterModel() { return { count: 0 } }
  const [useCounter, CounterProvider, getCounter] = createStore(useCounterModel)
`

describe('lightweight rules', () => {
  it('recognizes direct, aliased, and namespace factory imports', () => {
    const messages = lint(`
      import { createStore as makeStore } from '@violetflux/kerros'
      import * as kerros from '@violetflux/kerros'
      function useCounterModel() { return { count: 0 } }
      function useThemeModel() { return { dark: false } }
      function setup() {
        makeStore(useCounterModel)
        kerros.createStore(useThemeModel)
      }
    `)

    expect(messages.filter(message => message.ruleId === 'kerros/factory-at-module-scope')).toHaveLength(2)
  })

  it('ignores unrelated same-name functions', () => {
    const messages = lint(`
      function createStore(model: () => object) { return model() }
      function setup() { return createStore(() => ({})) }
    `)
    expect(messages).toEqual([])
  })

  it('checks model and factory binding conventions', () => {
    const messages = lint(`
      import { createStore } from '@violetflux/kerros'
      function counterModel() { return { count: 0 } }
      function useThemeModel() { return { dark: false } }
      const [counter, Provider] = createStore(counterModel)
      const [useTheme, ThemeProvider, getWrong] = createStore(useThemeModel)
    `)

    expect(messages).toEqual(expect.arrayContaining([
      expect.objectContaining({ ruleId: 'kerros/model-convention', messageId: 'modelName' }),
      expect.objectContaining({ ruleId: 'kerros/binding-naming', messageId: 'hookName' }),
      expect.objectContaining({ ruleId: 'kerros/binding-naming', messageId: 'providerName' }),
      expect.objectContaining({ ruleId: 'kerros/binding-naming', messageId: 'getterName' }),
    ]))
  })

  it('checks selectors on Store Hooks created in the same file', () => {
    const messages = lint(`${binding}
      const selected = useCounter(store => ({ snapshot: store }))
    `)

    expect(messages).toEqual(expect.arrayContaining([
      expect.objectContaining({ ruleId: 'kerros/selector-parameter-name', messageId: 'parameterName' }),
      expect.objectContaining({ ruleId: 'kerros/no-whole-store-selector', messageId: 'wholeStore' }),
    ]))
  })

  it('rejects broad access to a file-local selector-free snapshot', () => {
    const messages = lint(`${binding}
      const snapshot = useCounter()
      const copy = { ...snapshot }
      JSON.stringify(snapshot)
    `)

    expect(messages.filter(message => message.ruleId === 'kerros/no-broad-store-access')).toHaveLength(2)
  })

  it('does not guess cross-file Hook identity', () => {
    const messages = lint(`
      import { useCounter } from './counter'
      useCounter(store => store)
      JSON.stringify(useCounter())
    `)
    expect(messages).toEqual([])
  })
})
