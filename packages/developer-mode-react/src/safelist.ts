/**
 * Tailwind v4 safelist for the `@viscalyx/developer-mode-react` overlay.
 *
 * This module is the single source of truth for every Tailwind utility
 * string the overlay renders. The provider in `./index` imports these
 * constants directly so the published bundle and the safelist can never
 * drift apart, and the build emits a sibling `safelist.css` generated
 * from this same module for consumers who prefer a CSS `@import` over a
 * JS `@source`.
 *
 * Consumers should not import from this module at runtime — it exists
 * to be referenced by Tailwind's source-detection (`@source`) or
 * Tailwind config generators. See `docs/safelist.md` for the full
 * downstream guide.
 */

export const OVERLAY_ROOT_CLASS: string =
  'pointer-events-none fixed inset-0 z-[100]'

export const OVERLAY_HOVER_OUTLINE_CLASS: string =
  'fixed rounded-lg border-2 border-primary-500/80 bg-primary-500/8 shadow-[0_0_0_1px_rgba(59,130,246,0.18)]'

export const OVERLAY_BADGE_CLASS: string =
  'pointer-events-none fixed right-4 top-20 rounded-full border border-primary-300/70 bg-white/92 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-primary-700 shadow-sm backdrop-blur-sm dark:border-primary-700/60 dark:bg-secondary-900/92 dark:text-primary-300'

export const OVERLAY_CHIP_CLASS: string =
  'pointer-events-auto fixed max-w-64 truncate rounded-full border border-primary-300/80 bg-white/96 px-2.5 py-1 text-[11px] font-medium text-primary-900 shadow-[0_12px_24px_-18px_rgba(15,23,42,0.65)] backdrop-blur-sm transition hover:-translate-y-px hover:z-10 hover:border-primary-500 hover:bg-primary-50 focus-visible:outline-none focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-primary-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-primary-700/70 dark:bg-secondary-900/96 dark:text-primary-200 dark:hover:bg-secondary-800'

export const TOAST_CONTAINER_CLASS: string =
  'pointer-events-none fixed bottom-4 right-4 max-w-md rounded-2xl border px-4 py-3 text-sm shadow-lg backdrop-blur-sm'

export const TOAST_SUCCESS_TONE_CLASS: string =
  'border-emerald-300/80 bg-emerald-50/95 text-emerald-900 dark:border-emerald-700/60 dark:bg-emerald-950/85 dark:text-emerald-100'

export const TOAST_ERROR_TONE_CLASS: string =
  'border-red-300/80 bg-red-50/95 text-red-900 dark:border-red-700/60 dark:bg-red-950/85 dark:text-red-100'

/**
 * Aggregate of every overlay class string. Order matches the visual
 * grouping in `./index`: root, hover outline, badge, chip, toast
 * container, then the two toast tones.
 */
export const DEVELOPER_MODE_OVERLAY_CLASSES: readonly string[] = [
  OVERLAY_ROOT_CLASS,
  OVERLAY_HOVER_OUTLINE_CLASS,
  OVERLAY_BADGE_CLASS,
  OVERLAY_CHIP_CLASS,
  TOAST_CONTAINER_CLASS,
  TOAST_SUCCESS_TONE_CLASS,
  TOAST_ERROR_TONE_CLASS,
]

export type DeveloperModeOverlayClass = string
