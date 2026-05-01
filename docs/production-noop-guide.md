# Production-safe noop and Tailwind v4 safelist guide

A practical guide to wiring `@viscalyx/developer-mode-core` and
`@viscalyx/developer-mode-react` into a production build so that:

1. The real overlay code is **never shipped to clients** when developer mode
   is feature-flagged off.
2. The build keeps working after `npm prune --omit=dev` removes the packages
   from `node_modules`.
3. Tailwind v4 generates the overlay's utility classes when developer mode
   **is** enabled, even though Tailwind v4 ignores `node_modules` by default.

This guide is meant to live next to the rest of the
`@viscalyx/developer-mode` documentation. It is self-contained: every code
sample below is copy-paste-ready into a generic React + Vite or Next.js
project.

## Contents

- [Problem statement](#problem-statement)
- [Mental model: the noop is a build-time swap](#mental-model-the-noop-is-a-build-time-swap)
- [Strategy A — alias to the package's `/noop`](#strategy-a--alias-to-the-packages-noop)
- [Strategy B — alias to a first-party stub](#strategy-b--alias-to-a-first-party-stub)
- [Tailwind v4: generating the overlay's classes](#tailwind-v4-generating-the-overlays-classes)
- [Optional dependency declaration](#optional-dependency-declaration)
- [Verification checklist](#verification-checklist)
- [Decision matrix](#decision-matrix)
- [Future work](#future-work)
- [License](#license)

## Problem statement

Three failure modes appear when an application feature-flags developer mode
off in production:

1. **Bundle weight & runtime cost.** Without an alias swap, the real
   provider's `keydown` listener, `MutationObserver`, and overlay React tree
   are shipped to every client even when they will never run. This is a
   small but real waste, and a needless attack surface on a production
   build.
2. **Build fails after pruning.** Many production deployments run
   `npm prune --omit=dev` (or `npm ci --omit=dev`) before bundling. If the
   bundler still resolves `@viscalyx/developer-mode-react` somewhere — even
   just to its `/noop` subpath — the build crashes once the package is no
   longer in `node_modules`.
3. **Tailwind v4 silently drops the overlay's classes.** Tailwind v4
   excludes `node_modules` from automatic source detection. Consumers who
   never opt the package back in get an unstyled badge/chip/toast even when
   developer mode is enabled — the classes are simply not emitted.

This guide describes two alias-swap strategies that fix (1) and (2), and
two safelist options that fix (3).

## Mental model: the noop is a build-time swap

`@viscalyx/developer-mode-core/noop` and
`@viscalyx/developer-mode-react/noop` are not designed for a runtime
`if (devMode) import(...)` branch. They are **build-time alias targets**.
You configure your bundler so that the bare specifier
`@viscalyx/developer-mode-react` resolves to a no-op implementation when a
build-time flag is off. After tree-shaking, the resulting bundle contains
neither the real overlay nor any reference to the package.

Two valid alias targets exist:

- **Strategy A** — point the alias at the package's own `/noop` subpath.
  Simple, but the package must still be installed at build time.
- **Strategy B** — point the alias at a tiny first-party stub in the
  consumer's source tree. Zero references to the package after build, so
  production deployments can omit it entirely.

Both strategies leave TypeScript type resolution untouched: imports are
type-checked against the package's `.` entry, regardless of which file the
bundler ultimately loads.

## Strategy A — alias to the package's `/noop`

### Next.js (Turbopack and webpack)

`next build` uses Turbopack in Next.js 15+, but the legacy `webpack(config)`
hook still applies to tooling that drives webpack. Configure both so the
behaviour is uniform.

```ts
// next.config.ts
import type { NextConfig } from 'next'

const enableDeveloperMode =
  process.env.ENABLE_DEVELOPER_MODE === 'true' ||
  process.env.NODE_ENV !== 'production'

const noopCore = '@viscalyx/developer-mode-core/noop'
const noopReact = '@viscalyx/developer-mode-react/noop'

const nextConfig: NextConfig = {
  // Required so the package's TypeScript / JSX is transpiled when
  // developer mode is enabled. Set to [] when disabled to keep the
  // package names out of `.next/required-server-files.json`.
  transpilePackages: enableDeveloperMode
    ? ['@viscalyx/developer-mode-core', '@viscalyx/developer-mode-react']
    : [],

  turbopack: {
    resolveAlias: !enableDeveloperMode
      ? {
          '@viscalyx/developer-mode-core': noopCore,
          '@viscalyx/developer-mode-react': noopReact,
        }
      : {},
  },

  webpack(config) {
    if (!enableDeveloperMode) {
      config.resolve.alias['@viscalyx/developer-mode-core'] = noopCore
      config.resolve.alias['@viscalyx/developer-mode-react'] = noopReact
    }
    return config
  },
}

export default nextConfig
```

### Vite + React

Use the **array form** of `resolve.alias`. The array form takes a `find`
regex/string that matches the bare specifier exactly, which prevents the
alias from accidentally catching subpath imports such as
`@viscalyx/developer-mode-core/noop` itself.

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const enableDeveloperMode =
  process.env.ENABLE_DEVELOPER_MODE === 'true' ||
  process.env.NODE_ENV !== 'production'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: !enableDeveloperMode
      ? [
          {
            find: /^@viscalyx\/developer-mode-core$/,
            replacement: '@viscalyx/developer-mode-core/noop',
          },
          {
            find: /^@viscalyx\/developer-mode-react$/,
            replacement: '@viscalyx/developer-mode-react/noop',
          },
        ]
      : [],
  },
  // Stop Vite's dev-server prebundler from dragging the real package
  // back in once the alias is in effect.
  optimizeDeps: !enableDeveloperMode
    ? {
        exclude: [
          '@viscalyx/developer-mode-core',
          '@viscalyx/developer-mode-react',
        ],
      }
    : undefined,
})
```

**Pros**: minimal config, no new files in your repo.

**Cons**: the package must be present in `node_modules` at build time.
`npm prune --omit=dev` before the build will fail.

## Strategy B — alias to a first-party stub

Add two tiny files to your own source tree that mirror the API surface of
the package's `/noop` exports. Point the alias at those files instead. The
production bundle (and the production install if you rerun the build there)
no longer references the developer-mode packages at all.

### Local stub files

```ts
// src/runtime/developer-mode-core-noop.ts
//
// Mirrors @viscalyx/developer-mode-core/noop. Update this file if the
// package's /noop entry adds new exports.

export function devMarker(_input: unknown): Record<string, never> {
  return {}
}

export function noopDevMarker(): Record<string, never> {
  return {}
}
```

```tsx
// src/runtime/developer-mode-react-noop.tsx
//
// Mirrors @viscalyx/developer-mode-react/noop. The real provider also
// accepts `labels` and `navigationKey` props; we declare extras loosely so
// the alias swap is invisible to callers.
'use client'

import { Fragment, type ReactNode } from 'react'

export default function DeveloperModeProvider({
  children,
}: {
  children: ReactNode
  [key: string]: unknown
}) {
  return <Fragment>{children}</Fragment>
}
```

### Bundler config — Next.js

```ts
// next.config.ts (excerpt)
import { fileURLToPath } from 'node:url'

const noopCoreRel = './src/runtime/developer-mode-core-noop.ts'
const noopReactRel = './src/runtime/developer-mode-react-noop.tsx'
const noopCoreAbs = fileURLToPath(new URL(noopCoreRel, import.meta.url))
const noopReactAbs = fileURLToPath(new URL(noopReactRel, import.meta.url))

const nextConfig = {
  transpilePackages: enableDeveloperMode
    ? ['@viscalyx/developer-mode-core', '@viscalyx/developer-mode-react']
    : [],
  turbopack: {
    resolveAlias: !enableDeveloperMode
      ? {
          // Turbopack treats a leading `/` as project-root-relative, so use
          // the `./`-prefixed relative path here.
          '@viscalyx/developer-mode-core': noopCoreRel,
          '@viscalyx/developer-mode-react': noopReactRel,
        }
      : {},
  },
  webpack(config) {
    if (!enableDeveloperMode) {
      // Webpack needs an absolute path.
      config.resolve.alias['@viscalyx/developer-mode-core'] = noopCoreAbs
      config.resolve.alias['@viscalyx/developer-mode-react'] = noopReactAbs
    }
    return config
  },
}

export default nextConfig
```

### Bundler config — Vite

```ts
// vite.config.ts (excerpt)
import { fileURLToPath } from 'node:url'

const noopCore = fileURLToPath(
  new URL('./src/runtime/developer-mode-core-noop.ts', import.meta.url),
)
const noopReact = fileURLToPath(
  new URL('./src/runtime/developer-mode-react-noop.tsx', import.meta.url),
)

export default defineConfig({
  resolve: {
    alias: !enableDeveloperMode
      ? [
          {
            find: /^@viscalyx\/developer-mode-core$/,
            replacement: noopCore,
          },
          {
            find: /^@viscalyx\/developer-mode-react$/,
            replacement: noopReact,
          },
        ]
      : [],
  },
})
```

**Pros**: production builds and runtimes contain zero references to the
developer-mode packages. Safe to `npm prune --omit=dev`.

**Cons**: two extra files. The stubs must be kept in sync with the package's
`/noop` exports; the upstream `/noop` API is intentionally tiny and stable,
so this is rarely a real burden.

## Tailwind v4: generating the overlay's classes

Tailwind v4 deliberately excludes `node_modules` from automatic source
detection. The overlay inside `@viscalyx/developer-mode-react` ships its
Tailwind utility classes hard-coded inside its compiled `dist/index.js`,
including arbitrary-value classes such as `bg-white/92`,
`tracking-[0.18em]`, and `text-[11px]`. Without explicit opt-in, those
classes are never emitted by Tailwind, and the badge/chip/toast render
unstyled.

Three options, in order of preference. The first is recommended for new
integrations; the other two are kept for completeness.

### Option 1 — import the upstream `safelist.css` (recommended)

Starting in `@viscalyx/developer-mode-react@0.2.0`, the package ships a
generated `safelist.css` containing one Tailwind v4 `@source inline(...)`
declaration per overlay class string. Import it once from your Tailwind
v4 entry CSS:

```css
/* src/styles/globals.css */
@import "tailwindcss";
@import "@viscalyx/developer-mode-react/safelist.css";
```

Why this is safe for noop production builds:

- It is a CSS file consumed at CSS-build time. There is no JavaScript
  runtime surface and nothing for the bundler to pull into the client.
- It is fully optional. The `./noop` entry does not need it; you can
  alias the package to `./noop` (Strategy A) or to a first-party stub
  (Strategy B) without touching this `@import`.
- The file is generated from
  [`packages/developer-mode-react/src/safelist.ts`](../packages/developer-mode-react/src/safelist.ts)
  during the package build, so the JS bundle and the safelist artifact
  cannot drift.

If you also want a JS source-of-truth (e.g. for a Tailwind config
generator), import the constants directly from
`@viscalyx/developer-mode-react/safelist`. See [`docs/safelist.md`](./safelist.md)
for the full downstream guide and verification steps.

### Option 2 — `@source` the package's `dist/`

Useful when you cannot upgrade to a version that ships `safelist.css`,
or when you want Tailwind to scan everything the package ships:

```css
/* src/styles/globals.css */
@import "tailwindcss";

@source "../../node_modules/@viscalyx/developer-mode-react/dist";
```

Simple, but couples your CSS build to the package being installed at
build time. Pair this with **Strategy A** if you do not need post-prune
builds.

### Option 3 — first-party safelist file (fallback)

Maintain a tiny safelist file in your own source tree that lists the literal
class strings used by the overlay. `@source` that file. The CSS build is
then independent of `node_modules` contents.

<!-- markdownlint-disable MD013 -->

```ts
// src/runtime/developer-mode-safelist.ts
//
// Tailwind v4 safelist for the @viscalyx/developer-mode-react overlay.
// Mirrors the class strings inside the published package's dist/index.js.
// If upstream adds new classes, copy them here. The drift-guard test below
// keeps this file honest.
export const DEVELOPER_MODE_OVERLAY_CLASSES = [
  // overlay root
  'pointer-events-none fixed inset-0 z-[100]',
  // hover outline
  'fixed rounded-lg border-2 border-primary-500/80 bg-primary-500/8 shadow-[0_0_0_1px_rgba(59,130,246,0.18)]',
  // badge ("Developer Mode")
  'pointer-events-none fixed right-4 top-20 rounded-full border border-primary-300/70 bg-white/92 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-primary-700 shadow-sm backdrop-blur-sm dark:border-primary-700/60 dark:bg-secondary-900/92 dark:text-primary-300',
  // hovered-element chip (copy-to-clipboard pill)
  'pointer-events-auto fixed max-w-64 truncate rounded-full border border-primary-300/80 bg-white/96 px-2.5 py-1 text-[11px] font-medium text-primary-900 shadow-[0_12px_24px_-18px_rgba(15,23,42,0.65)] backdrop-blur-sm transition hover:-translate-y-px hover:z-10 hover:border-primary-500 hover:bg-primary-50 focus-visible:outline-none focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-primary-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-primary-700/70 dark:bg-secondary-900/96 dark:text-primary-200 dark:hover:bg-secondary-800',
  // toast container (always-on classes)
  'pointer-events-none fixed bottom-4 right-4 max-w-md rounded-2xl border px-4 py-3 text-sm shadow-lg backdrop-blur-sm',
  // toast — success tone
  'border-emerald-300/80 bg-emerald-50/95 text-emerald-900 dark:border-emerald-700/60 dark:bg-emerald-950/85 dark:text-emerald-100',
  // toast — error tone
  'border-red-300/80 bg-red-50/95 text-red-900 dark:border-red-700/60 dark:bg-red-950/85 dark:text-red-100',
] as const
```

<!-- markdownlint-enable MD013 -->

```css
/* src/styles/globals.css */
@import "tailwindcss";

@source "../runtime/developer-mode-safelist.ts";
```

The class strings above are accurate for `@viscalyx/developer-mode-react`
at the time of writing. Prefer Option 1 above so the safelist is
fetched from the same package version as the runtime overlay.

### Drift-guard test (recommended)

A small unit test scans the published bundle for class-list literals and
asserts that every Tailwind token it finds is present in the local
safelist. If upstream changes the overlay styling, this test fails loudly
on the next `npm install`.

```ts
// tests/developer-mode-safelist.test.ts
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const require_ = createRequire(import.meta.url)
const distIndexPath = resolve(
  dirname(require_.resolve('@viscalyx/developer-mode-react/package.json')),
  'dist/index.js',
)
const distIndexSource = readFileSync(distIndexPath, 'utf8')

const safelistSource = readFileSync(
  resolve(__dirname, '../src/runtime/developer-mode-safelist.ts'),
  'utf8',
)

const STRING_LITERAL_RE = /"((?:[^"\\]|\\.)*)"/g
// Single non-ambiguous body class avoids the catastrophic backtracking that
// arises when overlapping `-` repetitions are split across multiple groups.
const TAILWIND_TOKEN_RE =
  /^(?:[a-z][a-z0-9-]*:)*-?[a-z][a-z0-9.[\]/_()#-]*\/?[0-9]*$/i

function looksLikeTailwindClassList(value: string): boolean {
  if (!value.includes(' ')) return false
  if (value.includes('<') || value.includes('{')) return false
  return value
    .split(/\s+/)
    .filter(Boolean)
    .some((t) => /^(?:dark:|hover:|focus:|focus-visible:)?(?:bg-|text-|border-|rounded|px-|py-|fixed|absolute|relative|flex|hidden|shadow|ring-|z-|backdrop-|transition|truncate|font-|tracking-|uppercase|pointer-events-)/.test(t))
}

describe('developer-mode safelist', () => {
  it('mentions every Tailwind token used by the published overlay', () => {
    const missing: { source: string; token: string }[] = []
    for (const match of distIndexSource.matchAll(STRING_LITERAL_RE)) {
      const value = match[1]
      if (!looksLikeTailwindClassList(value)) continue
      for (const token of value.split(/\s+/).filter(Boolean)) {
        if (!TAILWIND_TOKEN_RE.test(token)) continue
        if (!safelistSource.includes(token)) {
          missing.push({ source: value, token })
        }
      }
    }
    expect(missing, JSON.stringify(missing, null, 2)).toEqual([])
  })
})
```

## Optional dependency declaration

The alias-swap pattern means the developer-mode packages may be entirely
absent at runtime in production. A few notes on how to declare that
intent in `package.json`:

- **Recommended**: keep both packages in `devDependencies`. Production
  installs that run `npm ci --omit=dev` will not install them, and
  Strategy B keeps the build green.
- **`peerDependenciesMeta.optional` does not apply.** That field marks a
  declared `peerDependency` as optional. The developer-mode packages are
  consumed as direct dependencies, not peers, so this field has no effect
  here.
- **`optionalDependencies`** can be used in an application's
  `package.json` if you want the packages installed when present but not
  to fail the install when they aren't (for example, in a hardened
  production environment where the registry mirror is missing them). For
  most consumers `devDependencies` is the cleaner signal.

Document the assumption — "developer mode is build-time-flagged off in
production; the packages are dev-only" — in your repo's README so future
contributors understand why the alias swap exists.

## Verification checklist

Run these in order against your own application after wiring up either
strategy:

1. **Production build succeeds.**

   ```sh
   ENABLE_DEVELOPER_MODE=false NODE_ENV=production npm run build
   ```

2. **Zero runtime references to the package** (Strategy B only).

   ```sh
   grep -rl "@viscalyx/developer-mode" build-output/ \
     | grep -vE '\.map$|\.tsbuildinfo$|required-server-files'
   # expect no output
   ```

3. **Post-prune build succeeds** (Strategy B only).

   ```sh
   npm ci --omit=dev
   ENABLE_DEVELOPER_MODE=false NODE_ENV=production npm run build
   ```

4. **With developer mode enabled, the badge renders styled.** Start the dev
   server, press `Mod+Alt+Shift+H`, and confirm the "Developer Mode" pill
   appears top-right with its rounded border, white background, and
   uppercase letter spacing. If it appears unstyled, your Tailwind safelist
   is missing classes — re-check Options 1, 2, and 3 above.
5. **With developer mode disabled, the keyboard shortcut is a no-op** and
   no overlay-related code appears in the network tab.

## Decision matrix

| Concern | Strategy A (`/noop` alias) | Strategy B (local stub) |
| --- | --- | --- |
| Install-time deps | Required | Required |
| Build-time deps | **Required** | Not required |
| Production install (post-prune) | Build fails | Build OK |
| Runtime bundle size (off) | Zero overlay code | Zero overlay code |
| New files in your repo | None | 2 stubs |
| Maintenance | None | Sync stubs if `/noop` API grows |
| Drift risk | None | Low (drift-guard test catches it) |

## Future work

All three Tailwind opt-in options are documented above. Issue
[#17](https://github.com/viscalyx/developer-mode/issues/17) tracked
shipping the upstream `safelist.css` artifact and is resolved; consumers
still hand-curating Option 3 should consider switching to Option 1.

## License

This document is offered to the `viscalyx/developer-mode` project for
inclusion under that repository's license (MIT). It contains no
proprietary content and may be redistributed accordingly.
