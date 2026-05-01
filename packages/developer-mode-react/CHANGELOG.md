# @viscalyx/developer-mode-react

## 0.2.0

### Minor Changes

- bb386fb: Publish the overlay's Tailwind v4 class list as a first-class artifact.
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

### Patch Changes

- bb386fb: Include the MIT `LICENSE` file in the published tarball. Both packages
  already listed `LICENSE` in `package.json#files` but the file itself
  was missing from the package directory, so it was not actually shipped
  to npm. The license terms are unchanged.
- Updated dependencies [bb386fb]
- Updated dependencies [bb386fb]
  - @viscalyx/developer-mode-core@0.2.2

## 0.1.2

### Patch Changes

- 363410f: Internal: release pipeline now publishes to npm via GitHub OIDC (npm
  Trusted Publishing) instead of an `NPM_TOKEN` automation token. No
  runtime or API changes; this release exists to validate the new
  publish path end to end and is the first version of each package
  published with provenance attestations.
- Updated dependencies [363410f]
  - @viscalyx/developer-mode-core@0.2.1

## 0.1.1

### Patch Changes

- 7b93e6a: Add explicit `ReactNode` return type annotations to the `DeveloperModeProvider`
  component in both the main entry and the `./noop` subpath so the package can be
  built with isolated declarations. No behavior changes for consumers.
- Updated dependencies [7b93e6a]
  - @viscalyx/developer-mode-core@0.2.0
