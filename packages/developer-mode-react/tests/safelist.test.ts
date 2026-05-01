import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  DEVELOPER_MODE_OVERLAY_CLASSES,
  OVERLAY_BADGE_CLASS,
  OVERLAY_CHIP_CLASS,
  OVERLAY_HOVER_OUTLINE_CLASS,
  OVERLAY_ROOT_CLASS,
  TOAST_CONTAINER_CLASS,
  TOAST_ERROR_TONE_CLASS,
  TOAST_SUCCESS_TONE_CLASS,
} from '../src/safelist'

const packageRoot = resolve(__dirname, '..')
const overlaySource = readFileSync(
  resolve(packageRoot, 'src/index.tsx'),
  'utf8',
)

// Match string and template literals long enough to be a class list, then
// keep only the ones that contain at least one obvious Tailwind utility.
const STRING_LITERAL_RE = /(['"`])((?:\\.|(?!\1)[\s\S])*?)\1/g
const TAILWIND_TOKEN_HINT_RE =
  /(?:^|\s)(?:dark:|hover:|focus:|focus-visible:)?(?:bg-|text-|border-|rounded|px-|py-|fixed|absolute|relative|flex|hidden|shadow|ring-|z-|backdrop-|transition|truncate|font-|tracking-|uppercase|pointer-events-|max-w-|top-|right-|bottom-|left-|inset-)/

function looksLikeTailwindClassList(value: string): boolean {
  if (!value.includes(' ')) return false
  if (value.includes('<') || value.includes('{')) return false
  return TAILWIND_TOKEN_HINT_RE.test(value)
}

describe('@viscalyx/developer-mode-react/safelist', () => {
  it('aggregates every named overlay class constant', () => {
    expect(DEVELOPER_MODE_OVERLAY_CLASSES).toEqual([
      OVERLAY_ROOT_CLASS,
      OVERLAY_HOVER_OUTLINE_CLASS,
      OVERLAY_BADGE_CLASS,
      OVERLAY_CHIP_CLASS,
      TOAST_CONTAINER_CLASS,
      TOAST_SUCCESS_TONE_CLASS,
      TOAST_ERROR_TONE_CLASS,
    ])
  })

  it('contains no Tailwind class literals inside src/index.tsx', () => {
    // Drift guard: every Tailwind class string in the overlay MUST come
    // from src/safelist.ts so the published JS and the safelist artifact
    // can never disagree. If this fails, move the literal into
    // src/safelist.ts and reference it from src/index.tsx.
    const offenders: string[] = []
    for (const match of overlaySource.matchAll(STRING_LITERAL_RE)) {
      const value = match[2] ?? ''
      if (looksLikeTailwindClassList(value)) {
        offenders.push(value)
      }
    }
    expect(offenders, JSON.stringify(offenders, null, 2)).toEqual([])
  })

  it('writes one @source inline declaration per safelist entry to dist/safelist.css', () => {
    let css: string
    try {
      css = readFileSync(resolve(packageRoot, 'dist/safelist.css'), 'utf8')
    } catch {
      // Skip when the package has not been built yet (e.g. a focused test
      // run). The CI safelist-check job builds first and re-runs this
      // file, so coverage is not lost.
      return
    }

    for (const classList of DEVELOPER_MODE_OVERLAY_CLASSES) {
      expect(
        css,
        `dist/safelist.css is missing an @source inline declaration for: ${classList}`,
      ).toContain(`@source inline("${classList}");`)
    }
  })
})
