---
applyTo: '**'
---

# Branch Changeset Sync

When the local branch contains any changes vs `origin/main`, invoke the `create-modify-changeset-for-diff` skill, regardless of which files changed. The skill decides whether a changeset is warranted, updates existing ones, or adds an empty changeset for excluded-only diffs.

Refer to `.github/instructions/release.instructions.md` for warrants/excluded paths and bump rules. Do not duplicate them here.
