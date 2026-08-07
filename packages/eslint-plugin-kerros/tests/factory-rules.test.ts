import { bindingNaming } from '../src/rules/binding-naming'
import { factoryAtModuleScope } from '../src/rules/factory-at-module-scope'
import { modelConvention } from '../src/rules/model-convention'
import { noProviderKeyProp } from '../src/rules/no-provider-key-prop'
import { filename, ruleTester } from './rule-tester'

ruleTester.run('factory-at-module-scope', factoryAtModuleScope, {
  valid: [
    {
      filename,
      code: `
        import { createStore as makeStore } from '@violetflux/kerros'
        function useCounterModel() { return { count: 0 } }
        const [useCounter, CounterProvider] = makeStore(useCounterModel)
      `,
    },
    {
      filename,
      code: `
        function useCounter() { return { count: 0 } }
        function Component() { const value = useCounter(); return value.count }
      `,
    },
    {
      filename,
      code: `
        function createStore(model: () => object) { return model() }
        function Component() { return createStore(() => ({ count: 0 })) }
      `,
    },
  ],
  invalid: [
    {
      filename,
      code: `
        import { createStore } from '@violetflux/kerros'
        function Component() {
          function useCounterModel() { return { count: 0 } }
          const [useCounter] = createStore(useCounterModel)
          return useCounter().count
        }
      `,
      errors: [{ messageId: 'moduleScope' }],
    },
    {
      filename,
      code: `
        import { bind } from '@fixtures/reexport'
        function setup() { return bind<{ getSnapshot(): {}; subscribe(listener: () => void): () => void }>() }
      `,
      errors: [{ messageId: 'moduleScope' }],
    },
    {
      filename,
      code: `
        import { createStore } from '@violetflux/kerros'
        function useCounterModel() { return { count: 0 } }
        const bindings = true ? createStore(useCounterModel) : null
      `,
      errors: [{ messageId: 'moduleScope' }],
    },
    {
      filename,
      code: `
        import { createStore } from '@violetflux/kerros'
        function useCounterModel() { return { count: 0 } }
        const bindings = [1].map(() => createStore(useCounterModel))
      `,
      errors: [{ messageId: 'moduleScope' }],
    },
    {
      filename,
      code: `
        import { createStore } from '@violetflux/kerros'
        function useCounterModel() { return { count: 0 } }
        { const bindings = createStore(useCounterModel) }
      `,
      errors: [{ messageId: 'moduleScope' }],
    },
    {
      filename,
      code: `
        import { createStore } from '@violetflux/kerros'
        function useCounterModel() { return { count: 0 } }
        class Registry { static { createStore(useCounterModel) } }
      `,
      errors: [{ messageId: 'moduleScope' }],
    },
  ],
})

ruleTester.run('model-convention', modelConvention, {
  valid: [
    {
      filename,
      code: `
        import { create as createStore } from '@fixtures/reexport'
        import { useSharedModel } from '@fixtures/models'
        const [useShared, SharedProvider] = createStore(useSharedModel)
      `,
    },
  ],
  invalid: [
    {
      filename,
      code: `
        import { createStore } from '@violetflux/kerros'
        const [useCounter, CounterProvider] = createStore(() => ({ count: 0 }))
      `,
      errors: [{ messageId: 'anonymousModel' }],
    },
    {
      filename,
      code: `
        import { createStore } from '@violetflux/kerros'
        function counterModel() { return { count: 0 } }
        const [useCounter, CounterProvider] = createStore(counterModel)
      `,
      errors: [{ messageId: 'modelName' }],
    },
    {
      filename,
      code: `
        import { createStore } from '@violetflux/kerros'
        function setup() {
          function useCounterModel() { return { count: 0 } }
          return createStore(useCounterModel)
        }
      `,
      errors: [{ messageId: 'moduleModel' }],
    },
  ],
})

ruleTester.run('binding-naming', bindingNaming, {
  valid: [
    {
      filename,
      code: `
        import { createStore, bindStore } from '@violetflux/kerros'
        function useCounterModel() { return { count: 0 } }
        interface CounterStore { getSnapshot(): { count: number }; subscribe(listener: () => void): () => void }
        const [useCounter, CounterProvider] = createStore(useCounterModel)
        const [, ScopedCounterProvider, useScopedCounterInstance] = bindStore<CounterStore>('ScopedCounter')
      `,
    },
    {
      filename,
      code: `
        import { bind as connect } from '@fixtures/reexport'
        interface CounterStore { getSnapshot(): { count: number }; subscribe(listener: () => void): () => void }
        const [useCounter, CounterProvider, useCounterInstance] = connect<CounterStore>('Counter')
      `,
    },
  ],
  invalid: [
    {
      filename,
      code: `
        import { bindStore } from '@violetflux/kerros'
        interface CounterStore { getSnapshot(): { count: number }; subscribe(listener: () => void): () => void }
        const [counter, Provider, instance] = bindStore<CounterStore>()
      `,
      errors: [
        { messageId: 'hookName' },
        { messageId: 'providerName' },
        { messageId: 'instanceName' },
      ],
    },
    {
      filename,
      code: `
        import { createStore } from '@violetflux/kerros'
        function useCounterModel() { return { count: 0 } }
        const binding = createStore(useCounterModel)
      `,
      errors: [{ messageId: 'destructureBinding' }],
    },
    {
      filename,
      code: `
        import { createStore } from '@violetflux/kerros'
        function useCounterModel() { return { count: 0 } }
        const [useWrong, WrongProvider] = createStore(useCounterModel)
      `,
      errors: [
        { messageId: 'hookName' },
        { messageId: 'providerName' },
      ],
    },
  ],
})

ruleTester.run('no-provider-key-prop', noProviderKeyProp, {
  valid: [
    {
      filename,
      code: `
        import { createStore } from '@violetflux/kerros'
        function useCounterModel(props: { initial: number }) { return { count: props.initial } }
        const [useCounter, CounterProvider] = createStore(useCounterModel)
      `,
    },
    {
      filename,
      code: `
        function createStore(model: (props: { key: string }) => object) { return model({ key: 'local' }) }
        function useCounterModel(props: { key: string }) { return { value: props.key } }
        createStore(useCounterModel)
      `,
    },
  ],
  invalid: [
    {
      filename,
      code: `
        import { createStore } from '@violetflux/kerros'
        function useCounterModel(props: { key: string; initial: number }) { return { count: props.initial } }
        const [useCounter, CounterProvider] = createStore(useCounterModel)
      `,
      errors: [{ messageId: 'keyProp' }],
    },
    {
      filename,
      code: `
        import { createStore } from '@violetflux/kerros'
        function useCounterModel<T extends { key: string }>(props: T) { return { value: props.key } }
        const [useCounter, CounterProvider] = createStore(useCounterModel)
      `,
      errors: [{ messageId: 'keyProp' }],
    },
  ],
})
