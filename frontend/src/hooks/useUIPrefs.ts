import { useCallback, useEffect, useState } from 'react'

export type AccentKey =
  | 'default'
  | 'blue'
  | 'green'
  | 'orange'
  | 'red'
  | 'purple'
  | 'cyan'

export interface UIPrefs {
  accent: AccentKey
  animations: boolean
  reduceTransparency: boolean
  highContrast: boolean
}

const STORAGE_KEY = 'rocket-leaf:ui-prefs'

const DEFAULTS: UIPrefs = {
  accent: 'default',
  animations: true,
  reduceTransparency: false,
  highContrast: false,
}

// HSL values for each accent (used as `--primary` / `--ring`)
const ACCENT_HSL: Record<Exclude<AccentKey, 'default'>, { primary: string; primaryFg: string }> = {
  blue:   { primary: '217 91% 60%', primaryFg: '0 0% 100%' },
  green:  { primary: '142 71% 38%', primaryFg: '0 0% 100%' },
  orange: { primary: '21 90% 48%',  primaryFg: '0 0% 100%' },
  red:    { primary: '0 72% 51%',   primaryFg: '0 0% 100%' },
  purple: { primary: '271 81% 56%', primaryFg: '0 0% 100%' },
  cyan:   { primary: '188 91% 37%', primaryFg: '0 0% 100%' },
}

function loadPrefs(): UIPrefs {
  if (typeof window === 'undefined') return { ...DEFAULTS }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULTS }
    const parsed = JSON.parse(raw) as Partial<UIPrefs>
    return {
      accent: (parsed.accent as AccentKey) || DEFAULTS.accent,
      animations: typeof parsed.animations === 'boolean' ? parsed.animations : DEFAULTS.animations,
      reduceTransparency:
        typeof parsed.reduceTransparency === 'boolean' ? parsed.reduceTransparency : DEFAULTS.reduceTransparency,
      highContrast: typeof parsed.highContrast === 'boolean' ? parsed.highContrast : DEFAULTS.highContrast,
    }
  } catch {
    return { ...DEFAULTS }
  }
}

function applyAccent(accent: AccentKey) {
  const root = document.documentElement
  if (accent === 'default') {
    root.style.removeProperty('--primary')
    root.style.removeProperty('--primary-foreground')
    root.style.removeProperty('--ring')
  } else {
    const v = ACCENT_HSL[accent]
    root.style.setProperty('--primary', v.primary)
    root.style.setProperty('--primary-foreground', v.primaryFg)
    root.style.setProperty('--ring', v.primary)
  }
  root.setAttribute('data-accent', accent)
}

function applyPrefs(p: UIPrefs) {
  const root = document.documentElement
  applyAccent(p.accent)
  root.setAttribute('data-animations', p.animations ? 'on' : 'off')
  root.classList.toggle('rl-reduce-transparency', p.reduceTransparency)
  root.classList.toggle('rl-high-contrast', p.highContrast)
}

export function useUIPrefs() {
  const [prefs, setPrefs] = useState<UIPrefs>(() => loadPrefs())

  useEffect(() => {
    applyPrefs(prefs)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
    } catch {
      // storage may be unavailable; preferences only affect current session
    }
  }, [prefs])

  const setAccent = useCallback((accent: AccentKey) => {
    setPrefs((prev) => ({ ...prev, accent }))
  }, [])

  const setAnimations = useCallback((animations: boolean) => {
    setPrefs((prev) => ({ ...prev, animations }))
  }, [])

  const setReduceTransparency = useCallback((reduceTransparency: boolean) => {
    setPrefs((prev) => ({ ...prev, reduceTransparency }))
  }, [])

  const setHighContrast = useCallback((highContrast: boolean) => {
    setPrefs((prev) => ({ ...prev, highContrast }))
  }, [])

  return {
    prefs,
    setAccent,
    setAnimations,
    setReduceTransparency,
    setHighContrast,
  }
}

// Bootstrap: apply persisted prefs as early as possible to avoid FOUC.
export function bootstrapUIPrefs() {
  if (typeof document === 'undefined') return
  applyPrefs(loadPrefs())
}
