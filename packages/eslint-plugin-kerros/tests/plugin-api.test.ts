import { describe, expect, it } from 'vitest'
import plugin, { configs, rules } from '../src'

const ruleNames = [
  'binding-naming',
  'factory-at-module-scope',
  'model-convention',
  'no-broad-store-access',
  'no-provider-key-prop',
  'no-whole-store-selector',
  'require-immediate-store-access',
  'selector-parameter-name',
] as const

describe('plugin API', () => {
  it('exports the eight phase rules', () => {
    expect(Object.keys(rules).sort()).toEqual(ruleNames)
    expect(plugin.rules).toBe(rules)
  })

  it('provides a typed flat recommended config', () => {
    expect(configs.recommendedTypeChecked.languageOptions?.parserOptions).toMatchObject({
      projectService: true,
    })
    expect(configs.recommendedTypeChecked.plugins?.kerros).toBe(plugin)

    for (const name of ruleNames)
      expect(configs.recommendedTypeChecked.rules?.[`kerros/${name}`]).toBe('error')
  })
})
