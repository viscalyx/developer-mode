'use client'

import {
  buildDeveloperModeCopyText,
  type DeveloperModeTarget,
  findDeveloperModeTargetAt,
  isEditableTarget,
  matchesDeveloperModeShortcut,
} from '@viscalyx/developer-mode-core'
import {
  type ReactNode,
  startTransition,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'
import {
  OVERLAY_BADGE_CLASS,
  OVERLAY_CHIP_CLASS,
  OVERLAY_HOVER_OUTLINE_CLASS,
  OVERLAY_ROOT_CLASS,
  TOAST_CONTAINER_CLASS,
  TOAST_ERROR_TONE_CLASS,
  TOAST_SUCCESS_TONE_CLASS,
} from './safelist'

export interface DeveloperModeLabels {
  badge: string
  copied: string
  copyFailed: string
}

export interface DeveloperModeProviderProps {
  children: ReactNode
  labels: DeveloperModeLabels
  navigationKey?: string | null
}

async function copyTextToClipboard(text: string) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // Fall through to the legacy copy path.
  }

  const textarea = document.createElement('textarea')
  try {
    textarea.value = text
    textarea.setAttribute('readonly', 'true')
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    textarea.style.pointerEvents = 'none'
    document.body.appendChild(textarea)
    textarea.select()
    const didCopy = document.execCommand('copy')
    return didCopy
  } catch {
    return false
  } finally {
    textarea.remove()
  }
}

export default function DeveloperModeProvider({
  children,
  labels,
  navigationKey,
}: DeveloperModeProviderProps): ReactNode {
  const [mounted, setMounted] = useState(false)
  const [enabled, setEnabled] = useState(false)
  const [hoveredTarget, setHoveredTarget] =
    useState<DeveloperModeTarget | null>(null)
  const [toast, setToast] = useState<{
    message: string
    tone: 'error' | 'success'
  } | null>(null)
  const enabledRef = useRef(false)
  const mountedRef = useRef(false)
  const lastElementRef = useRef<HTMLElement | null>(null)
  const lastNavigationKeyRef = useRef<string | null | undefined>(navigationKey)
  const scanFrameRef = useRef<number | null>(null)
  const toastTimeoutRef = useRef<number | null>(null)

  const clearToastTimer = useCallback(() => {
    if (toastTimeoutRef.current !== null) {
      window.clearTimeout(toastTimeoutRef.current)
      toastTimeoutRef.current = null
    }
  }, [])

  const clearScanFrame = useCallback(() => {
    if (scanFrameRef.current !== null) {
      window.cancelAnimationFrame(scanFrameRef.current)
      scanFrameRef.current = null
    }
  }, [])

  const showToast = useCallback(
    (message: string, tone: 'error' | 'success') => {
      clearToastTimer()
      setToast({ message, tone })
      toastTimeoutRef.current = window.setTimeout(() => {
        setToast(null)
        toastTimeoutRef.current = null
      }, 2200)
    },
    [clearToastTimer],
  )

  const resolveTarget = useCallback(() => {
    if (!mountedRef.current || !enabledRef.current) {
      return
    }

    if (scanFrameRef.current !== null) {
      return
    }

    scanFrameRef.current = window.requestAnimationFrame(() => {
      scanFrameRef.current = null
      const el = lastElementRef.current

      if (!el?.isConnected) {
        startTransition(() => setHoveredTarget(null))
        return
      }

      const target = findDeveloperModeTargetAt(el)
      startTransition(() => setHoveredTarget(target))
    })
  }, [])

  const handleCopy = useCallback(
    async (target: DeveloperModeTarget) => {
      const payload = buildDeveloperModeCopyText(target)
      const copied = await copyTextToClipboard(payload)

      showToast(
        `${copied ? labels.copied : labels.copyFailed}: ${payload}`,
        copied ? 'success' : 'error',
      )
    },
    [labels, showToast],
  )

  useEffect(() => {
    enabledRef.current = enabled
  }, [enabled])

  useEffect(() => {
    mountedRef.current = mounted
  }, [mounted])

  useEffect(() => {
    setMounted(true)
    mountedRef.current = true

    return () => {
      mountedRef.current = false
      clearScanFrame()
      clearToastTimer()
    }
  }, [clearScanFrame, clearToastTimer])

  useEffect(() => {
    if (!mounted) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!matchesDeveloperModeShortcut(event)) {
        return
      }

      if (isEditableTarget(event.target)) {
        return
      }

      event.preventDefault()
      setEnabled(current => !current)
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [mounted])

  useEffect(() => {
    if (!mounted) {
      return
    }

    if (!enabled) {
      clearScanFrame()
      lastElementRef.current = null
      setHoveredTarget(null)
    }
  }, [clearScanFrame, enabled, mounted])

  useEffect(() => {
    if (!mounted) {
      lastNavigationKeyRef.current = navigationKey
      return
    }

    if (lastNavigationKeyRef.current === navigationKey) {
      return
    }

    lastNavigationKeyRef.current = navigationKey
    clearScanFrame()
    lastElementRef.current = null
    setHoveredTarget(null)
  }, [clearScanFrame, mounted, navigationKey])

  useEffect(() => {
    if (!mounted || !enabled) {
      return
    }

    const handlePointerMove = (event: PointerEvent) => {
      const el = event.target as HTMLElement | null
      if (el?.closest('[data-developer-mode-overlay-root="true"]')) {
        return
      }

      lastElementRef.current = el
      resolveTarget()
    }

    const handlePointerLeave = () => {
      lastElementRef.current = null
      startTransition(() => setHoveredTarget(null))
    }

    const handleViewportChange = () => resolveTarget()
    const observer = new MutationObserver(() => resolveTarget())

    document.addEventListener('pointermove', handlePointerMove)
    document.addEventListener('pointerleave', handlePointerLeave)
    window.addEventListener('resize', handleViewportChange)
    window.addEventListener('scroll', handleViewportChange, true)
    observer.observe(document.body, {
      attributes: true,
      characterData: true,
      childList: true,
      subtree: true,
    })

    return () => {
      document.removeEventListener('pointermove', handlePointerMove)
      document.removeEventListener('pointerleave', handlePointerLeave)
      window.removeEventListener('resize', handleViewportChange)
      window.removeEventListener('scroll', handleViewportChange, true)
      observer.disconnect()
    }
  }, [enabled, mounted, resolveTarget])

  return (
    <>
      {children}
      {mounted &&
        (enabled || toast) &&
        createPortal(
          <div
            className={OVERLAY_ROOT_CLASS}
            data-developer-mode-overlay-root="true"
          >
            {hoveredTarget ? (
              <div
                aria-hidden="true"
                className={OVERLAY_HOVER_OUTLINE_CLASS}
                style={{
                  height: hoveredTarget.bounds.height,
                  left: hoveredTarget.bounds.left,
                  top: hoveredTarget.bounds.top,
                  width: hoveredTarget.bounds.width,
                }}
              />
            ) : null}

            {enabled ? (
              <div
                className={OVERLAY_BADGE_CLASS}
                data-testid="developer-mode-badge"
              >
                {labels.badge}
              </div>
            ) : null}

            {enabled && hoveredTarget ? (
              <button
                aria-label={hoveredTarget.payload}
                className={OVERLAY_CHIP_CLASS}
                data-developer-mode-overlay-chip="true"
                data-developer-mode-overlay-label={hoveredTarget.label}
                onClick={() => void handleCopy(hoveredTarget)}
                style={{
                  left: hoveredTarget.anchorLeft,
                  top: hoveredTarget.anchorTop,
                }}
                type="button"
              >
                {hoveredTarget.label}
              </button>
            ) : null}

            {toast ? (
              <div
                className={`${TOAST_CONTAINER_CLASS} ${
                  toast.tone === 'success'
                    ? TOAST_SUCCESS_TONE_CLASS
                    : TOAST_ERROR_TONE_CLASS
                }`}
                data-developer-mode-toast="true"
              >
                {toast.message}
              </div>
            ) : null}
          </div>,
          document.body,
        )}
    </>
  )
}
