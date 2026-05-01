import { writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: {
    index: 'src/index.tsx',
    noop: 'src/noop.tsx',
    safelist: 'src/safelist.ts',
  },
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  target: 'node22',
  treeshake: true,
  external: [
    'react',
    'react-dom',
    'react/jsx-runtime',
    '@viscalyx/developer-mode-core',
  ],
  // Generate dist/safelist.css from the freshly built dist/safelist.js
  // so the JS and CSS artifacts can never disagree.
  onSuccess: async () => {
    const distSafelistJs = resolve(process.cwd(), 'dist/safelist.js')
    const mod = (await import(
      `${pathToFileURL(distSafelistJs).href}?t=${Date.now()}`
    )) as { DEVELOPER_MODE_OVERLAY_CLASSES: readonly string[] }

    const lines = [
      '/*',
      ' * Tailwind v4 safelist for the @viscalyx/developer-mode-react overlay.',
      ' *',
      ' * GENERATED FROM src/safelist.ts — do not edit by hand.',
      ' * Consume from a Tailwind v4 entry CSS file:',
      ' *   @import "@viscalyx/developer-mode-react/safelist.css";',
      ' */',
      '',
    ]
    for (const classList of mod.DEVELOPER_MODE_OVERLAY_CLASSES) {
      lines.push(`@source inline("${classList}");`)
    }
    lines.push('')

    await writeFile(
      resolve(process.cwd(), 'dist/safelist.css'),
      lines.join('\n'),
      'utf8',
    )
  },
})
