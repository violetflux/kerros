# ESLint benchmark results

Measured on 2026-08-07 on an Apple M1 Pro (10 cores, 16 GB RAM), macOS
24.6.0, Bun 1.3.14, Node compatibility version 24.3.0, ESLint 10.7.0,
TypeScript 5.9.3, and typescript-eslint 8.64.0.

The typed baseline uses the same parser and `projectService` as both Kerros
configs, with no Kerros rules. Every mode and round runs in an isolated process.
Mode order rotates between rounds, and the tables use the median. Generated
files contain two Stores each plus selector-free access, explicit selectors,
Effects, Effect Events, Providers, re-exports, and bounded cross-file Store
dependencies.

## Balanced 100-file profile

Three rounds, 200 generated Stores, two lint passes per worker:

| Mode | Cold | Warm | Total | Peak RSS | Diagnostics |
| --- | ---: | ---: | ---: | ---: | ---: |
| typed baseline | 948.71 ms | 123.85 ms | 1,068.84 ms | 795.66 MB | 0 |
| fastTypeChecked | 1,255.86 ms | 179.62 ms | 1,435.48 ms | 863.22 MB | 0 |
| recommendedTypeChecked | 1,262.65 ms | 193.08 ms | 1,455.73 ms | 862.86 MB | 0 |

`fastTypeChecked` added 34.30% over the typed baseline, so this high-density
fixture did **not** meet the 20% target. Strict added about 36.2%. No fast rule
used more than 20% of the 366.64 ms fast incremental wall time, so the measured
data did not justify removing another correctness rule from fast.

Warm strict per-rule timings avoid assigning lazy TypeScript Program setup to
the first rule that requests a type:

| Rule | Warm time |
| --- | ---: |
| no-render-instance-snapshot | 9.92 ms |
| no-effect-event-action | 6.04 ms |
| binding-naming | 4.50 ms |
| prefer-bind-store | 3.29 ms |
| no-store-mutation | 2.98 ms |
| no-provider-key-prop | 2.35 ms |
| model-convention | 2.05 ms |
| factory-at-module-scope | 1.82 ms |
| require-cached-snapshot | 1.74 ms |
| no-broad-store-access | 1.63 ms |
| no-unstable-selector-value | 1.53 ms |
| pure-selector | 1.37 ms |
| no-whole-store-selector | 1.17 ms |
| require-immediate-store-access | 1.16 ms |
| selector-parameter-name | 0.84 ms |
| no-unstable-bound-store | 0.70 ms |
| no-cyclic-store-dependency | 0.36 ms |

## 1,000-file execution check

The 1,000-file profile completed with 2,000 generated Stores and zero
diagnostics in baseline, fast, and strict. A single-round exploratory run used
766 MB baseline RSS, 1,560 MB fast RSS, and 1,672 MB strict RSS. Its timings are
not used for overhead conclusions because the baseline ran first against newly
written files and paid filesystem cache costs that later modes did not.

The 5,000-file / 10,000-Store profile remains available through
`bun benchmarks/eslint/run.ts --files=5000`; it is intentionally not part of
default verification.
