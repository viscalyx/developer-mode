# `@viscalyx/developer-mode`

A small TypeScript library monorepo that ships an in-app
"developer mode" overlay: hover any UI element with a keyboard
shortcut to see how it would be referred to in test selectors,
documentation, or QA notes, then copy that label to the clipboard.

This repository was extracted from
[`viscalyx/Kravhantering`](https://github.com/viscalyx/Kravhantering)
where it shipped as in-tree workspaces.

## Packages

<!-- markdownlint-disable MD013 -->

| Package | npm | Description |
| --- | --- | --- |
| [`@viscalyx/developer-mode-core`](./packages/developer-mode-core/README.md) | `npm i @viscalyx/developer-mode-core` | Framework-agnostic helpers, marker functions, and the visible-target scanner. No React dependency. |
| [`@viscalyx/developer-mode-react`](./packages/developer-mode-react/README.md) | `npm i @viscalyx/developer-mode-react` | React 19 provider and overlay. Peer-deps on `react` and `react-dom`. Re-exports types from the core. |

<!-- markdownlint-enable MD013 -->

Both packages are **ESM-only**, target Node ≥ 22, and follow
SemVer via [Changesets](https://github.com/changesets/changesets).

## Quick start

```ts
import { devMarker } from '@viscalyx/developer-mode-core'

const props = devMarker({ name: 'button', value: 'Save' })
// → { 'data-developer-mode-name': 'button',
//     'data-developer-mode-value': 'Save' }
```

```tsx
import DeveloperModeProvider from '@viscalyx/developer-mode-react'

export default function Layout({ children }) {
  return (
    <DeveloperModeProvider
      labels={{
        badge: 'Dev mode',
        copied: 'Copied to clipboard',
        copyFailed: 'Copy failed',
      }}
    >
      {children}
    </DeveloperModeProvider>
  )
}
```

For SSR or feature-flag-off builds, import the `./noop` subpath of
either package — the API is identical and every export is a no-op.
See [Production builds & feature-flagged off](#production-builds--feature-flagged-off)
below for the recommended bundler-alias wiring.

<!-- markdownlint-disable MD001 -->

### Production builds & feature-flagged off

<!-- markdownlint-enable MD001 -->

The `./noop` subpath of each package is intended to be wired up via a
**bundler alias swap**, not a runtime `import()` branch. With a single
alias entry, the real provider, marker code, and `keydown` listener are
removed from your production bundle, and the developer-mode packages can
remain `devDependencies` that are pruned in production.

Tailwind v4 deliberately excludes `node_modules` from automatic source
detection, so the overlay's utility classes must be opted in explicitly —
either by `@source`-ing the package's `dist/` directory, or by maintaining
a small first-party safelist file.

See [`docs/production-noop-guide.md`](./docs/production-noop-guide.md) for
copy-paste-ready Next.js (Turbopack + webpack) and Vite + React examples,
two alias-swap strategies (one that keeps the package present at build
time, one that lets you `npm prune --omit=dev`), the literal Tailwind
class list to safelist, and a drift-guard test sketch.

## Development

```bash
nvm install            # picks up the version in .nvmrc (Node 22+)
npm install
npm run check          # type-check, format, lint, build, tests, md
```

See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for the full local
workflow and [`RELEASING.md`](./RELEASING.md) for the release flow
(including the **ESM-only** policy).

## Documentation

- [`docs/architecture.md`](./docs/architecture.md) — how the two
  packages relate.
- [`docs/workflows.md`](./docs/workflows.md) — what each CI
  workflow does.
- [`docs/production-noop-guide.md`](./docs/production-noop-guide.md) —
  production-safe noop wiring and the Tailwind v4 safelist.

## License

[MIT](./LICENSE) © Viscalyx
