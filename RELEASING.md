# Releasing

This repo uses [Changesets](https://github.com/changesets/changesets)
to version and publish both packages **independently**.

- Both packages are **ESM-only**. There is no CJS output.
- Both packages target Node ≥ 22.
- Both packages publish to npm with `"access": "public"`.

## Author flow (every PR)

1. Make your change.
2. Run `npx changeset` and pick the affected packages and bump
   level (see "Choosing the bump" below).
3. The CLI writes a Markdown file under `.changeset/`. Commit it
   alongside your code change.
4. CI (`ci.yml` → `Verify changeset present` job) fails the PR if
   `packages/*/src/**` or a published `package.json` field changed
   without a matching changeset.

### Choosing the bump

For a library with a public API:

| Bump    | Use for                                                                                                  |
|---------|----------------------------------------------------------------------------------------------------------|
| `patch` | Bug fix; no public-API or runtime-contract change.                                                       |
| `minor` | New export, new optional prop, expanded `engines` / `peerDependencies`.                                  |
| `major` | Removed/renamed export or subpath, changed prop signatures, dropped Node major, narrowed peer-dep range. |

When in doubt, prefer the higher bump.

## Maintainer flow (after merge to `main`)

1. `release.yml` runs on every push to `main`.
2. The `changesets/action` step inspects the pending changesets.
3. If there are any, it opens (or updates) a "Version Packages" PR
   that:
   - Consumes all pending changeset files.
   - Bumps the matching `package.json` versions.
   - Updates each package's `CHANGELOG.md`.
4. Review and merge the Version Packages PR. The next push to
   `main` runs `release.yml` again, sees no pending changesets,
   and runs `npm run release` (`npm run build && changeset publish`).
5. Each newly bumped package is published to npm under
   `@viscalyx/...` with public access.
6. `changesets/action` creates the GitHub Release and tags
   per-package.

## Hard rules

- **Never edit `CHANGELOG.md` or any package's `version` field by
  hand.** Changesets owns both.
- **Never delete a changeset under `.changeset/*.md`** to "skip" a
  release. Open a follow-up PR with a `patch` changeset that
  documents the correction instead.
- **Never publish manually** from a workstation, except for the
  first publish of a brand-new npm package as described in
  "Initial publish" below. All later publishes go through
  `release.yml`.

## ESM-only policy

Both packages launch as ESM-only. This is a deliberate choice:

- Halves published bytes vs a dual ESM/CJS build.
- Avoids the [dual-package
  hazard](https://nodejs.org/api/packages.html#dual-package-hazard).
- Every supported runtime — Node ≥ 22, Next.js 16, React 19, all
  modern bundlers — loads ESM natively.

If a CJS consumer ever appears and the demand is real:

1. Open a discussion or issue first; this is a maintainer-level
   decision, not an ad-hoc PR.
2. The change is a **minor** bump for both packages: flip
   `tsdown` `format` to `['esm', 'cjs']`, add a `"require"`
   condition to every `exports` block, add `"main"` for legacy
   resolvers.
3. Update this section of `RELEASING.md` so future contributors
   know the policy changed.

## Required secrets and npm authentication

The `release.yml` workflow uses **npm Trusted Publishing** (OIDC)
to authenticate to npmjs.com — no long-lived npm tokens are used.
A `GITHUB_TOKEN` is still required, but only for `changesets/action`
to open the Version Packages PR and to create GitHub Releases /
tags; it is not used to publish to npm.

What is required:

- `GITHUB_TOKEN` — provided automatically by Actions and consumed
  by `changesets/action` to open the Version Packages PR and to
  create GitHub Releases / tags.
- The workflow-level `id-token: write` permission (already set in
  `release.yml`) so GitHub can mint the OIDC token that npm
  exchanges for short-lived publish credentials.
- A **Trusted Publisher** configured on npmjs.com for each
  published package (`@viscalyx/developer-mode-core` and
  `@viscalyx/developer-mode-react`), pointing at:
  - Repository: `viscalyx/developer-mode`
  - Workflow filename: `release.yml`
  - Job / environment: the `release` job, no environment.

If the workflow file is ever renamed, the Trusted Publisher
configuration on npmjs.com must be updated to match the new
filename or the publish step will fail with an authorization
error.

## Initial publish

A brand-new package name must exist on npm before npm Trusted
Publishing can be enabled for it. The first publish is therefore
the only allowed manual publish from a workstation.

Use npm for this repo; do not use `pnpm`. The release script already
runs the correct Changesets publish command:
`npm run release` (`npm run build && changeset publish`).

Bootstrap a new package like this:

1. Merge the Version Packages PR so package versions and changelogs
   are prepared by Changesets.
2. Pull the latest `main`.
3. Run `npm ci`.
4. Run `npm login`.
5. Run `npm run release`.
6. On npmjs.com, configure a Trusted Publisher for the newly
   published package:
   - Repository: `viscalyx/developer-mode`
   - Workflow filename: `release.yml`
   - Job / environment: the `release` job, no environment.
7. Use the GitHub Actions release workflow for every later publish.
