import { Bench } from 'tinybench'
import {
  createSnapshot,
  createProxyCompareTracker,
  deepEqual,
  readWatchedTotal,
  selectWatched,
  shallowEqual,
  trackingProfiles,
  updateMetric,
} from './core'

const requestedProfile = process.argv.find(argument => argument.startsWith('--profile='))
  ?.split('=')[1]
const profileName = requestedProfile === 'extreme' ? 'extreme' : 'large'
const profile = trackingProfiles[profileName]
const initial = createSnapshot(profile.shape)
const snapshots = {
  'no-op root replacement': { ...initial },
  'unrelated deep update': updateMetric(
    initial,
    profile.shape.domains - 1,
    profile.shape.groups - 1,
    profile.shape.metrics - 1,
    1,
  ),
  'watched deep update': updateMetric(initial, 0, 0, 0, 1),
}
const tracker = createProxyCompareTracker(initial)
readWatchedTotal(tracker.proxy, profile.readCount)
let sink = 0

/** Run one comparator for many subscribers to model a Store publication. */
function compareForConsumers(compare: () => boolean) {
  let equalCount = 0

  for (let index = 0; index < profile.microConsumers; index += 1) {
    if (compare())
      equalCount += 1
  }

  sink = equalCount
}

/** Benchmark one update scenario across all subscription strategies. */
async function runScenario(name: string, next: typeof initial) {
  const previousSelection = selectWatched(initial, profile.readCount)
  const bench = new Bench({
    name,
    time: profile.time,
    warmupTime: 200,
  })

  bench
    .add('explicit selector', () => {
      compareForConsumers(() => shallowEqual(
        previousSelection,
        selectWatched(next, profile.readCount),
      ))
    })
    .add('access tracking', () => {
      compareForConsumers(() => !tracker.isChanged(next))
    })
    .add('whole-store shallow', () => {
      compareForConsumers(() => shallowEqual(initial, next))
    })
    .add('whole-store deep', () => {
      compareForConsumers(() => deepEqual(initial, next))
    })

  await bench.run()

  console.log(`\n${profileName}: ${name}`)
  console.log(`${profile.shape.domains * profile.shape.groups * profile.shape.metrics} deep leaves, ${profile.readCount} reads × ${profile.microConsumers} subscribers`)
  console.table(bench.table())
}

for (const [name, snapshot] of Object.entries(snapshots))
  await runScenario(name, snapshot)

if (sink < 0)
  console.log(sink)
