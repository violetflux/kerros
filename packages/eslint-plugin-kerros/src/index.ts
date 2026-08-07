import parser from '@typescript-eslint/parser'
import type { TSESLint } from '@typescript-eslint/utils'
import { bindingNaming } from './rules/binding-naming'
import { factoryAtModuleScope } from './rules/factory-at-module-scope'
import { modelConvention } from './rules/model-convention'
import { noBroadStoreAccess } from './rules/no-broad-store-access'
import { noCyclicStoreDependency } from './rules/no-cyclic-store-dependency'
import { noEffectEventAction } from './rules/no-effect-event-action'
import { noProviderKeyProp } from './rules/no-provider-key-prop'
import { noRenderInstanceSnapshot } from './rules/no-render-instance-snapshot'
import { noStoreMutation } from './rules/no-store-mutation'
import { noUnstableBoundStore } from './rules/no-unstable-bound-store'
import { noUnstableSelectorValue } from './rules/no-unstable-selector-value'
import { noWholeStoreSelector } from './rules/no-whole-store-selector'
import { preferBindStore } from './rules/prefer-bind-store'
import { pureSelector } from './rules/pure-selector'
import { requireCachedSnapshot } from './rules/require-cached-snapshot'
import { selectorParameterName } from './rules/selector-parameter-name'

export const rules: NonNullable<TSESLint.FlatConfig.Plugin['rules']> = {
  'binding-naming': bindingNaming,
  'factory-at-module-scope': factoryAtModuleScope,
  'model-convention': modelConvention,
  'no-broad-store-access': noBroadStoreAccess,
  'no-cyclic-store-dependency': noCyclicStoreDependency,
  'no-effect-event-action': noEffectEventAction,
  'no-provider-key-prop': noProviderKeyProp,
  'no-render-instance-snapshot': noRenderInstanceSnapshot,
  'no-store-mutation': noStoreMutation,
  'no-unstable-bound-store': noUnstableBoundStore,
  'no-unstable-selector-value': noUnstableSelectorValue,
  'no-whole-store-selector': noWholeStoreSelector,
  'prefer-bind-store': preferBindStore,
  'pure-selector': pureSelector,
  'require-cached-snapshot': requireCachedSnapshot,
  'selector-parameter-name': selectorParameterName,
}

const plugin: TSESLint.FlatConfig.Plugin = {
  meta: {
    name: '@violetflux/eslint-plugin-kerros',
    version: '0.2.4',
  },
  rules,
}

const recommendedRules: TSESLint.FlatConfig.Rules = Object.fromEntries(
  Object.keys(rules).map(name => [`kerros/${name}`, 'error'] as const),
)

const fastRules: TSESLint.FlatConfig.Rules = {
  ...recommendedRules,
  'kerros/no-cyclic-store-dependency': 'off',
  'kerros/no-store-mutation': ['error', { deepAliases: false }],
  'kerros/no-unstable-selector-value': 'off',
  'kerros/require-cached-snapshot': 'off',
}

export const configs = {
  fastTypeChecked: {
    name: 'kerros/fast-type-checked',
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
    rules: fastRules,
  },
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
