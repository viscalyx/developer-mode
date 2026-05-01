---
applyTo: 'packages/developer-mode-react/{src/index.tsx,src/safelist.ts,tsdown.config.ts,tests/safelist.test.ts}'
---

# Overlay Safelist (AI-only instruction)

`packages/developer-mode-react/src/safelist.ts` is the single source of
truth for every Tailwind class string the overlay renders. It is
published via the `./safelist` and `./safelist.css` subpaths and is
part of the package's public API.

## Rules

- Never inline a Tailwind class string in `src/index.tsx`. Add (or
  extend) a constant in `src/safelist.ts` and reference it via
  `className={CONSTANT}`.
- Every named constant MUST be re-exported in
  `DEVELOPER_MODE_OVERLAY_CLASSES`, in visual order
  (root, hover outline, badge, chip, toast container, toast tones).
- Use explicit `string` type annotations on every exported constant —
  `tsdown` runs `unplugin-isolated-decl` and rejects inferred types.
- Do not edit `dist/safelist.css` by hand. It is regenerated from
  `dist/safelist.js` by the `onSuccess` hook in `tsdown.config.ts`.
- Do not change the shape of `dist/safelist.css` (one
  `@source inline("…");` per entry, in
  `DEVELOPER_MODE_OVERLAY_CLASSES` order) without a `major` changeset.

## Changesets

Any change to `src/safelist.ts` is a public-API change to
`@viscalyx/developer-mode-react`:

- Adding a constant or extending a class string = `minor`.
- Removing or renaming a constant = `major`.
- Reordering `DEVELOPER_MODE_OVERLAY_CLASSES` entries = `major`
  (changes the published `safelist.css` line order).

## Companion updates

When `src/safelist.ts` changes, update in the same PR:

- `packages/developer-mode-react/README.md` (Tailwind safelist
  section), and
- `docs/safelist.md` (constant list and downstream guidance).

## Drift guard

`tests/safelist.test.ts` MUST pass. If it fails:

- Move the offending inline class into `src/safelist.ts` and import
  it back into `src/index.tsx`.
- Never relax the regex or skip the assertion to make the test pass.

## CI

The `safelist-check` job in `.github/workflows/ci.yml` builds the
React package and re-runs `tests/safelist.test.ts` in isolation. Do
not remove or rename that job without updating
`docs/workflows.md`.
