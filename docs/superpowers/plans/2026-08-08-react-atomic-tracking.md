# React Atomic Tracking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make React elements and portals safe in selector-free snapshots, keep standard React refs transparent, and provide `ref()` only for exact-identity escape hatches.

**Architecture:** Keep access tracking lazy by adapting the `proxy-compare@3.0.1` core inside Kerros and excluding React 17/18 elements, React 19 transitional elements, and portals in `isObjectToTrack`. Do not prewalk Store snapshots or guess `{ current }` objects. Preserve the existing affected-map comparison and proxy caches.

**Tech Stack:** TypeScript, React 17/18/19, Vitest, proxy-compare semantics, Rspress, pnpm/Bun scripts.

## Global Constraints

- Automatic detection must be O(1) on values reached through an accessed path and must never scan the complete Store.
- Standard `useRef()` and `createRef()` containers remain transparent proxies and must work with DOM refs and `useImperativeHandle`.
- `ref<T extends object>(value: T): T` preserves exact identity and disables recursive access tracking below that value.
- React elements and portals are compared by whole reference.
- Existing selector, shallow, SSR, Strict Mode, and cyclic snapshot behavior must remain unchanged.
- Website documentation must describe delayed reads, immutable updates, atomic identity, and React-version behavior.

---

### Task 1: React atomic-value runtime

**Files:**
- Create: `src/access-tracking.ts`
- Modify: `src/tracking.ts`
- Modify: `src/index.tsx`
- Test: `tests/react-atomic-tracking.test.tsx`

**Interfaces:**
- Produces: `createProxy`, `isChanged`, and `markToTrack` as internal tracking primitives.
- Produces: public `ref<T extends object>(value: T): T`.

- [ ] Add failing integration tests that render nested React elements and portals from automatic snapshots.
- [ ] Add a failing public-API test for `ref()` identity preservation.
- [ ] Adapt the proxy-compare core with lazy `$$typeof` checks for `react.element`, `react.transitional.element`, and `react.portal`.
- [ ] Route `useStoreValue` through the adapted core and export `ref()` through the package entry.
- [ ] Add passing characterization tests for `useRef`, `createRef`, DOM cleanup, and `useImperativeHandle`.
- [ ] Run `pnpm test:runtime -- tests/react-atomic-tracking.test.tsx tests/tracking.test.tsx`.

### Task 2: Compatibility and performance regression

**Files:**
- Modify: `benchmarks/tracking/runtime.tsx`
- Modify: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: the runtime behavior from Task 1.
- Produces: render-count and timing evidence for React 17.0.2, 18.3.1, and 19.2.7.

- [ ] Preserve the benchmark's selector/tracking/shallow render counters and add an atomic-value mount case only if it measures runtime behavior rather than source text.
- [ ] Run the large benchmark after the implementation and compare all six scenario tables with the recorded 0.2.3 baseline.
- [ ] Run the runtime tests in isolated pnpm environments for React 17.0.2, 18.3.1, and 19.2.7.
- [ ] Verify that unrelated updates retain 1,000 tracking renders and watched updates retain 201,000 renders.

### Task 3: Website, Skill, and release

**Files:**
- Modify: `docs/*/guide/selectors.md`
- Modify: `docs/*/api/index.md`
- Modify: `README*.md`
- Modify: `skills/kerros/SKILL.md`
- Modify: `package.json`
- Modify: `packages/eslint-plugin-kerros/package.json`
- Modify: `bun.lock`
- Modify: `CHANGELOG.md`

**Interfaces:**
- Consumes: `ref()` and atomic-value semantics from Task 1.
- Produces: Kerros `0.2.4` runtime and synchronized ESLint plugin packages.

- [ ] Document that React elements/portals are automatic atomic values and standard React refs need no wrapper.
- [ ] Document that `ref()` is only for strict identity or Proxy-intolerant third-party values and that internal mutation is not reactive.
- [ ] Remove the external `proxy-compare` dependency after moving the adapted core in-tree.
- [ ] Bump both package versions and the plugin runtime peer to `0.2.4`.
- [ ] Run `pnpm check`, package dry runs, and the post-change performance suite.
- [ ] Commit, push, create the `v0.2.4` release, and verify both npm packages and the website deployment.
