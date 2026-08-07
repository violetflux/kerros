import { defineConfig } from 'vitest/config'

export default defineConfig({
  root: import.meta.dirname,
  test: {
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    include: [
      'tests/typed-config.test.ts',
      'tests/plugin-api.test.ts',
      'tests/factory-rules.test.ts',
      'tests/access-rules.test.ts',
      'tests/selector-rules.test.ts',
      'tests/semantic-rules.test.ts',
      'tests/external-rules.test.ts',
    ],
  },
})
