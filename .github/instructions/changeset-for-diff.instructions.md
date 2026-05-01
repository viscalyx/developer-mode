---
applyTo: '{packages/**,.changeset/**}'
---

# Branch Changeset Sync

When the local branch contains changes vs `origin/main`, invoke the `create-modify-changeset-for-diff` skill to create a new changeset or update existing ones to reflect subsequent commits. The skill decides whether a changeset is warranted.

Refer to `.github/instructions/release.instructions.md` for warrants/excluded paths and bump rules. Do not duplicate them here.
