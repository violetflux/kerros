import parser from '@typescript-eslint/parser'
import { Linter } from 'eslint'
import { describe, expect, it } from 'vitest'
import { factoryAtModuleScope } from '../src/rules/factory-at-module-scope'

describe('typed linting configuration', () => {
  it('throws an explicit configuration error without projectService', () => {
    const linter = new Linter()

    expect(() => linter.verify(
      `import { createStore } from '@violetflux/kerros'; createStore(() => ({}))`,
      [
        {
          files: ['**/*.ts'],
          languageOptions: { parser },
          plugins: {
            kerros: {
              rules: { 'factory-at-module-scope': factoryAtModuleScope as never },
            },
          },
          rules: { 'kerros/factory-at-module-scope': 'error' },
        },
      ],
      { filename: 'missing-project.ts' },
    )).toThrow(/typed linting.*projectService/i)
  })
})
