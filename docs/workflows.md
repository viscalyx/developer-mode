# Workflows

This repo runs four GitHub Actions workflows. Each one is small
and single-purpose. **If you add or change a workflow, update
this file in the same PR.**

## `ci.yml`

Runs on every push to `main` and every pull request targeting
`main`.

### `check` job

The full local quality bar, in this order:

1. `npm ci`
2. `npm run type-check`
3. `npm run format:check`
4. `npm run lint`
5. `npm run lint:md`
6. `npm run build`
7. `npm run test`

Fails fast on the first non-zero step. Mirrors `npm run check`
locally.

### `changeset` job

Pull-request-only. Runs `npx changeset status --since=origin/main`
and fails if the PR touches `packages/*/src/**` or a published
`package.json` field without a matching changeset under
`.changeset/`.

Repo-tooling-only PRs (workflow tweaks, `biome.json` edits,
top-level docs) pass this job cleanly because no package change is
detected.

## `codeql.yml`

GitHub's standard CodeQL analysis for the `javascript-typescript`
language. Runs on:

- Pushes to `main`.
- Pull requests targeting `main`.
- Weekly on Mondays at 06:00 UTC (`schedule: cron: "0 6 * * 1"`)
  to catch newly disclosed query-pack issues against unchanged
  code.

Findings show up under the **Security → Code scanning** tab.

## `release.yml`

Runs on every push to `main` and orchestrates Changesets.

1. `npm ci` and `npm run build` and `npm run test`.
2. `changesets/action@v1` runs.
   - **If pending changesets exist**, it opens (or updates) a
     "Version Packages" PR that bumps `package.json` versions
     and rewrites `CHANGELOG.md` files.
   - **If no pending changesets exist**, it runs `npm run release`
     (`npm run build && changeset publish`), which publishes any
     newly bumped packages to npm and creates GitHub Releases /
     tags.

### Required secrets and npm authentication

- `GITHUB_TOKEN` — provided automatically by Actions; used by
  `changesets/action` for the Version Packages PR and GitHub
  Releases.
- **No `NPM_TOKEN`.** Publishing to npm uses **npm Trusted
  Publishing** (OIDC), enabled by the workflow-level
  `id-token: write` permission plus a Trusted Publisher
  configured on npmjs.com for each package. The Trusted Publisher
  must reference this repository and the workflow filename
  `release.yml`; if the file is renamed, update the npm side to
  match.
- A package must exist on npm before Trusted Publishing can be
  enabled for it. The first publish of a brand-new package is the
  only documented manual bootstrap exception; see
  [`RELEASING.md`](../RELEASING.md#initial-publish) for the exact
  npm commands.

See [`RELEASING.md`](../RELEASING.md) for the full author and
maintainer flow.

## `copilot-setup-steps.yml`

Pre-install hook for the GitHub Copilot coding agent. When Copilot
spins up an ephemeral runner to work on an issue or PR, it executes
the steps defined here **before** handing control to the agent, so
the agent starts with `node_modules/` already populated.

Triggers:

- `workflow_dispatch` — manual run from the Actions tab.
- `push` and `pull_request` — only when this workflow file itself
  changes, so edits can be validated. The other paths that should
  re-run the setup (such as `package.json`, `package-lock.json`,
  `.nvmrc`) are listed but commented out; opt them in by uncommenting.

Steps:

1. `actions/checkout@v6`.
2. `actions/setup-node@v6` with `node-version-file: .nvmrc` and
   `cache: npm`.
3. `npm ci`.

The job is named **exactly** `copilot-setup-steps`. Copilot only
picks up a job with that name; renaming it silently disables the
hook. There is intentionally no `npm run check` step — if Copilot
pushes a commit with lint or test errors, a failing pre-step would
block the PR-comment-driven re-runs Copilot uses to iterate on a fix.
