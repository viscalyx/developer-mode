import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    noop: 'src/noop.ts',
  },
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  target: 'node22',
  treeshake: true,
  // Keep `.js`/`.d.ts` output so the `exports` map in package.json
  // remains stable. tsdown 0.21 defaults this to `true` for
  // `platform: 'node'`, which would emit `.mjs`/`.d.mts`.
  fixedExtension: false,
})
