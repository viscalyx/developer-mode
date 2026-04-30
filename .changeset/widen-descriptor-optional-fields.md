---
'@viscalyx/developer-mode-core': minor
---

Widen the optional `context` and `value` fields on `DeveloperModeDescriptor`
(and the derived `DeveloperModeTarget`) from `string` to `string | undefined`
so descriptors built with a value that may be `undefined` are accepted under
TypeScript's `exactOptionalPropertyTypes`. Runtime behavior is unchanged.
