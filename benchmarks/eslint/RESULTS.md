# ESLint benchmark results

The benchmark compares the same TypeScript syntax parser with and without the
single lightweight `recommended` preset. Neither mode enables TypeScript Project
Service, resolves cross-file types, or builds a Store dependency graph.

## 100-file profile

Measured on 2026-08-27 on an Apple M1 Pro with Bun 1.3.14 and its Node 24.3
compatibility runtime. Three isolated rounds were summarized by median; peak RSS
uses the largest sample.

| Mode | Cold | Warm | Total | Peak RSS | Diagnostics |
| --- | ---: | ---: | ---: | ---: | ---: |
| syntax parser | 223.32 ms | 104.61 ms | 327.79 ms | 356.45 MiB | 0 |
| recommended | 238.88 ms | 117.18 ms | 356.06 ms | 359.33 MiB | 0 |

The six Kerros rules add 28.27 ms across the cold and warm passes, an 8.62%
overhead over the parser baseline. Peak RSS increases by 2.88 MiB. A shared
file-local syntax index ensures every source file is scanned once rather than
once per rule.

The profile intentionally measures dense files where each file declares and uses
Kerros Stores. Normal repositories with fewer Store declaration files should see
lower rule execution time. Run `bun benchmarks/eslint/run.ts --files=100
--rounds=3` to reproduce the profile on another machine.

## Semantic boundary

The preset recognizes direct `createStore` and `bindStore` imports, including
local aliases and namespace imports. It checks Store bindings and Hook calls
created in the same file. It intentionally does not infer cross-file re-exports,
wrappers, or imported Store Hook identity; this boundary is what removes the
multi-GiB TypeScript Project Service cost.
