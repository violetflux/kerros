import parser from '@typescript-eslint/parser'
import { Linter } from 'eslint'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import plugin, { configs, rules } from '../src'

const ruleNames = [
  'binding-naming',
  'factory-at-module-scope',
  'model-convention',
  'no-broad-store-access',
  'no-whole-store-selector',
  'selector-parameter-name',
] as const

const rootPackage = JSON.parse(
  readFileSync(new URL('../../../package.json', import.meta.url), 'utf8'),
) as { scripts: Record<string, string>, version: string }
const pluginPackage = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
) as { version: string }
const ciWorkflow = readFileSync(new URL('../../../.github/workflows/ci.yml', import.meta.url), 'utf8')
const publishWorkflow = readFileSync(new URL('../../../.github/workflows/publish.yml', import.meta.url), 'utf8')

describe('plugin API', () => {
  it('exports only the lightweight rules', () => {
    expect(Object.keys(rules).sort()).toEqual(ruleNames)
    expect(plugin.rules).toBe(rules)
  })

  it('provides one untyped recommended config', () => {
    expect(configs.recommended.languageOptions).not.toHaveProperty('parserOptions')
    expect(configs.recommended.languageOptions?.parser).toBe(parser)
    expect(configs.recommended.plugins?.kerros).toBe(plugin)
    for (const name of ruleNames)
      expect(configs.recommended.rules?.[`kerros/${name}`]).toBe('error')
    expect(Object.keys(configs)).toEqual(['recommended'])
  })

  it('runs without TypeScript Project Service', () => {
    const messages = new Linter().verify(
      `
        import { createStore } from '@violetflux/kerros'
        function Component() {
          function useCounterModel() { return { count: 0 } }
          return createStore(useCounterModel)
        }
      `,
      [configs.recommended as never],
      { filename: 'case.tsx' },
    )

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

  it('keeps both release packages on the same version', () => {
    expect(pluginPackage.version).toBe(rootPackage.version)
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
