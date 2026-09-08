import parser from '@typescript-eslint/parser'
import type { TSESLint } from '@typescript-eslint/utils'
import { liteRules } from './lite/rules'

export const rules = liteRules

const plugin: TSESLint.FlatConfig.Plugin = {
  meta: {
    name: '@violetflux/eslint-plugin-kerros',
    version: '0.3.5',
  },
  rules,
}

const recommendedRules = Object.fromEntries(
  Object.keys(rules).map(name => [`kerros/${name}`, 'error'] as const),
)

export const configs = {
  recommended: {
    name: 'kerros/recommended',
    files: ['**/*.{ts,tsx,mts,cts}'],
    languageOptions: {
      parser,
    },
    plugins: {
      kerros: plugin,
    },
    rules: recommendedRules,
  },
} satisfies TSESLint.FlatConfig.SharedConfigs

plugin.configs = configs

export default plugin
