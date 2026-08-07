# Changelog

## 0.2.0

- Make selector-free Store Hooks use committed-render property tracking by default for `createStore` and `bindStore`
- Keep explicit object selectors with top-level shallow equality for derived values and measured hot spots
- Add `{ tracking: false }` for whole-Store top-level shallow comparison, with `Object.is` for primitive snapshots and reference semantics for collections and class instances
- Add `@violetflux/eslint-plugin-kerros` with 17 type-aware rules, strict `recommendedTypeChecked`, and the lower-cost `fastTypeChecked` profile
- Add large runtime and ESLint pressure benchmarks, including real `createStore` and `bindStore` runs
- Publish the runtime and ESLint plugin as synchronized `0.2.0` packages, with ordered Trusted Publisher release checks

## 0.1.9

- Republish the `0.1.8` feature set through the Trusted Publisher workflow with npm provenance

## 0.1.8

- Add the advanced `bindStore` integration for direct selector subscriptions to existing headless external Stores
- Expose an optional instance Hook for nested imperative integrations without subscribing to snapshots
- Use the concise `useXxxModel` convention for Store implementation Hooks
- Keep the original Store as the only state owner without copying snapshots or taking over its lifecycle

## 0.1.7

- Document project-local Provider composition helpers and clarify Provider props versus React keys
- Make the one-line installer work with every compatible coding agent instead of targeting Codex only

## 0.1.6

- Add Shiki TypeScript highlighting to the homepage usage example
- Make the homepage Counter and selector guide User examples self-contained with imports

## 0.1.5

- Add a distributable Kerros Agent Skill for compatible coding agents
- Add a copyable one-line coding-agent installer to every localized homepage and package README
- Include the Skill in the npm package and expose it through the standard skills CLI

## 0.1.4

- Put the complete usage example before installation and positioning content in every package README
- Add a localized three-step usage example before the homepage feature cards

## 0.1.3

- Update the npm banner to match the new state-sharing positioning
- Explain how selector subscriptions avoid Context-wide consumer rerenders

## 0.1.2

- Rewrite the homepage and package introduction around state sharing instead of state management
- Add a dedicated positioning section to the custom Rspress homepage
- Simplify the introduction with direct Hook, Provider, and selector examples

## 0.1.1

- Add Kerros logo, banner, favicon, and a custom Rspress theme
- Rewrite the npm README with package-manager guidance, recipes, and seven language editions
- Expand the documentation with introductions, architecture patterns, and testing guides in all locales
- Add npm, pnpm, Yarn, and Bun installation tabs

## 0.1.0

- Add selector-first `createStore` API with top-level shallow equality.
- Add stable Provider containers and explicit cross-store composition.
- Support React 17, 18, and 19 through the official external-store shim.
- Add seven-language Rspress documentation and compatibility tests.
