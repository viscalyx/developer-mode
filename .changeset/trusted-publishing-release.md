---
'@viscalyx/developer-mode-core': patch
'@viscalyx/developer-mode-react': patch
---

Internal: release pipeline now publishes to npm via GitHub OIDC (npm
Trusted Publishing) instead of an `NPM_TOKEN` automation token. No
runtime or API changes; this release exists to validate the new
publish path end to end and is the first version of each package
published with provenance attestations.
