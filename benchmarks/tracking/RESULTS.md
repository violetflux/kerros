# Tracking benchmark results

Measured on 2026-08-07 with Node.js 26.6.0, Bun 1.3.14, React 19.2.7,
Vitest 4.1.10, and jsdom 29.1.1. Absolute timings are machine-specific; render
counts and relative strategy behavior are the primary signals.

## Large comparator pressure test

Fixture: 80,000 deep leaves, 12 accessed paths, and 2,000 subscribers. Times
below are the average cost of delivering one publication to all subscribers.

| Strategy | No-op replacement | Unrelated deep update | Watched deep update |
| --- | ---: | ---: | ---: |
| Explicit selector | 0.473 ms | 0.500 ms | 0.372 ms |
| Access tracking | 0.034 ms | 0.128 ms | 0.313 ms |
| Whole-Store shallow | 0.039 ms | 0.051 ms | 0.048 ms |
| Whole-Store deep | 0.044 ms | 22.699 ms | 11.032 ms |

Whole-Store shallow comparison is cheap because it stops at the changed root
reference, but that result schedules every consumer to render. Deep comparison
both schedules every consumer for a real change and pays recursive traversal.

## Large bindStore-style React pressure test

Fixture: 80,000 deep leaves, 12 accessed paths per component, 1,000 mounted
components, 200 synchronous publications, and the median of three rounds.

| Strategy | No-op | Unrelated update | Watched update | Unrelated renders |
| --- | ---: | ---: | ---: | ---: |
| Explicit selector | 58.12 ms | 63.88 ms | 735.75 ms | 1,000 |
| Access tracking | 22.01 ms | 46.63 ms | 1,486.75 ms | 1,000 |
| Whole-Store shallow | 14.91 ms | 549.30 ms | 656.37 ms | 201,000 |
| Whole-Store deep | 14.72 ms | 3,143.68 ms | 1,961.62 ms | 201,000 |

Access tracking wins when updates are unrelated to component reads. When every
update changes a watched path, explicit selectors are faster because tracking
also creates and reads Proxy objects during every render.

## Extreme comparator pressure test

Fixture: 250,000 deep leaves, 24 accessed paths, and 5,000 subscribers.

| Strategy | Unrelated deep update |
| --- | ---: |
| Explicit selector | 2.740 ms |
| Access tracking | 0.330 ms |
| Whole-Store shallow | 0.129 ms |
| Whole-Store deep | 128.421 ms |

## Extreme bindStore-style React pressure test

Fixture: 250,000 deep leaves, 24 accessed paths per component, 2,500 mounted
components, and 300 synchronous unrelated publications.

| Strategy | Duration | Total renders |
| --- | ---: | ---: |
| Explicit selector | 562.81 ms | 2,500 |
| Access tracking | 248.73 ms | 2,500 |
| Whole-Store shallow | 2,511.82 ms | 752,500 |
| Whole-Store deep | 22,099.18 ms | 752,500 |

## Interpretation

Default automatic access tracking is promising for selector-free consumers:

- it suppresses unrelated updates as effectively as explicit selectors;
- prefix-sharing access trees keep deep-path comparison bounded by observed
  paths rather than total Store size;
- it is materially slower than explicit selectors when every update touches a
  watched value, so the selector overload should remain available;
- whole-Store deep equality is not a substitute for dependency tracking because
  any real Store change still invalidates the entire result.

The prototype is not production-ready. A real implementation must isolate paths
per consumer and committed render, handle React concurrent render abandonment,
cache nested Proxies, define enumeration behavior, and treat collections and
class instances as atomic values unless explicitly supported.

## Production implementation follow-up

The tables above are retained as historical prototype results. On 2026-08-07,
the benchmark core was upgraded to `proxy-compare@3.0.1`, and a separate runner
mounted the real `createStore` and `bindStore` APIs. Runtime correctness remains
covered by the React 17/18/19 test matrix; these numbers measure pressure only.

### Formal proxy-compare comparator pressure

80,000 leaves, 12 deep reads, and 2,000 subscribers:

| Strategy | No-op replacement | Unrelated update | Watched update |
| --- | ---: | ---: | ---: |
| Explicit selector | 0.603 ms | 0.604 ms | 0.447 ms |
| proxy-compare tracking | 0.137 ms | 0.349 ms | 0.726 ms |
| Whole-Store shallow | 0.055 ms | 0.052 ms | 0.052 ms |
| Whole-Store deep | 0.055 ms | 18.687 ms | 5.806 ms |

The direct-subscription React comparison for an unrelated update measured
55.61 ms for selectors, 74.71 ms for tracking, 575.76 ms for whole-Store
shallow, and 3,187.27 ms for deep equality. Selectors and tracking rendered
1,000 times; shallow and deep rendered 201,000 times.

### Real Kerros runtime, unrelated updates

| Profile / API | Duration | Renders | Memory delta | Peak RSS |
| --- | ---: | ---: | ---: | ---: |
| 80k / createStore | 72.40 ms | 1,000 | 33.00 MB | 336.14 MB |
| 80k / bindStore | 66.60 ms | 1,000 | 16.44 MB | 379.72 MB |
| 250k / createStore | 435.83 ms | 2,500 | 246.64 MB | 379.97 MB |
| 250k / bindStore | 375.16 ms | 2,500 | 87.94 MB | 472.59 MB |

The 80k profile used component depth 8, 12 deep reads, 1,000 consumers, and
200 updates. The 250k profile used depth 12, 24 reads, 2,500 consumers, and 300
updates. In all four runs, unrelated updates caused no rerenders after mount.
