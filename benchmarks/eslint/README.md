# Kerros ESLint benchmark

This benchmark generates typed TS/TSX projects with Kerros Stores, selectors,
Effects, Effect Events, re-exports, and cross-file Store dependencies. Each
mode and round runs in a separate process; the cold pass creates a fresh
TypeScript Program and the warm pass reuses the same ESLint instance. The
default three rounds are summarized by median, while every raw sample remains
in the JSON output.

Run the default 100-file profile:

```sh
bun benchmarks/eslint/run.ts
```

The larger profiles are explicit so normal verification does not accidentally
run a long benchmark:

```sh
bun benchmarks/eslint/run.ts --files=1000
bun benchmarks/eslint/run.ts --files=5000
```

Use `--rounds=1` for a quick smoke run or up to `--rounds=10` when collecting
publication-quality figures.

Output includes typed-parser baseline, `fastTypeChecked`, and
`recommendedTypeChecked` cold/warm/total time, diagnostics, parser time, peak
RSS, all per-rule timings, fast overhead, and the 20% threshold conclusion.
Per-rule threshold shares use the fast mode's added warm wall time over the
typed baseline's warm pass; the displayed rule table uses warm rule time to avoid charging lazy
TypeScript Program initialization to whichever rule queries types first.
Generated projects live under `.generated/` only for the duration of a run and
are ignored by Git.

See [RESULTS.md](./RESULTS.md) for the measured machine, raw summary, threshold
conclusion, and the 1,000-file execution note.
