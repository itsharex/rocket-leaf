import { useState, useCallback, useEffect } from 'react'

const STORAGE_KEY = 'rocket-leaf-settings'

export type Language = 'en' | 'zh'
export type FontSize = 'small' | 'medium' | 'large'
export type Timezone = 'local' | 'utc'
export type TimestampFormat = 'datetime' | 'ms'
export type ProxyType = 'http' | 'socks5'
export type FetchLimit = 32 | 64 | 128

export interface AppSettings {
  // General
  language: Language
  fontSize: FontSize
  monospaceFont: string
  autoConnectLast: boolean
  // Connection
  connectTimeoutMs: number
  requestTimeoutMs: number
  globalAccessKey: string
  globalSecretKey: string
  skipTlsVerify: boolean
  proxyEnabled: boolean
  proxyType: ProxyType
  proxyHost: string
  proxyPort: string
  // Message & Display
  timezone: Timezone
  timestampFormat: TimestampFormat
  autoFormatJson: boolean
  maxPayloadRenderBytes: number
  fetchLimit: FetchLimit
}

const DEFAULTS: AppSettings = {
  language: 'zh',
  fontSize: 'medium',
  monospaceFont: 'JetBrains Mono',
  autoConnectLast: true,
  connectTimeoutMs: 3000,
  requestTimeoutMs: 5000,
  globalAccessKey: '',
  globalSecretKey: '',
  skipTlsVerify: false,
  proxyEnabled: false,
  proxyType: 'http',
  proxyHost: '',
  proxyPort: '',
  timezone: 'local',
  timestampFormat: 'datetime',
  autoFormatJson: true,
  maxPayloadRenderBytes: 512 * 1024, // 500KB
  fetchLimit: 64,
}

function loadStored(): AppSettings {
  if (typeof localStorage === 'undefined') return DEFAULTS
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULTS
    const parsed = JSON.parse(raw) as Partial<AppSettings>
    return { ...DEFAULTS, ...parsed }
  } catch {
    return DEFAULTS
  }
}

function saveStored(settings: AppSettings) {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // ignore
  }
}

export function useSettings() {
  const [settings, setSettingsState] = useState<AppSettings>(loadStored)

  useEffect(() => {
    saveStored(settings)
  }, [settings])

  const setSetting = useCallback(<K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettingsState((prev) => ({ ...prev, [key]: value }))
  }, [])

  return { settings, setSetting }
}
