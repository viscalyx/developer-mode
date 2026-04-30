# @viscalyx/developer-mode-core

## 0.2.1

### Patch Changes

- 363410f: Internal: release pipeline now publishes to npm via GitHub OIDC (npm
  Trusted Publishing) instead of an `NPM_TOKEN` automation token. No
  runtime or API changes; this release exists to validate the new
  publish path end to end and is the first version of each package
  published with provenance attestations.

## 0.2.0

### Minor Changes

- 7b93e6a: Widen the optional `context` and `value` fields on `DeveloperModeDescriptor`
  (and the derived `DeveloperModeTarget`) from `string` to `string | undefined`
  so descriptors built with a value that may be `undefined` are accepted under
  TypeScript's `exactOptionalPropertyTypes`. Runtime behavior is unchanged.
