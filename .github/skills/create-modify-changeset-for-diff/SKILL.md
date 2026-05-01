---
name: create-modify-changeset-for-diff
description: 'Inspect the local branch diff vs origin/main, decide whether a changeset is warranted, and create a new changeset or update an existing one to reflect subsequent commits'
---

# Create or Modify Changeset for Diff

Run on every code change to a local branch. Source of truth for which paths warrant a changeset and which bump applies is `.github/instructions/release.instructions.md`. Do not duplicate those rules; cross-reference them.

## Inputs

- Optional base ref. Default: `git merge-base origin/main HEAD`.
- Optional explicit package list to override auto-detection.

## Steps

1. Refresh base: `git fetch origin main`.
2. Compute diff: `git diff --name-only <base> HEAD` plus `git status --porcelain` for uncommitted edits.
3. Classify each path using `release.instructions.md`:
   - Warrants: `packages/*/src/**`, shipped fields of `packages/*/package.json`, files in a package's `files` array (incl. `packages/*/README.md`).
   - Excluded: `.github/**`, `.changeset/config.json`, root tooling (`tsconfig*.json`, `biome.json`, `vitest.config.ts`, `vitest.setup.ts`, `.nvmrc`), top-level docs (`README.md`, `docs/**`, `CONTRIBUTING.md`, `RELEASING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md`), `packages/*/CHANGELOG.md`, `packages/*/tsconfig.json`, `packages/*/tsdown.config.ts`, `packages/*/tests/**`.
   - Unsure: ask the user before creating.
4. Map affected packages to a bump silently using the rules in `release.instructions.md`. Take the highest applicable bump when multiple categories apply.
5. Enumerate `.changeset/*.md` (skip `README.md`). For each existing changeset:
   - If its package set overlaps the current set, update it: widen package list, raise bump only (never lower), refine the summary to reflect new commits, preserve still-accurate wording.
   - Otherwise leave it alone.
6. If no existing changeset matches, write a new file `.changeset/<verb>-<noun>.md` directly:

   ```md
   ---
   '@scope/pkg-a': patch
   '@scope/pkg-b': minor
   ---

   Consumer-facing summary.
   ```

7. Summary rules: present tense, consumer-facing, observable behavior, no PR numbers, no commit hashes, no internal jargon.
8. Never edit `CHANGELOG.md` or any package `version` field.
9. Final verify (mandatory, runs even when no changeset was created or updated): `npx changeset status --since=origin/main`. Surface a non-zero exit; do not swallow it.
10. If step 9 exits non-zero **and** every changed path was classified as Excluded in step 3 (i.e. no real changeset is warranted), the failure is the Changesets CLI flagging a touched `package.json` (or similar) that ships no consumer-visible change. Resolve it by running `npx changeset add --empty` (non-interactive). The CLI writes a file like `.changeset/<random-slug>.md` with empty `---\n---\n` frontmatter; optionally append a one-line reason as the body. Re-verify with `npx changeset status` (without `--since`); it should exit zero. Note that `npx changeset status --since=origin/main` will still error until the new empty changeset is staged or committed, because `--since` only inspects git-tracked files. Only fall back to an empty changeset when the diff is genuinely Excluded — never use it to skip a release for changes that warrant one.

## Output

- `No changeset needed` with the excluded paths that justify it, or
- `Created empty .changeset/<slug>.md` (with the excluded paths that justify it) when step 10 applied, or
- `Created .changeset/<slug>.md` / `Updated .changeset/<slug>.md` with a diff preview,
- followed by the `npx changeset status --since=origin/main` result.

## Missing Context Rule

If a changed path cannot be confidently classified, ask the user before creating or updating a changeset. Do not invent a bump or summary.
