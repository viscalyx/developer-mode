---
'@viscalyx/developer-mode-core': patch
'@viscalyx/developer-mode-react': patch
---

Include the MIT `LICENSE` file in the published tarball. Both packages
already listed `LICENSE` in `package.json#files` but the file itself
was missing from the package directory, so it was not actually shipped
to npm. The license terms are unchanged.
