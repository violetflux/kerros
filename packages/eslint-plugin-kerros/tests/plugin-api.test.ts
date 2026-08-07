import parser from '@typescript-eslint/parser'
import { Linter } from 'eslint'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import plugin, { configs, rules } from '../src'
import { filename } from './rule-tester'

const ruleNames = [
  'binding-naming',
  'factory-at-module-scope',
  'model-convention',
  'no-broad-store-access',
  'no-provider-key-prop',
  'no-render-instance-snapshot',
  'no-store-mutation',
  'no-unstable-selector-value',
  'no-whole-store-selector',
  'pure-selector',
  'require-immediate-store-access',
  'selector-parameter-name',
] as const

const rootPackage = JSON.parse(
  readFileSync(new URL('../../../package.json', import.meta.url), 'utf8'),
) as { scripts: Record<string, string> }

describe('plugin API', () => {
  it('exports the twelve implemented rules', () => {
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

  it('runs typed rules when consumed directly by Linter', () => {
    const messages = new Linter().verify(
      `
        import { createStore } from '@violetflux/kerros'
        function Component() {
          function useCounterModel() { return { count: 0 } }
          return createStore(useCounterModel)
        }
      `,
      [configs.recommendedTypeChecked as never],
      { filename },
    )

    expect(configs.recommendedTypeChecked.languageOptions.parser).toBe(parser)
    expect(messages).toEqual(expect.arrayContaining([
      expect.objectContaining({
        ruleId: 'kerros/factory-at-module-scope',
        messageId: 'moduleScope',
      }),
    ]))
  })

  it('orchestrates runtime and plugin checks from root scripts', () => {
    for (const command of ['build', 'test', 'typecheck']) {
      expect(rootPackage.scripts[command]).toBe(
        `bun run ${command}:runtime && bun run ${command}:plugin`,
      )
      expect(rootPackage.scripts[`${command}:plugin`]).toBe(
        `bun run --filter @violetflux/eslint-plugin-kerros ${command}`,
      )
    }

    expect(rootPackage.scripts['build:runtime']).toBe('tsdown')
    expect(rootPackage.scripts['test:runtime']).toBe('vitest run')
    expect(rootPackage.scripts['typecheck:runtime']).toBe('tsc --noEmit')
    expect(rootPackage.scripts.check).toContain('bun run typecheck && bun run test && bun run build')
  })
})
