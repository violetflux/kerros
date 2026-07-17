import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.tsx'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  deps: {
    neverBundle: ['react', 'use-sync-external-store'],
  },
})
