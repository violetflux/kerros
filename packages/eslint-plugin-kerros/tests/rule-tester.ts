import parser from '@typescript-eslint/parser'
import { RuleTester } from '@typescript-eslint/rule-tester'
import { fileURLToPath } from 'node:url'

export const fixturesDir = fileURLToPath(new URL('./fixtures', import.meta.url))
export const filename = fileURLToPath(new URL('./fixtures/case.tsx', import.meta.url))

export const ruleTester = new RuleTester({
  languageOptions: {
    parser,
    parserOptions: {
      projectService: true,
      tsconfigRootDir: fixturesDir,
    },
  },
})
