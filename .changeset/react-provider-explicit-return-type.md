---
'@viscalyx/developer-mode-react': patch
---

Add explicit `ReactNode` return type annotations to the `DeveloperModeProvider`
component in both the main entry and the `./noop` subpath so the package can be
built with isolated declarations. No behavior changes for consumers.
