import { noRenderInstanceSnapshot } from '../src/rules/no-render-instance-snapshot'
import { noStoreMutation } from '../src/rules/no-store-mutation'
import { noUnstableSelectorValue } from '../src/rules/no-unstable-selector-value'
import { pureSelector } from '../src/rules/pure-selector'
import { filename, ruleTester } from './rule-tester'

const storeBinding = `
  import { createStore } from '@violetflux/kerros'
  function useCounterModel<T extends number = number>() {
    return {
      count: 0 as T,
      nested: { value: 1 },
      items: [] as string[],
      map: new Map<string, number>(),
      set: new Set<string>(),
      clear: () => {},
      setValue: (_value: number) => {},
    }
  }
  const [useCounter, CounterProvider] = createStore(useCounterModel)
`

const externalBinding = `
  import { bindStore } from '@violetflux/kerros'
  interface Store { getSnapshot(): { count: number }; subscribe(listener: () => void): () => void }
  const [useExternal, ExternalProvider, useExternalInstance] = bindStore<Store>()
`

ruleTester.run('no-store-mutation', noStoreMutation, {
  valid: [
    {
      filename,
      code: `${storeBinding}; function Component() { const { clear, setValue } = useCounter(); clear(); setValue(1); return null }`,
    },
    {
      filename,
      code: `${storeBinding}; function Component() { const selected = useCounter(s => ({ items: s.items })); selected.items.push('ok'); return null }`,
    },
    {
      filename,
      code: `${storeBinding}; function Component() { const state = useCounter(); state.clear(); state.setValue(1); return null }`,
    },
    {
      filename,
      options: [{ deepAliases: false }],
      code: `${storeBinding}; function Component() { const state = useCounter(); const branch = state.nested; branch.value = 2; return null }`,
    },
    {
      filename,
      options: [{ deepAliases: false }],
      code: `${storeBinding}; function Component() { const state = useCounter(); let alias: typeof state; alias = state; alias.count++; return null }`,
    },
    {
      filename,
      code: `function useCounter() { return { items: [] as string[] } }; const { items } = useCounter(); items.push('ok')`,
    },
    {
      filename,
      code: `function identity<T>(value: T): T { return value }; const state = identity({ items: [] as string[] }); state.items.push('ok')`,
    },
    {
      filename,
      code: `import { createStore } from '@violetflux/kerros'; class Map { set(_key: string, _value: number) { return this } }; class Set { add(_value: string) { return this } }; function useCustomModel() { return { map: new Map(), set: new Set() } }; const [useCustom] = createStore(useCustomModel); function Component() { const { map, set } = useCustom(); map.set('x', 1); set.add('x'); return null }`,
    },
  ],
  invalid: [
    {
      filename,
      code: `${storeBinding}; function Component() { useCounter().count = 1; return null }`,
      errors: [{ messageId: 'mutation' }],
    },
    {
      filename,
      code: `${storeBinding}; function Component() { useCounter().count++; delete useCounter().nested.value; return null }`,
      errors: [{ messageId: 'mutation' }, { messageId: 'mutation' }],
    },
    {
      filename,
      code: `${storeBinding}; function Component() { const { items, map, set } = useCounter(); items.push('x'); map.set('x', 1); set.add('x'); return null }`,
      errors: [{ messageId: 'mutation' }, { messageId: 'mutation' }, { messageId: 'mutation' }],
    },
    {
      filename,
      code: `${storeBinding}; function Component() { const state = useCounter(); const branch = state.nested; const alias = branch; alias.value = 2; return null }`,
      errors: [{ messageId: 'mutation' }],
    },
    {
      filename,
      code: `${storeBinding}; function Component() { const state = useCounter(); let alias: typeof state; alias = state; alias.count++; return null }`,
      errors: [{ messageId: 'mutation' }],
    },
    {
      filename,
      code: `import { useShared as readShared } from '@fixtures/bindings'; function Component() { readShared().count++; return null }`,
      errors: [{ messageId: 'mutation' }],
    },
    {
      filename,
      code: `${storeBinding}; function Component() { useCounter(undefined).count = 1; return null }`,
      errors: [{ messageId: 'mutation' }],
    },
    {
      filename,
      options: [{ deepAliases: false }],
      code: `${storeBinding}; function Component() { const state = useCounter(); state.count = 1; const { items } = useCounter(); items.pop(); return null }`,
      errors: [{ messageId: 'mutation' }, { messageId: 'mutation' }],
    },
    {
      filename,
      code: `${storeBinding}; function Component() { const { items, map, set } = useCounter(); items.pop(); items.shift(); items.unshift('x'); items.splice(0, 1); items.sort(); items.reverse(); items.copyWithin(0, 1); items.fill('x'); map.delete('x'); map.clear(); set.delete('x'); set.clear(); return null }`,
      errors: Array.from({ length: 12 }, () => ({ messageId: 'mutation' as const })),
    },
  ],
})

ruleTester.run('no-render-instance-snapshot', noRenderInstanceSnapshot, {
  valid: [
    {
      filename,
      code: `${externalBinding}; import { useEffect as afterRender, useLayoutEffect, useInsertionEffect, useEffectEvent } from 'react'; function Component() { afterRender(() => { useExternalInstance().getSnapshot() }, []); useLayoutEffect(() => () => { useExternalInstance().getSnapshot() }, []); useInsertionEffect(() => { useExternalInstance().getSnapshot() }, []); const event = useEffectEvent(() => useExternalInstance().getSnapshot()); const handleClick = () => useExternalInstance().getSnapshot(); return <button onClick={handleClick} /> }`,
    },
    {
      filename,
      code: `${externalBinding}; import { useEffect } from 'react'; function readLater() { return useExternalInstance().getSnapshot() }; function Component() { useEffect(() => { readLater() }, []); return <button onClick={() => readLater()} /> }`,
    },
    {
      filename,
      code: `${externalBinding}; function Component() { const ClickHandler = () => useExternalInstance().getSnapshot(); return <button onClick={ClickHandler} /> }`,
    },
    {
      filename,
      code: `${externalBinding}; function Component() { const later = () => useExternalInstance().getSnapshot(); setTimeout(later, 0); setInterval(() => useExternalInstance().getSnapshot(), 10); queueMicrotask(() => useExternalInstance().getSnapshot()); return null }`,
    },
    {
      filename,
      code: `function useExternalInstance() { return { getSnapshot: () => ({ count: 0 }) } }; function Component() { return useExternalInstance().getSnapshot().count }`,
    },
  ],
  invalid: [
    {
      filename,
      code: `${externalBinding}; function Component() { return useExternalInstance().getSnapshot().count }`,
      errors: [{ messageId: 'renderSnapshot' }],
    },
    {
      filename,
      code: `${externalBinding}; export default function () { return useExternalInstance().getSnapshot().count }`,
      errors: [{ messageId: 'renderSnapshot' }],
    },
    {
      filename,
      code: `${externalBinding}; function readNow() { return useExternalInstance().getSnapshot() }; function Component() { return readNow().count }`,
      errors: [{ messageId: 'renderSnapshot' }],
    },
    {
      filename,
      code: `import { useExternalInstanceAlias as useInstance } from '@fixtures/reexport'; function Component() { const read = () => useInstance().getSnapshot(); return read().count }`,
      errors: [{ messageId: 'renderSnapshot' }],
    },
    {
      filename,
      code: `${externalBinding}; function useEffect(callback: () => void) { callback() }; function Component() { useEffect(() => useExternalInstance().getSnapshot()); return null }`,
      errors: [{ messageId: 'renderSnapshot' }],
    },
    {
      filename,
      code: `${externalBinding}; import { useMemo } from 'react'; function Component() { return useMemo(() => useExternalInstance().getSnapshot().count, []) }`,
      errors: [{ messageId: 'renderSnapshot' }],
    },
    {
      filename,
      code: `${externalBinding}; function Component() { const instance = useExternalInstance(); const alias = instance; return alias.getSnapshot().count }`,
      errors: [{ messageId: 'renderSnapshot' }],
    },
    {
      filename,
      code: `${externalBinding}; function Component() { const instance = useExternalInstance(); let alias: Store; alias = instance; return alias.getSnapshot().count }`,
      errors: [{ messageId: 'renderSnapshot' }],
    },
    {
      filename,
      code: `${externalBinding}; function Component() { let instance: Store; instance = useExternalInstance(); return instance.getSnapshot().count }`,
      errors: [{ messageId: 'renderSnapshot' }],
    },
    {
      filename,
      code: `${externalBinding}; function Component() { const { getSnapshot } = useExternalInstance(); return getSnapshot().count }`,
      errors: [{ messageId: 'renderSnapshot' }],
    },
    {
      filename,
      code: `${externalBinding}; function Widget(_props: { onReady: () => unknown }) { return null }; function Component() { const handleReady = () => useExternalInstance().getSnapshot(); return <Widget onReady={handleReady} /> }`,
      errors: [{ messageId: 'renderSnapshot' }],
    },
    {
      filename,
      code: `${externalBinding}; function setTimeout(callback: () => unknown, _delay?: number) { return callback() }; function queueMicrotask(callback: () => unknown) { return callback() }; function Component() { setTimeout(() => useExternalInstance().getSnapshot(), 0); queueMicrotask(() => useExternalInstance().getSnapshot()); return null }`,
      errors: [{ messageId: 'renderSnapshot' }, { messageId: 'renderSnapshot' }],
    },
  ],
})

ruleTester.run('no-unstable-selector-value', noUnstableSelectorValue, {
  valid: [
    {
      filename,
      code: `${storeBinding}; const cached = { ok: true }; function Component() { return useCounter(s => ({ count: s.count, next: s.count + 1, positive: s.count > 0, cached, nested: s.nested })) }`,
    },
    {
      filename,
      code: `${storeBinding}; function Component() { return useCounter(s => ({ absolute: Math.abs(s.count), label: String(s.count) })) }`,
    },
    {
      filename,
      code: `${storeBinding}; function keepPrimitive<T extends string | number>(value: T): T { return value }; function Component() { return useCounter(s => ({ value: keepPrimitive(s.count), nullable: s.count > 0 ? s.count : null })) }`,
    },
    {
      filename,
      code: `${storeBinding}; interface Brand { readonly __brand: unique symbol }; type Key = string & Brand; function createKey(value: number) { return String(value) as Key }; function Component() { return useCounter(s => ({ key: createKey(s.count) })) }`,
    },
    {
      filename,
      code: `function useCounter<T>(_selector: (value: { count: number }) => T): T { throw new Error() }; useCounter(s => ({ value: {} }))`,
    },
  ],
  invalid: [
    {
      filename,
      code: `${storeBinding}; function Component() { return useCounter(s => ({ object: { count: s.count }, array: [s.count], action: () => s.count })) }`,
      errors: [{ messageId: 'unstableValue' }, { messageId: 'unstableValue' }, { messageId: 'unstableValue' }],
    },
    {
      filename,
      code: `${storeBinding}; function Component() { return useCounter(s => ({ date: new Date(s.count), pattern: /x/u, jsx: <span>{s.count}</span> })) }`,
      errors: [{ messageId: 'unstableValue' }, { messageId: 'unstableValue' }, { messageId: 'unstableValue' }],
    },
    {
      filename,
      code: `${storeBinding}; function makeValue<T>(value: T): T { return value }; function Component() { return useCounter(s => ({ unknown: makeValue({ count: s.count }) })) }`,
      errors: [{ messageId: 'unstableValue' }],
    },
    {
      filename,
      code: `import { useShared as selectShared } from '@fixtures/bindings'; function Component() { return selectShared(s => ({ value: { count: s.count } })) }`,
      errors: [{ messageId: 'unstableValue' }],
    },
    {
      filename,
      code: `${storeBinding}; function makeUnknown<T>(value: T): unknown { return value }; function Component() { const local = { count: 1 }; return useCounter(s => ({ local, unknown: makeUnknown(s.count) })) }`,
      errors: [{ messageId: 'unstableValue' }, { messageId: 'unstableValue' }],
    },
    {
      filename,
      code: `${storeBinding}; function Component() { return useCounter(s => { const selection = { classValue: class Local {}, count: s.count }; return selection }) }`,
      errors: [{ messageId: 'unstableValue' }],
    },
    {
      filename,
      code: `${storeBinding}; interface Brand { readonly __brand: unique symbol }; type Box = { value: number } & Brand; function createBox(value: number) { return { value } as Box }; function Component() { return useCounter(s => ({ box: createBox(s.count) })) }`,
      errors: [{ messageId: 'unstableValue' }],
    },
  ],
})

ruleTester.run('pure-selector', pureSelector, {
  valid: [
    {
      filename,
      code: `${storeBinding}; function Component() { return useCounter(s => ({ count: Math.abs(s.count + 1), hasItem: s.items.includes('x'), nested: s.nested.value })) }`,
    },
    {
      filename,
      code: `${storeBinding}; function Component() { return useCounter(s => ({ label: String(s.count), finite: Number.isFinite(s.count), item: s.items.at(0), promise: Promise.resolve(s.count) })) }`,
    },
    {
      filename,
      code: `${storeBinding}; function Component() { return useCounter(s => ({ label: String(s.count).trim(), mapped: s.map.get('x'), present: s.set.has('x') })) }`,
    },
    {
      filename,
      code: `function useCounter<T>(_selector: (value: { count: number }) => T): T { throw new Error() }; useCounter(s => { console.log(s); return { count: s.count } })`,
    },
    {
      filename,
      code: `${storeBinding}; let total = 0; const visit = (_item: string) => { total++ }; function Component() { return useCounter(s => { const visit = (item: string) => item.trim(); return { values: s.items.map(visit) } }) }`,
    },
  ],
  invalid: [
    {
      filename,
      code: `${storeBinding}; function Component() { return useCounter(s => { s.count = 1; s.count++; delete s.nested.value; return { count: s.count } }) }`,
      errors: [{ messageId: 'impureSelector' }, { messageId: 'impureSelector' }, { messageId: 'impureSelector' }],
    },
    {
      filename,
      code: `${storeBinding}; function Component() { return useCounter(async s => ({ count: await Promise.resolve(s.count) })) }`,
      errors: [{ messageId: 'impureSelector' }, { messageId: 'impureSelector' }],
    },
    {
      filename,
      code: `${storeBinding}; function Component() { return useCounter(s => { if (s.count < 0) throw new Error('negative'); s.items.push('x'); console.log(s.count); return { count: s.count } }) }`,
      errors: [{ messageId: 'impureSelector' }, { messageId: 'impureSelector' }, { messageId: 'impureSelector' }],
    },
    {
      filename,
      code: `import { useShared as selectShared } from '@fixtures/bindings'; function Component() { return selectShared(s => { s.count += 1; return { count: s.count } }) }`,
      errors: [{ messageId: 'impureSelector' }],
    },
    {
      filename,
      code: `${storeBinding}; let total = 0; function Component() { return useCounter(function* (s) { total++; yield s.count; return { count: s.count } }) }`,
      errors: [{ messageId: 'impureSelector' }, { messageId: 'impureSelector' }, { messageId: 'impureSelector' }],
    },
    {
      filename,
      code: `${storeBinding}; function Component() { return useCounter(s => { s.clear(); return { count: s.count } }) }`,
      errors: [{ messageId: 'impureSelector' }],
    },
    {
      filename,
      code: `${storeBinding}; let total = 0; function Component() { return useCounter(s => ({ values: s.items.map(item => { total++; return item }), assigned: Object.assign({}, { count: s.count }) })) }`,
      errors: [{ messageId: 'impureSelector' }, { messageId: 'impureSelector' }],
    },
    {
      filename,
      code: `import { createStore } from '@violetflux/kerros'; class Map { get(_key: string) { return 1 } }; class Set { has(_value: string) { return true } }; function useCustomModel() { return { map: new Map(), set: new Set() } }; const [useCustom] = createStore(useCustomModel); function Component() { return useCustom(s => ({ value: s.map.get('x'), present: s.set.has('x') })) }`,
      errors: [{ messageId: 'impureSelector' }, { messageId: 'impureSelector' }],
    },
    {
      filename,
      code: `${storeBinding}; let total = 0; function Component() { return useCounter(s => { const visit = (item: string) => { total++; return item }; return { values: s.items.map(visit) } }) }`,
      errors: [{ messageId: 'impureSelector' }],
    },
    {
      filename,
      code: `${storeBinding}; let total = 0; function Component() { return useCounter(s => { function visit(item: string) { total++; if (item) s.items.forEach(visit); return item }; return { values: s.items.map(visit) } }) }`,
      errors: [{ messageId: 'impureSelector' }],
    },
    {
      filename,
      code: `${storeBinding}; class Effect { constructor() {} }; function Component() { return useCounter(s => { new Effect(); return { count: s.count } }) }`,
      errors: [{ messageId: 'impureSelector' }],
    },
  ],
})
