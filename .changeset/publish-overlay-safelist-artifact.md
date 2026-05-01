---
'@viscalyx/developer-mode-react': minor
---

Publish the overlay's Tailwind v4 class list as a first-class artifact.
Two new subpath exports are available:

- `@viscalyx/developer-mode-react/safelist.css` — a generated CSS file
  with one `@source inline("…")` declaration per overlay class string.
  Add `@import "@viscalyx/developer-mode-react/safelist.css";` to your
  Tailwind v4 entry CSS to opt the overlay's classes into Tailwind's
  output without `@source`-ing `node_modules`.
- `@viscalyx/developer-mode-react/safelist` — a TypeScript module
  exporting `DEVELOPER_MODE_OVERLAY_CLASSES` and per-region constants
  (`OVERLAY_BADGE_CLASS`, `OVERLAY_CHIP_CLASS`,
  `TOAST_SUCCESS_TONE_CLASS`, …) for advanced consumers (Tailwind
  config generators, CSS-in-JS, custom `@source` paths).

The overlay JSX now sources its class strings from the same module, so
the published JS bundle and both safelist artifacts cannot drift. See
`docs/safelist.md` for the downstream consumption guide and the
fallback for consumers who cannot import package CSS.
