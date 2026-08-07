# Optional-selector tracking benchmark

This benchmark preserves the original four-strategy experiment and now also
measures the production Kerros implementation:

- explicit selectors returning several deep primitive values;
- automatic deep property-access tracking through `proxy-compare`;
- whole-Store top-level shallow equality;
- whole-Store recursive deep equality.

Snapshots use six-segment access paths such as
`state.domains.domain0.groups.group0.metrics.metric0`. `react.tsx` keeps the
historical direct subscription comparison, upgraded to the same
`proxy-compare` primitives as production. `runtime.tsx` mounts the real
`createStore` and `bindStore` APIs and records relevant/unrelated updates,
render counts, elapsed time, memory delta, and peak RSS.

Two profiles are available:

| Profile | Deep leaves | Subscribers | Deep reads/component | React updates | Rounds |
| --- | ---: | ---: | ---: | ---: | ---: |
| large | 80,000 | 1,000 | 12 | 200 | 3 |
| extreme | 250,000 | 2,500 | 24 | 300 | 1 |

Run the correctness checks and large profile from the repository root:

```sh
bunx vitest run --config benchmarks/vitest.config.ts tracking/core.test.ts
bun benchmarks/tracking/micro.ts --profile=large
bun benchmarks/tracking/react.tsx --profile=large
bun benchmarks/tracking/runtime.tsx --profile=large --mode=bindStore --scenario=unrelated
```

Run the extreme comparator pressure test and the most important React scenario:

```sh
bun benchmarks/tracking/micro.ts --profile=extreme
bun benchmarks/tracking/react.tsx --profile=extreme --scenario=unrelated
bun benchmarks/tracking/runtime.tsx --profile=extreme --mode=createStore --scenario=unrelated --strategy=tracking
```

The extreme profile is always explicit. The default profile has 80,000 leaves;
the extreme profile has 250,000 leaves. Production correctness for abandoned
renders, enumeration, cyclic values, collections, and class instances remains
covered by the runtime test suite rather than inferred from benchmark output.
