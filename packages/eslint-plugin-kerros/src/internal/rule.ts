import type { TSESLint } from '@typescript-eslint/utils'
import { ESLintUtils } from '@typescript-eslint/utils'

export const createRule = ESLintUtils.RuleCreator(
  name => `https://github.com/violetflux/kerros/tree/main/packages/eslint-plugin-kerros/src/rules/${name}.ts`,
)

/** Require complete TypeScript parser services for every Kerros rule. */
export function getTypeServices<
  TMessageIds extends string,
  TOptions extends readonly unknown[],
>(context: Readonly<TSESLint.RuleContext<TMessageIds, TOptions>>) {
  try {
    return ESLintUtils.getParserServices(context)
  }
  catch {
    throw new Error(
      'Kerros ESLint rules require typed linting. Configure @typescript-eslint/parser with parserOptions.projectService.',
    )
  }
}
