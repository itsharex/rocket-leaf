import { useCallback, useState } from 'react'
import {
  Sun,
  Settings as SettingsIcon,
  PanelLeft,
  Search,
  Globe,
  Database,
  Info,
  Folder,
  Check,
  Download,
  Upload,
  Trash2,
  RotateCcw,
  RefreshCw,
  Github,
  ExternalLink,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Browser } from '@wailsio/runtime'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '../shell'
import {
  useSettings,
  type ThemeMode,
  type Language,
  type Timezone,
  type TimestampFormat,
  type ProxyType,
  type FetchLimit,
} from '@/hooks/useSettings'
import { useUIPrefs, type AccentKey } from '@/hooks/useUIPrefs'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import logoUrl from '@/assets/logo.png'
import { exportAllConfig, importAllConfig, clearCache as clearCacheApi } from '@/api/settings'

const APP_VERSION = __APP_VERSION__
const GITHUB_URL = 'https://github.com/amigoer/rocket-leaf'
const GITHUB_ISSUES_URL = 'https://github.com/amigoer/rocket-leaf/issues'
const GITHUB_RELEASES_URL = 'https://github.com/amigoer/rocket-leaf/releases/latest'

type SectionId = 'appearance' | 'general' | 'fonts' | 'message' | 'proxy' | 'data' | 'about'

const SECTIONS: { id: SectionId; icon: LucideIcon }[] = [
  { id: 'appearance', icon: Sun },
  { id: 'general', icon: SettingsIcon },
  { id: 'fonts', icon: PanelLeft },
  { id: 'message', icon: Search },
  { id: 'proxy', icon: Globe },
  { id: 'data', icon: Database },
  { id: 'about', icon: Info },
]

const ACCENT_COLORS: { key: AccentKey; c: string }[] = [
  { key: 'default', c: '#0a0a0a' },
  { key: 'blue',    c: '#2563eb' },
  { key: 'green',   c: '#16a34a' },
  { key: 'orange',  c: '#ea580c' },
  { key: 'red',     c: '#dc2626' },
  { key: 'purple',  c: '#9333ea' },
  { key: 'cyan',    c: '#0891b2' },
]

const THEMES: { mode: ThemeMode; nameKey: string; descKey: string }[] = [
  { mode: 'light',  nameKey: 'settings.appearance.themes.light',  descKey: 'settings.appearance.themes.lightDesc' },
  { mode: 'dark',   nameKey: 'settings.appearance.themes.dark',   descKey: 'settings.appearance.themes.darkDesc' },
  { mode: 'system', nameKey: 'settings.appearance.themes.system', descKey: 'settings.appearance.themes.systemDesc' },
]

const FETCH_LIMITS: FetchLimit[] = [32, 64, 128]

const PROXY_TYPE_OPTIONS: { value: ProxyType; label: string }[] = [
  { value: 'http', label: 'HTTP' },
  { value: 'socks5', label: 'SOCKS5' },
]

const LANGUAGE_OPTIONS: { value: Language; label: string }[] = [
  { value: 'zh', label: '简体中文' },
  { value: 'en', label: 'English' },
]

const DATA_PATHS: { platform: string; path: string }[] = [
  { platform: 'macOS', path: '~/Library/Application Support/rocket-leaf/' },
  { platform: 'Linux', path: '~/.config/rocket-leaf/' },
  { platform: 'Windows', path: '%AppData%\\rocket-leaf\\' },
]

const MIN_FONT_SIZE = 12
const MAX_FONT_SIZE = 18

type Palette = { bg: string; panel: string; border: string; fg: string; muted: string; line: string }
const LIGHT_P: Palette = { bg: '#ffffff', panel: '#fafafa', border: '#e5e5e5', fg: '#0a0a0a', muted: '#a3a3a3', line: '#f0f0f0' }
const DARK_P: Palette = { bg: '#0a0a0a', panel: '#141414', border: '#262626', fg: '#fafafa', muted: '#737373', line: '#262626' }

function MiniAppChrome({ p, half }: { p: Palette; half?: 'left' | 'right' }) {
  const sidebarW = half === 'right' ? 0 : 18
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', overflow: 'hidden' }}>
      {half !== 'right' && (
        <div
          style={{
            width: sidebarW,
            background: p.panel,
            borderRight: '1px solid ' + p.border,
            padding: '6px 3px',
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
          }}
        >
          <div style={{ height: 3, background: p.fg, opacity: 0.85, borderRadius: 1 }} />
          <div style={{ height: 3, background: p.muted, opacity: 0.5, borderRadius: 1 }} />
          <div style={{ height: 3, background: p.muted, opacity: 0.5, borderRadius: 1 }} />
        </div>
      )}
      <div
        style={{
          flex: 1,
          background: p.bg,
          padding: '6px 6px 0',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <div style={{ width: 14, height: 3, background: p.fg, opacity: 0.9, borderRadius: 1 }} />
          <div style={{ flex: 1 }} />
          <div style={{ width: 6, height: 3, background: p.muted, opacity: 0.5, borderRadius: 1 }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2.5, marginTop: 2 }}>
          <div style={{ height: 2.5, background: p.line, borderRadius: 1, width: '85%' }} />
          <div style={{ height: 2.5, background: p.line, borderRadius: 1, width: '70%' }} />
          <div style={{ height: 2.5, background: p.line, borderRadius: 1, width: '78%' }} />
        </div>
      </div>
    </div>
  )
}

// --- Tiny shared bits ---

function SettingsRow({
  title,
  hint,
  children,
  bordered = true,
}: {
  title: string
  hint?: string
  children: React.ReactNode
  bordered?: boolean
}) {
  return (
    <div
      className="flex items-center justify-between p-4"
      style={bordered ? { borderBottom: '1px solid hsl(var(--border))' } : undefined}
    >
      <div className="min-w-0 flex-1 pr-4">
        <div className="text-[13px] font-medium">{title}</div>
        {hint && <div className="rl-muted mt-1 text-[12px]">{hint}</div>}
      </div>
      <div className="flex shrink-0 items-center gap-2">{children}</div>
    </div>
  )
}

function Switch({
  on,
  onClick,
}: {
  on: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onClick}
      className={'rl-switch ' + (on ? 'on' : '')}
    />
  )
}

// =================== Section Panels ===================

function AppearancePanel() {
  const { t } = useTranslation()
  const { settings, setSetting } = useSettings()
  const { prefs, setAccent, setAnimations, setReduceTransparency, setHighContrast } = useUIPrefs()
  return (
    <>
      <div className="rl-section-label" style={{ marginTop: 0 }}>{t('settings.appearance.theme')}</div>
      <div className="grid gap-2.5" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {THEMES.map((th) => {
          const active = settings.theme === th.mode
          const palette = th.mode === 'dark' ? DARK_P : LIGHT_P
          return (
            <div
              key={th.mode}
              className="rl-card"
              onClick={() => setSetting('theme', th.mode)}
              style={{
                padding: 0,
                overflow: 'hidden',
                borderColor: active ? 'hsl(var(--foreground))' : 'hsl(var(--border))',
                boxShadow: active ? '0 0 0 1px hsl(var(--foreground))' : undefined,
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  height: 84,
                  position: 'relative',
                  background:
                    th.mode === 'system'
                      ? 'linear-gradient(105deg, #ffffff 0%, #ffffff 49%, #262626 49%, #0a0a0a 100%)'
                      : palette.bg,
                  borderBottom: '1px solid hsl(var(--border))',
                }}
              >
                {th.mode === 'system' ? (
                  <div style={{ position: 'absolute', inset: 0, display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                    <MiniAppChrome p={LIGHT_P} half="left" />
                    <MiniAppChrome p={DARK_P} half="right" />
                  </div>
                ) : (
                  <MiniAppChrome p={palette} />
                )}
              </div>
              <div className="flex items-center justify-between" style={{ padding: '10px 12px' }}>
                <div>
                  <div className="text-[13px] font-medium" style={{ lineHeight: 1.2 }}>{t(th.nameKey)}</div>
                  <div className="rl-muted text-[12px]" style={{ marginTop: 2 }}>{t(th.descKey)}</div>
                </div>
                <div
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 999,
                    border: '1px solid ' + (active ? 'hsl(var(--foreground))' : 'hsl(var(--border))'),
                    background: active ? 'hsl(var(--foreground))' : 'transparent',
                    display: 'grid',
                    placeItems: 'center',
                    color: 'hsl(var(--background))',
                  }}
                >
                  {active && <Check size={10} strokeWidth={3} />}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="rl-section-label" style={{ marginTop: 24 }}>{t('settings.appearance.accent')}</div>
      <div className="rl-card" style={{ padding: 16 }}>
        <div className="flex flex-wrap items-center gap-2">
          {ACCENT_COLORS.map((c) => {
            const active = prefs.accent === c.key
            return (
              <button
                type="button"
                key={c.key}
                onClick={() => setAccent(c.key)}
                aria-pressed={active}
                className="flex flex-col items-center gap-1 cursor-pointer bg-transparent border-0 p-0"
                style={{ width: 48 }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 999,
                    background: c.c,
                    border: active ? '2px solid hsl(var(--foreground))' : '2px solid transparent',
                    outline: active ? '2px solid hsl(var(--background))' : 'none',
                    outlineOffset: -4,
                    display: 'grid',
                    placeItems: 'center',
                    color: 'white',
                  }}
                >
                  {active && <Check size={14} strokeWidth={3} />}
                </div>
                <span
                  className="text-[12px]"
                  style={{ color: active ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))' }}
                >
                  {t(`settings.appearance.accentNames.${c.key}`)}
                </span>
              </button>
            )
          })}
        </div>
        <div className="rl-muted mt-3 text-[12px]">{t('settings.appearance.accentHint')}</div>
      </div>

      <div className="rl-section-label" style={{ marginTop: 24 }}>{t('settings.appearance.a11y')}</div>
      <div className="rl-card">
        <SettingsRow
          title={t('settings.appearance.animations')}
          hint={t('settings.appearance.animationsHint')}
        >
          <Switch on={prefs.animations} onClick={() => setAnimations(!prefs.animations)} />
        </SettingsRow>
        <SettingsRow
          title={t('settings.appearance.reduceTransparency')}
          hint={t('settings.appearance.reduceTransparencyHint')}
        >
          <Switch
            on={prefs.reduceTransparency}
            onClick={() => setReduceTransparency(!prefs.reduceTransparency)}
          />
        </SettingsRow>
        <SettingsRow
          title={t('settings.appearance.highContrast')}
          hint={t('settings.appearance.highContrastHint')}
          bordered={false}
        >
          <Switch on={prefs.highContrast} onClick={() => setHighContrast(!prefs.highContrast)} />
        </SettingsRow>
      </div>
    </>
  )
}

function GeneralPanel() {
  const { t } = useTranslation()
  const { settings, setSetting } = useSettings()
  return (
    <>
      <div className="rl-section-label" style={{ marginTop: 0 }}>{t('settings.general.languageRegion')}</div>
      <div className="rl-card">
        <SettingsRow title={t('settings.general.language')} hint={t('settings.general.languageHint')}>
          <select
            className="rl-select"
            style={{ width: 200 }}
            value={settings.language}
            onChange={(e) => setSetting('language', e.target.value as Language)}
          >
            {LANGUAGE_OPTIONS.map((l) => (
              <option key={l.value} value={l.value}>{l.label}</option>
            ))}
          </select>
        </SettingsRow>
        <SettingsRow title={t('settings.general.timezone')} hint={t('settings.general.timezoneHint')} bordered={false}>
          <select
            className="rl-select"
            style={{ width: 200 }}
            value={settings.timezone}
            onChange={(e) => setSetting('timezone', e.target.value as Timezone)}
          >
            <option value="local">{t('settings.general.tzLocal')}</option>
            <option value="utc">{t('settings.general.tzUtc')}</option>
          </select>
        </SettingsRow>
      </div>

      <div className="rl-section-label" style={{ marginTop: 24 }}>{t('settings.general.startup')}</div>
      <div className="rl-card">
        <SettingsRow
          title={t('settings.general.autoConnect')}
          hint={t('settings.general.autoConnectHint')}
          bordered={false}
        >
          <Switch
            on={settings.autoConnectLast}
            onClick={() => setSetting('autoConnectLast', !settings.autoConnectLast)}
          />
        </SettingsRow>
      </div>
    </>
  )
}

function FontsPanel() {
  const { t } = useTranslation()
  const { settings, setSetting } = useSettings()

  const handleFontSizeChange = (delta: number) => {
    const next = Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, settings.fontSize + delta))
    setSetting('fontSize', next)
  }

  return (
    <>
      <div className="rl-section-label" style={{ marginTop: 0 }}>{t('settings.fonts.fontsTypography')}</div>
      <div className="rl-card">
        <SettingsRow title={t('settings.fonts.fontSize')} hint={t('settings.fonts.fontSizeHint')}>
          <button
            className="rl-btn rl-btn-outline rl-btn-icon rl-btn-sm"
            onClick={() => handleFontSizeChange(-1)}
            disabled={settings.fontSize <= MIN_FONT_SIZE}
          >
            −
          </button>
          <span
            className="font-mono-design rl-tabular text-[13px]"
            style={{ width: 40, textAlign: 'center' }}
          >
            {settings.fontSize}px
          </span>
          <button
            className="rl-btn rl-btn-outline rl-btn-icon rl-btn-sm"
            onClick={() => handleFontSizeChange(1)}
            disabled={settings.fontSize >= MAX_FONT_SIZE}
          >
            +
          </button>
        </SettingsRow>
        <SettingsRow title={t('settings.fonts.uiFont')} hint={t('settings.fonts.uiFontHint')}>
          <select
            className="rl-select"
            style={{ width: 200 }}
            value={settings.uiFont}
            onChange={(e) => setSetting('uiFont', e.target.value)}
          >
            <option value="system">{t('settings.fonts.systemDefault')}</option>
            <option value="Inter">Inter</option>
            <option value="PingFang SC">PingFang SC</option>
            <option value="Microsoft YaHei">Microsoft YaHei</option>
            <option value="Noto Sans SC">Noto Sans SC</option>
            <option value="HarmonyOS Sans">HarmonyOS Sans</option>
          </select>
        </SettingsRow>
        <SettingsRow title={t('settings.fonts.monospaceFont')} hint={t('settings.fonts.monospaceFontHint')} bordered={false}>
          <select
            className="rl-select"
            style={{ width: 200 }}
            value={settings.monospaceFont}
            onChange={(e) => setSetting('monospaceFont', e.target.value)}
          >
            <option value="JetBrains Mono">JetBrains Mono</option>
            <option value="Fira Code">Fira Code</option>
            <option value="Source Code Pro">Source Code Pro</option>
            <option value="Cascadia Code">Cascadia Code</option>
            <option value="Menlo">Menlo</option>
            <option value="Consolas">Consolas</option>
            <option value="system">{t('settings.fonts.systemDefault')}</option>
          </select>
        </SettingsRow>
      </div>

      <div className="rl-section-label" style={{ marginTop: 24 }}>{t('settings.fonts.timeDisplay')}</div>
      <div className="rl-card">
        <SettingsRow title={t('settings.fonts.timeFormat')} hint={t('settings.fonts.timeFormatHint')} bordered={false}>
          <select
            className="rl-select"
            style={{ width: 200 }}
            value={settings.timestampFormat}
            onChange={(e) => setSetting('timestampFormat', e.target.value as TimestampFormat)}
          >
            <option value="datetime">{t('settings.fonts.tsDatetime')}</option>
            <option value="ms">{t('settings.fonts.tsMs')}</option>
          </select>
        </SettingsRow>
      </div>

      <div className="rl-section-label" style={{ marginTop: 24 }}>{t('settings.fonts.preview')}</div>
      <div className="rl-card" style={{ padding: 16 }}>
        <div className="text-[13px]" style={{ fontSize: settings.fontSize }}>
          {t('settings.fonts.previewSample')}
        </div>
        <div
          className="font-mono-design rl-muted mt-2 text-[12px]"
          style={{ fontFamily: `"${settings.monospaceFont}", ui-monospace, monospace` }}
        >
          {'msgId: AC1A0F23000078A4F0B8C1234E2F0001'}
        </div>
      </div>
    </>
  )
}

function MessagePanel() {
  const { t } = useTranslation()
  const { settings, setSetting } = useSettings()
  const payloadKB = Math.round(settings.maxPayloadRenderBytes / 1024)
  return (
    <>
      <div className="rl-section-label" style={{ marginTop: 0 }}>{t('settings.message.defaults')}</div>
      <div className="rl-card">
        <SettingsRow title={t('settings.message.fetchLimit')} hint={t('settings.message.fetchLimitHint')}>
          <select
            className="rl-select"
            style={{ width: 140 }}
            value={settings.fetchLimit}
            onChange={(e) => setSetting('fetchLimit', Number(e.target.value) as FetchLimit)}
          >
            {FETCH_LIMITS.map((n) => (
              <option key={n} value={n}>{t('settings.message.fetchUnit', { count: n })}</option>
            ))}
          </select>
        </SettingsRow>
        <SettingsRow title={t('settings.message.autoFormatJson')} hint={t('settings.message.autoFormatJsonHint')}>
          <Switch
            on={settings.autoFormatJson}
            onClick={() => setSetting('autoFormatJson', !settings.autoFormatJson)}
          />
        </SettingsRow>
        <SettingsRow title={t('settings.message.payloadLimit')} hint={t('settings.message.payloadLimitHint')} bordered={false}>
          <input
            type="number"
            className="rl-input"
            style={{ width: 100 }}
            min={64}
            max={4096}
            value={payloadKB}
            onChange={(e) =>
              setSetting('maxPayloadRenderBytes', (Number(e.target.value) || 500) * 1024)
            }
            onBlur={() => {
              const kb = Math.max(64, Math.min(4096, Math.round(settings.maxPayloadRenderBytes / 1024)))
              setSetting('maxPayloadRenderBytes', kb * 1024)
            }}
          />
          <span className="rl-muted text-[12px]">KB</span>
        </SettingsRow>
      </div>

      <div className="rl-section-label" style={{ marginTop: 24 }}>{t('settings.message.alertThresholds')}</div>
      <div className="rl-card">
        <SettingsRow
          title={t('settings.message.lagAlert')}
          hint={t('settings.message.lagAlertHint')}
          bordered={false}
        >
          <input
            type="number"
            className="rl-input"
            style={{ width: 120 }}
            min={0}
            step={1000}
            value={settings.lagAlertThreshold}
            onChange={(e) => setSetting('lagAlertThreshold', Number(e.target.value) || 0)}
          />
          <span className="rl-muted text-[12px]">{t('settings.message.lagAlertUnit')}</span>
        </SettingsRow>
      </div>
    </>
  )
}

function ProxyPanel() {
  const { t } = useTranslation()
  const { settings, setSetting } = useSettings()
  return (
    <>
      <div className="rl-section-label" style={{ marginTop: 0 }}>{t('settings.proxy.timeout')}</div>
      <div className="rl-card">
        <SettingsRow title={t('settings.proxy.connect')} hint={t('settings.proxy.connectHint')}>
          <input
            type="number"
            className="rl-input"
            style={{ width: 100 }}
            min={1000}
            max={30000}
            step={1000}
            value={settings.connectTimeoutMs}
            onChange={(e) => setSetting('connectTimeoutMs', Number(e.target.value) || 3000)}
            onBlur={() =>
              setSetting(
                'connectTimeoutMs',
                Math.max(1000, Math.min(30000, settings.connectTimeoutMs))
              )
            }
          />
          <span className="rl-muted text-[12px]">ms</span>
        </SettingsRow>
        <SettingsRow title={t('settings.proxy.request')} hint={t('settings.proxy.requestHint')} bordered={false}>
          <input
            type="number"
            className="rl-input"
            style={{ width: 100 }}
            min={1000}
            max={60000}
            step={1000}
            value={settings.requestTimeoutMs}
            onChange={(e) => setSetting('requestTimeoutMs', Number(e.target.value) || 5000)}
            onBlur={() =>
              setSetting(
                'requestTimeoutMs',
                Math.max(1000, Math.min(60000, settings.requestTimeoutMs))
              )
            }
          />
          <span className="rl-muted text-[12px]">ms</span>
        </SettingsRow>
      </div>

      <div className="rl-section-label" style={{ marginTop: 24 }}>{t('settings.proxy.credentials')}</div>
      <div className="rl-card">
        <SettingsRow title={t('settings.proxy.ak')} hint={t('settings.proxy.akHint')}>
          <input
            type="text"
            className="rl-input font-mono-design"
            style={{ width: 240 }}
            value={settings.globalAccessKey}
            placeholder={t('settings.proxy.akPlaceholder')}
            onChange={(e) => setSetting('globalAccessKey', e.target.value)}
          />
        </SettingsRow>
        <SettingsRow title={t('settings.proxy.sk')} hint={t('settings.proxy.skHint')}>
          <input
            type="password"
            className="rl-input font-mono-design"
            style={{ width: 240 }}
            value={settings.globalSecretKey}
            placeholder={t('settings.proxy.akPlaceholder')}
            onChange={(e) => setSetting('globalSecretKey', e.target.value)}
          />
        </SettingsRow>
        <SettingsRow title={t('settings.proxy.skipTls')} hint={t('settings.proxy.skipTlsHint')} bordered={false}>
          <Switch
            on={settings.skipTlsVerify}
            onClick={() => setSetting('skipTlsVerify', !settings.skipTlsVerify)}
          />
        </SettingsRow>
      </div>

      <div className="rl-section-label" style={{ marginTop: 24 }}>{t('settings.proxy.httpProxy')}</div>
      <div className="rl-card">
        <SettingsRow title={t('settings.proxy.enable')} hint={t('settings.proxy.enableHint')}>
          <Switch
            on={settings.proxyEnabled}
            onClick={() => setSetting('proxyEnabled', !settings.proxyEnabled)}
          />
        </SettingsRow>
        {settings.proxyEnabled && (
          <>
            <SettingsRow title={t('settings.proxy.type')}>
              <select
                className="rl-select"
                style={{ width: 140 }}
                value={settings.proxyType}
                onChange={(e) => setSetting('proxyType', e.target.value as ProxyType)}
              >
                {PROXY_TYPE_OPTIONS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </SettingsRow>
            <SettingsRow title={t('settings.proxy.host')}>
              <input
                type="text"
                className="rl-input font-mono-design"
                style={{ width: 200 }}
                value={settings.proxyHost}
                placeholder="host"
                onChange={(e) => setSetting('proxyHost', e.target.value)}
              />
            </SettingsRow>
            <SettingsRow title={t('settings.proxy.port')} bordered={false}>
              <input
                type="text"
                className="rl-input font-mono-design"
                style={{ width: 120 }}
                value={settings.proxyPort}
                placeholder="port"
                onChange={(e) => setSetting('proxyPort', e.target.value.replace(/\D/g, ''))}
                onBlur={() => {
                  const port = Number(settings.proxyPort)
                  if (settings.proxyPort && (port < 1 || port > 65535)) {
                    setSetting('proxyPort', '')
                    toast.error(t('settings.proxy.portRangeError'))
                  }
                }}
              />
            </SettingsRow>
          </>
        )}
        {!settings.proxyEnabled && (
          <div
            className="rl-muted text-[12px]"
            style={{ padding: '12px 16px', borderTop: '1px solid hsl(var(--border))' }}
          >
            {t('settings.proxy.disabledNote')}
          </div>
        )}
      </div>
    </>
  )
}

function DataPanel({
  onExport,
  onImport,
  onClearCache,
}: {
  onExport: () => void
  onImport: () => void
  onClearCache: () => void
}) {
  const { t } = useTranslation()
  const copyPath = useCallback(async (p: string) => {
    try {
      await navigator.clipboard.writeText(p)
      toast.success(t('settings.data.copySuccess'))
    } catch {
      toast.error(t('settings.data.copyError'))
    }
  }, [t])

  return (
    <>
      <div className="rl-section-label" style={{ marginTop: 0 }}>{t('settings.data.storage')}</div>
      <div className="rl-card overflow-hidden">
        {DATA_PATHS.map((p, i) => (
          <div
            key={p.platform}
            className="flex items-center gap-3 cursor-pointer hover:bg-muted/40"
            style={{
              padding: '10px 16px',
              borderTop: i ? '1px solid hsl(var(--border))' : undefined,
            }}
            onClick={() => copyPath(p.path)}
          >
            <Folder size={14} className="rl-muted" />
            <span className="text-[13px] font-medium" style={{ width: 80 }}>{p.platform}</span>
            <code className="font-mono-design rl-muted min-w-0 flex-1 truncate text-[12px]">
              {p.path}
            </code>
            <span className="rl-muted text-[11px]">{t('settings.data.clickToCopy')}</span>
          </div>
        ))}
      </div>

      <div className="rl-section-label" style={{ marginTop: 24 }}>{t('settings.data.ioSection')}</div>
      <div className="rl-card">
        <SettingsRow title={t('settings.data.exportTitle')} hint={t('settings.data.exportHint')}>
          <button className="rl-btn rl-btn-outline rl-btn-sm" onClick={onExport}>
            <Download size={13} />{t('common.export')}
          </button>
        </SettingsRow>
        <SettingsRow title={t('settings.data.importTitle')} hint={t('settings.data.importHint')} bordered={false}>
          <button className="rl-btn rl-btn-outline rl-btn-sm" onClick={onImport}>
            <Upload size={13} />{t('common.selectFile')}
          </button>
        </SettingsRow>
      </div>

      <div className="rl-section-label" style={{ marginTop: 24 }}>{t('settings.data.cleanup')}</div>
      <div className="rl-card">
        <SettingsRow title={t('settings.data.clearCache')} hint={t('settings.data.clearCacheHint')} bordered={false}>
          <button
            className="rl-btn rl-btn-outline rl-btn-sm"
            style={{ color: 'hsl(var(--destructive))', borderColor: 'hsl(var(--destructive) / 0.5)' }}
            onClick={onClearCache}
          >
            <Trash2 size={13} />{t('settings.data.clearCache')}
          </button>
        </SettingsRow>
      </div>
    </>
  )
}

function AboutPanel({ onCheckUpdate, onResetSettings }: { onCheckUpdate: () => void; onResetSettings: () => void }) {
  const { t } = useTranslation()
  const openLink = (url: string) =>
    Browser.OpenURL(url).catch(() => window.open(url, '_blank', 'noopener,noreferrer'))

  return (
    <>
      <div className="rl-card" style={{ padding: 20 }}>
        <div className="flex items-start gap-4">
          <img src={logoUrl} alt="" className="h-14 w-14 shrink-0 rounded-xl object-contain" aria-hidden />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-[16px] font-semibold">{t('app.name')}</h2>
              <span className="rl-badge rl-badge-outline">v{APP_VERSION}</span>
            </div>
            <p className="rl-muted mt-1 text-[13px]" style={{ lineHeight: 1.6 }}>
              {t('settings.about.descriptionZh')}
            </p>
            <p className="rl-muted text-[12px]" style={{ lineHeight: 1.6 }}>
              {t('settings.about.descriptionEn')}
            </p>
          </div>
        </div>
      </div>

      <div className="rl-section-label" style={{ marginTop: 20 }}>{t('settings.about.resources')}</div>
      <div className="flex flex-wrap gap-2">
        <button className="rl-btn rl-btn-outline rl-btn-sm" onClick={onCheckUpdate}>
          <RefreshCw size={13} />{t('settings.about.checkUpdate')}
        </button>
        <button className="rl-btn rl-btn-outline rl-btn-sm" onClick={() => openLink(GITHUB_URL)}>
          <Github size={13} />GitHub
        </button>
        <button className="rl-btn rl-btn-outline rl-btn-sm" onClick={() => openLink(GITHUB_ISSUES_URL)}>
          <ExternalLink size={13} />{t('settings.about.openIssue')}
        </button>
      </div>

      <div className="rl-section-label" style={{ marginTop: 20 }}>{t('settings.about.preferences')}</div>
      <div className="rl-card">
        <SettingsRow title={t('settings.about.resetTitle')} hint={t('settings.about.resetHint')} bordered={false}>
          <button
            className="rl-btn rl-btn-outline rl-btn-sm"
            style={{ color: 'hsl(var(--destructive))', borderColor: 'hsl(var(--destructive) / 0.5)' }}
            onClick={onResetSettings}
          >
            <RotateCcw size={13} />{t('settings.about.reset')}
          </button>
        </SettingsRow>
      </div>
    </>
  )
}

// =================== Main Screen ===================

export function SettingsScreen() {
  const { t } = useTranslation()
  const [activeSection, setActiveSection] = useState<SectionId>('appearance')
  const { resetAllSettings, loading } = useSettings()
  const [confirmAction, setConfirmAction] = useState<{
    title: string
    description: string
    onConfirm: () => void
  } | null>(null)

  const handleExport = useCallback(async () => {
    try {
      const jsonStr = await exportAllConfig()
      const blob = new Blob([jsonStr], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `rocket-leaf-config-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success(t('settings.data.exportSuccess'))
    } catch {
      toast.error(t('settings.data.exportError'))
    }
  }, [t])

  const handleImport = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      try {
        const text = await file.text()
        await importAllConfig(text)
        toast.success(t('settings.data.importSuccess'))
      } catch {
        toast.error(t('settings.data.importError'))
      }
    }
    input.click()
  }, [t])

  const doClearCache = useCallback(async () => {
    try {
      await clearCacheApi()
      toast.success(t('settings.data.clearCacheSuccess'))
    } catch {
      toast.error(t('settings.data.clearCacheError'))
    }
  }, [t])

  const handleClearCache = useCallback(() => {
    setConfirmAction({
      title: t('settings.data.clearCacheConfirmTitle'),
      description: t('settings.data.clearCacheConfirmDesc'),
      onConfirm: () => {
        setConfirmAction(null)
        void doClearCache()
      },
    })
  }, [doClearCache, t])

  const handleResetSettings = useCallback(() => {
    setConfirmAction({
      title: t('settings.about.resetConfirmTitle'),
      description: t('settings.about.resetConfirmDesc'),
      onConfirm: async () => {
        setConfirmAction(null)
        try {
          await resetAllSettings()
          toast.success(t('settings.about.resetSuccess'))
        } catch {
          toast.error(t('settings.about.resetError'))
        }
      },
    })
  }, [resetAllSettings, t])

  const handleCheckUpdate = useCallback(() => {
    Browser.OpenURL(GITHUB_RELEASES_URL).catch(() =>
      window.open(GITHUB_RELEASES_URL, '_blank', 'noopener,noreferrer')
    )
  }, [])

  const currentSection = SECTIONS.find((s) => s.id === activeSection) ?? SECTIONS[0]!

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHeader title={t('settings.title')} />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <aside
          className="rl-subtle-bg"
          style={{
            width: 220,
            borderRight: '1px solid hsl(var(--border))',
            padding: '12px 0',
            flexShrink: 0,
          }}
        >
          {SECTIONS.map((s) => {
            const active = s.id === activeSection
            return (
              <div
                key={s.id}
                className="flex items-center gap-2"
                onClick={() => setActiveSection(s.id)}
                style={{
                  padding: '8px 16px',
                  fontSize: 13,
                  color: active ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
                  background: active ? 'hsl(var(--accent))' : 'transparent',
                  cursor: 'pointer',
                  borderLeft: active ? '2px solid hsl(var(--foreground))' : '2px solid transparent',
                }}
              >
                <s.icon size={14} />{t(`settings.section.${s.id}.label`)}
              </div>
            )
          })}
        </aside>

        <div className="scroll-thin min-w-0 flex-1 overflow-auto p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <div className="text-[16px] font-semibold">
                {t(`settings.section.${currentSection.id}.label`)}
              </div>
              <div className="rl-muted mt-1 text-[12px]">
                {t(`settings.section.${currentSection.id}.subtitle`)}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="rl-muted text-[12px]">
                {loading ? t('settings.loading') : t('settings.autoSaved')}
              </span>
            </div>
          </div>

          <fieldset
            disabled={loading}
            aria-busy={loading}
            style={{ border: 'none', padding: 0, margin: 0, opacity: loading ? 0.6 : 1 }}
          >
            <div style={{ maxWidth: 760 }}>
              {activeSection === 'appearance' && <AppearancePanel />}
              {activeSection === 'general' && <GeneralPanel />}
              {activeSection === 'fonts' && <FontsPanel />}
              {activeSection === 'message' && <MessagePanel />}
              {activeSection === 'proxy' && <ProxyPanel />}
              {activeSection === 'data' && (
                <DataPanel
                  onExport={handleExport}
                  onImport={handleImport}
                  onClearCache={handleClearCache}
                />
              )}
              {activeSection === 'about' && (
                <AboutPanel onCheckUpdate={handleCheckUpdate} onResetSettings={handleResetSettings} />
              )}
            </div>
          </fieldset>
        </div>
      </div>

      <ConfirmDialog
        open={confirmAction !== null}
        title={confirmAction?.title ?? ''}
        description={confirmAction?.description ?? ''}
        confirmText={t('common.confirm')}
        cancelText={t('common.cancel')}
        variant="destructive"
        onConfirm={confirmAction?.onConfirm ?? (() => { })}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  )
}
