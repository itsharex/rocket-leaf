import type { CSSProperties } from 'react'

interface SpinnerProps {
  /** Outer diameter in px. Defaults to 14. */
  size?: number
  /** Stroke width. Defaults to scale to size (~1.4–2px). */
  thickness?: number
  className?: string
  style?: CSSProperties
}

/**
 * A small, refined ring spinner used for any in-flight action — refresh,
 * save, send, etc. Inherits `currentColor`, so it works on any button
 * surface, and respects the global `data-animations="off"` flag because
 * the keyframe is a normal CSS animation (the global rule zeros its
 * duration).
 */
export function Spinner({
  size = 14,
  thickness,
  className = '',
  style,
}: SpinnerProps) {
  const stroke = thickness ?? Math.max(1.25, size / 8)
  return (
    <span
      role="status"
      aria-label="loading"
      className={`rl-spinner ${className}`}
      style={{
        width: size,
        height: size,
        borderWidth: stroke,
        ...style,
      }}
    />
  )
}
