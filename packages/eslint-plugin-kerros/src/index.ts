import parser from '@typescript-eslint/parser'
import type { TSESLint } from '@typescript-eslint/utils'
import { bindingNaming } from './rules/binding-naming'
import { factoryAtModuleScope } from './rules/factory-at-module-scope'
import { modelConvention } from './rules/model-convention'
import { noBroadStoreAccess } from './rules/no-broad-store-access'
import { noProviderKeyProp } from './rules/no-provider-key-prop'
import { noRenderInstanceSnapshot } from './rules/no-render-instance-snapshot'
import { noStoreMutation } from './rules/no-store-mutation'
import { noUnstableSelectorValue } from './rules/no-unstable-selector-value'
import { noWholeStoreSelector } from './rules/no-whole-store-selector'
import { pureSelector } from './rules/pure-selector'
import { requireImmediateStoreAccess } from './rules/require-immediate-store-access'
import { selectorParameterName } from './rules/selector-parameter-name'

export const rules: NonNullable<TSESLint.FlatConfig.Plugin['rules']> = {
  'binding-naming': bindingNaming,
  'factory-at-module-scope': factoryAtModuleScope,
  'model-convention': modelConvention,
  'no-broad-store-access': noBroadStoreAccess,
  'no-provider-key-prop': noProviderKeyProp,
  'no-render-instance-snapshot': noRenderInstanceSnapshot,
  'no-store-mutation': noStoreMutation,
  'no-unstable-selector-value': noUnstableSelectorValue,
  'no-whole-store-selector': noWholeStoreSelector,
  'pure-selector': pureSelector,
  'require-immediate-store-access': requireImmediateStoreAccess,
  'selector-parameter-name': selectorParameterName,
}

const plugin: TSESLint.FlatConfig.Plugin = {
  meta: {
    name: '@violetflux/eslint-plugin-kerros',
    version: '0.1.9',
  },
  rules,
}

const recommendedRules: TSESLint.FlatConfig.Rules = Object.fromEntries(
  Object.keys(rules).map(name => [`kerros/${name}`, 'error'] as const),
)

export const configs = {
  recommendedTypeChecked: {
    name: 'kerros/recommended-type-checked',
    files: ['**/*.{ts,tsx,mts,cts}'],
    languageOptions: {
      parser,
      parserOptions: {
        projectService: true,
      },
    },
    plugins: {
      kerros: plugin,
    },
    rules: recommendedRules,
  },
} satisfies TSESLint.FlatConfig.SharedConfigs

plugin.configs = configs

export default plugin
