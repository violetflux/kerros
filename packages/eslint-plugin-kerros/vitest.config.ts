import { defineConfig } from 'vitest/config'

export default defineConfig({
  root: import.meta.dirname,
  test: {
    environment: 'node',
    include: [
      'tests/plugin-api.test.ts',
      'tests/lite-rules.test.ts',
    ],
  },
})
