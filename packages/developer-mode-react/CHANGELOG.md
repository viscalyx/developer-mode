# @viscalyx/developer-mode-react

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
