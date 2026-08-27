# Kerros ESLint benchmark

This benchmark generates TS/TSX projects with file-local Kerros Stores and
selectors. Each mode and round runs in a separate process; the cold pass creates
a fresh parser and the warm pass reuses the same ESLint instance. The
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

Output includes the syntax-parser baseline and the single `recommended` preset's
cold/warm/total time, diagnostics, parser time, peak RSS, all per-rule timings,
plugin overhead, and the 20% threshold conclusion.
Per-rule threshold shares use the preset's added warm wall time over the syntax
baseline's warm pass. Neither mode enables TypeScript Project Service.
Generated projects live under `.generated/` only for the duration of a run and
are ignored by Git.

See [RESULTS.md](./RESULTS.md) for the measured machine, raw summary, threshold
conclusion, and the 1,000-file execution note.

Every baseline and preset sample runs in a fresh process, so the reported RSS
difference includes only the lightweight plugin and rule execution over the same
syntax parser.
