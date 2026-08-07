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
  'no-cyclic-store-dependency',
  'no-effect-event-action',
  'no-provider-key-prop',
  'no-render-instance-snapshot',
  'no-store-mutation',
  'no-unstable-bound-store',
  'no-unstable-selector-value',
  'no-whole-store-selector',
  'prefer-bind-store',
  'pure-selector',
  'require-cached-snapshot',
  'selector-parameter-name',
] as const

const rootPackage = JSON.parse(
  readFileSync(new URL('../../../package.json', import.meta.url), 'utf8'),
) as { scripts: Record<string, string>, version: string }
const pluginPackage = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
) as {
  peerDependencies: Record<string, string>
  version: string
}
const ciWorkflow = readFileSync(
  new URL('../../../.github/workflows/ci.yml', import.meta.url),
  'utf8',
)
const publishWorkflow = readFileSync(
  new URL('../../../.github/workflows/publish.yml', import.meta.url),
  'utf8',
)

describe('plugin API', () => {
  it('exports all sixteen implemented rules', () => {
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

  it('provides a typed fast config with expensive analysis disabled', () => {
    const fast = Reflect.get(configs, 'fastTypeChecked') as typeof configs.recommendedTypeChecked | undefined

    expect(fast).toBeDefined()
    if (!fast)
      return

    expect(fast.languageOptions?.parserOptions).toMatchObject({
      projectService: true,
    })
    expect(fast.languageOptions?.parser).toBe(parser)
    expect(fast.plugins?.kerros).toBe(plugin)

    expect(fast.rules).toMatchObject({
      'kerros/no-cyclic-store-dependency': 'off',
      'kerros/require-cached-snapshot': 'off',
      'kerros/no-unstable-selector-value': 'off',
      'kerros/no-store-mutation': ['error', { deepAliases: false }],
    })

    for (const name of ruleNames) {
      if (name === 'no-cyclic-store-dependency'
        || name === 'require-cached-snapshot'
        || name === 'no-unstable-selector-value'
        || name === 'no-store-mutation') {
        continue
      }

      expect(fast.rules?.[`kerros/${name}`]).toBe('error')
    }
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

  it('keeps both release packages on version 0.2.4', () => {
    expect(rootPackage.version).toBe('0.2.4')
    expect(pluginPackage.version).toBe(rootPackage.version)
    expect(pluginPackage.peerDependencies['@violetflux/kerros']).toBe('^0.2.4')
    expect(plugin.meta?.version).toBe(rootPackage.version)
  })

  it('packs and publishes both packages in dependency order', () => {
    expect(ciWorkflow).toContain('npm pack --dry-run')
    expect(ciWorkflow).toContain('npm pack --dry-run --workspace @violetflux/eslint-plugin-kerros')

    const runtimePublish = publishWorkflow.indexOf('npm publish --access public --provenance')
    const pluginPublish = publishWorkflow.indexOf(
      'npm publish --access public --provenance --workspace @violetflux/eslint-plugin-kerros',
    )

    expect(runtimePublish).toBeGreaterThan(-1)
    expect(pluginPublish).toBeGreaterThan(runtimePublish)
  })
})
