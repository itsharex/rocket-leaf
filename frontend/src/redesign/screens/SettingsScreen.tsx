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
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import logoUrl from '@/assets/logo.png'
import { exportAllConfig, importAllConfig, clearCache as clearCacheApi } from '@/api/settings'

const APP_VERSION = __APP_VERSION__
const GITHUB_URL = 'https://github.com/amigoer/rocket-leaf'
const GITHUB_ISSUES_URL = 'https://github.com/amigoer/rocket-leaf/issues'
const GITHUB_RELEASES_URL = 'https://github.com/amigoer/rocket-leaf/releases/latest'

type SectionId = 'appearance' | 'general' | 'fonts' | 'message' | 'proxy' | 'data' | 'about'

const SECTIONS: { id: SectionId; label: string; icon: LucideIcon; subtitle: string }[] = [
  { id: 'appearance', label: '外观', icon: Sun, subtitle: '主题、强调色与界面密度' },
  { id: 'general', label: '通用', icon: SettingsIcon, subtitle: '语言、连接与默认行为' },
  { id: 'fonts', label: '字体与显示', icon: PanelLeft, subtitle: '字号、字体与时间格式' },
  { id: 'message', label: '消息查询', icon: Search, subtitle: '默认查询与告警参数' },
  { id: 'proxy', label: '代理与网络', icon: Globe, subtitle: '代理、超时与默认凭证' },
  { id: 'data', label: '数据与备份', icon: Database, subtitle: '导入导出、数据目录与缓存' },
  { id: 'about', label: '关于', icon: Info, subtitle: '版本与项目信息' },
]

const ACCENT_COLORS = [
  { c: '#0a0a0a', name: '默认' },
  { c: '#2563eb', name: '蓝' },
  { c: '#16a34a', name: '绿' },
  { c: '#ea580c', name: '橙' },
  { c: '#dc2626', name: '红' },
  { c: '#9333ea', name: '紫' },
  { c: '#0891b2', name: '青' },
]

const THEMES: { name: string; desc: string; mode: ThemeMode }[] = [
  { name: '浅色', desc: '默认', mode: 'light' },
  { name: '深色', desc: '护眼', mode: 'dark' },
  { name: '跟随系统', desc: '自动切换', mode: 'system' },
]

const UI_FONT_OPTIONS = [
  { value: 'system', label: '系统默认' },
  { value: 'Inter', label: 'Inter' },
  { value: 'PingFang SC', label: 'PingFang SC' },
  { value: 'Microsoft YaHei', label: '微软雅黑' },
  { value: 'Noto Sans SC', label: 'Noto Sans SC' },
  { value: 'HarmonyOS Sans', label: 'HarmonyOS Sans' },
]

const MONOSPACE_FONT_OPTIONS = [
  { value: 'JetBrains Mono', label: 'JetBrains Mono' },
  { value: 'Fira Code', label: 'Fira Code' },
  { value: 'Source Code Pro', label: 'Source Code Pro' },
  { value: 'Cascadia Code', label: 'Cascadia Code' },
  { value: 'Menlo', label: 'Menlo' },
  { value: 'Consolas', label: 'Consolas' },
  { value: 'system', label: '系统默认' },
]

const LANGUAGE_OPTIONS: { value: Language; label: string }[] = [
  { value: 'zh', label: '简体中文' },
  { value: 'en', label: 'English' },
]

const FETCH_LIMIT_OPTIONS: { value: FetchLimit; label: string }[] = [
  { value: 32, label: '32 条' },
  { value: 64, label: '64 条' },
  { value: 128, label: '128 条' },
]

const PROXY_TYPE_OPTIONS: { value: ProxyType; label: string }[] = [
  { value: 'http', label: 'HTTP' },
  { value: 'socks5', label: 'SOCKS5' },
]

const TIMEZONE_OPTIONS: { value: Timezone; label: string }[] = [
  { value: 'local', label: '本地时间' },
  { value: 'utc', label: 'UTC' },
]

const TIMESTAMP_FORMAT_OPTIONS: { value: TimestampFormat; label: string }[] = [
  { value: 'datetime', label: 'YYYY-MM-DD HH:mm:ss' },
  { value: 'ms', label: '毫秒时间戳' },
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
  const { settings, setSetting } = useSettings()
  return (
    <>
      <div className="rl-section-label" style={{ marginTop: 0 }}>主题</div>
      <div className="grid gap-2.5" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {THEMES.map((t) => {
          const active = settings.theme === t.mode
          const palette = t.mode === 'dark' ? DARK_P : LIGHT_P
          return (
            <div
              key={t.name}
              className="rl-card"
              onClick={() => setSetting('theme', t.mode)}
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
                    t.mode === 'system'
                      ? 'linear-gradient(105deg, #ffffff 0%, #ffffff 49%, #262626 49%, #0a0a0a 100%)'
                      : palette.bg,
                  borderBottom: '1px solid hsl(var(--border))',
                }}
              >
                {t.mode === 'system' ? (
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
                  <div className="text-[13px] font-medium" style={{ lineHeight: 1.2 }}>{t.name}</div>
                  <div className="rl-muted text-[12px]" style={{ marginTop: 2 }}>{t.desc}</div>
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

      <div className="rl-section-label" style={{ marginTop: 24 }}>强调色</div>
      <div className="rl-card" style={{ padding: 16 }}>
        <div className="flex flex-wrap items-center gap-2">
          {ACCENT_COLORS.map((c, i) => {
            const active = i === 0
            return (
              <div key={c.name} className="flex flex-col items-center gap-1 cursor-pointer">
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 999,
                    background: c.c,
                    border: active ? '2px solid hsl(var(--foreground))' : '2px solid transparent',
                    outline: active ? '2px solid hsl(var(--background))' : 'none',
                    outlineOffset: -4,
                  }}
                />
                <span className="rl-muted text-[12px]">{c.name}</span>
              </div>
            )
          })}
        </div>
        <div className="rl-muted mt-3 text-[12px]">强调色仅作展示，未来版本接入主色调。</div>
      </div>

      <div className="rl-section-label" style={{ marginTop: 24 }}>动效与可访问性</div>
      <div className="rl-card">
        <SettingsRow title="界面过渡动画" hint="页面切换、面板展开等过渡效果">
          <Switch on={true} onClick={() => toast.message('动效设置保留为开启')} />
        </SettingsRow>
        <SettingsRow title="减少透明效果" hint="关闭背景模糊与半透明面板">
          <Switch on={false} onClick={() => toast.message('当前未启用透明效果')} />
        </SettingsRow>
        <SettingsRow title="高对比度" hint="增强边框与文本对比度" bordered={false}>
          <Switch on={false} onClick={() => toast.message('未来版本将提供高对比度主题')} />
        </SettingsRow>
      </div>
    </>
  )
}

function GeneralPanel() {
  const { settings, setSetting } = useSettings()
  return (
    <>
      <div className="rl-section-label" style={{ marginTop: 0 }}>语言与区域</div>
      <div className="rl-card">
        <SettingsRow title="界面语言" hint="切换后立即生效">
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
        <SettingsRow title="时区" hint="影响列表与详情中的时间显示" bordered={false}>
          <select
            className="rl-select"
            style={{ width: 200 }}
            value={settings.timezone}
            onChange={(e) => setSetting('timezone', e.target.value as Timezone)}
          >
            {TIMEZONE_OPTIONS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </SettingsRow>
      </div>

      <div className="rl-section-label" style={{ marginTop: 24 }}>启动行为</div>
      <div className="rl-card">
        <SettingsRow
          title="启动时自动连接上次集群"
          hint="启动应用后自动连接上次使用的集群"
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
  const { settings, setSetting } = useSettings()

  const handleFontSizeChange = (delta: number) => {
    const next = Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, settings.fontSize + delta))
    setSetting('fontSize', next)
  }

  return (
    <>
      <div className="rl-section-label" style={{ marginTop: 0 }}>字体与排版</div>
      <div className="rl-card">
        <SettingsRow title="界面字号" hint="影响整个应用的基础字号">
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
        <SettingsRow title="界面字体" hint="默认使用系统 UI 字体">
          <select
            className="rl-select"
            style={{ width: 200 }}
            value={settings.uiFont}
            onChange={(e) => setSetting('uiFont', e.target.value)}
          >
            {UI_FONT_OPTIONS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </SettingsRow>
        <SettingsRow title="等宽字体" hint="用于消息体、ID、JSON 显示" bordered={false}>
          <select
            className="rl-select"
            style={{ width: 200 }}
            value={settings.monospaceFont}
            onChange={(e) => setSetting('monospaceFont', e.target.value)}
          >
            {MONOSPACE_FONT_OPTIONS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </SettingsRow>
      </div>

      <div className="rl-section-label" style={{ marginTop: 24 }}>时间显示</div>
      <div className="rl-card">
        <SettingsRow title="时间格式" hint="影响列表与详情中的时间显示" bordered={false}>
          <select
            className="rl-select"
            style={{ width: 200 }}
            value={settings.timestampFormat}
            onChange={(e) => setSetting('timestampFormat', e.target.value as TimestampFormat)}
          >
            {TIMESTAMP_FORMAT_OPTIONS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </SettingsRow>
      </div>

      <div className="rl-section-label" style={{ marginTop: 24 }}>预览</div>
      <div className="rl-card" style={{ padding: 16 }}>
        <div className="text-[13px]" style={{ fontSize: settings.fontSize }}>
          示例文本：Rocket-Leaf 轻量级 RocketMQ 管理客户端 ABCDabcd 1234
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
  const { settings, setSetting } = useSettings()
  const payloadKB = Math.round(settings.maxPayloadRenderBytes / 1024)
  return (
    <>
      <div className="rl-section-label" style={{ marginTop: 0 }}>消息查询默认值</div>
      <div className="rl-card">
        <SettingsRow title="单页拉取数量" hint="每次查询 Topic、消费组的数量上限">
          <select
            className="rl-select"
            style={{ width: 140 }}
            value={settings.fetchLimit}
            onChange={(e) => setSetting('fetchLimit', Number(e.target.value) as FetchLimit)}
          >
            {FETCH_LIMIT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </SettingsRow>
        <SettingsRow title="JSON 自动格式化" hint="查看消息时自动美化 JSON 内容">
          <Switch
            on={settings.autoFormatJson}
            onClick={() => setSetting('autoFormatJson', !settings.autoFormatJson)}
          />
        </SettingsRow>
        <SettingsRow title="消息截断阈值" hint="超过此大小的消息内容将被截断显示" bordered={false}>
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

      <div className="rl-section-label" style={{ marginTop: 24 }}>告警阈值</div>
      <div className="rl-card">
        <SettingsRow
          title="消费积压告警"
          hint="当消费组堆积消息超过此值时显示告警，设为 0 关闭"
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
          <span className="rl-muted text-[12px]">条</span>
        </SettingsRow>
      </div>
    </>
  )
}

function ProxyPanel() {
  const { settings, setSetting } = useSettings()
  return (
    <>
      <div className="rl-section-label" style={{ marginTop: 0 }}>连接超时</div>
      <div className="rl-card">
        <SettingsRow title="连接超时" hint="建立 NameServer 连接的最大等待时间">
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
        <SettingsRow title="请求超时" hint="查询 Topic、消费组等操作的超时时间" bordered={false}>
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

      <div className="rl-section-label" style={{ marginTop: 24 }}>默认凭证</div>
      <div className="rl-card">
        <SettingsRow title="默认 AccessKey" hint="新建连接时自动填充">
          <input
            type="text"
            className="rl-input font-mono-design"
            style={{ width: 240 }}
            value={settings.globalAccessKey}
            placeholder="新建连接时自动填充"
            onChange={(e) => setSetting('globalAccessKey', e.target.value)}
          />
        </SettingsRow>
        <SettingsRow title="默认 SecretKey" hint="加密存储于本地">
          <input
            type="password"
            className="rl-input font-mono-design"
            style={{ width: 240 }}
            value={settings.globalSecretKey}
            placeholder="新建连接时自动填充"
            onChange={(e) => setSetting('globalSecretKey', e.target.value)}
          />
        </SettingsRow>
        <SettingsRow title="跳过 TLS 校验" hint="跳过服务端证书验证，仅限测试环境" bordered={false}>
          <Switch
            on={settings.skipTlsVerify}
            onClick={() => setSetting('skipTlsVerify', !settings.skipTlsVerify)}
          />
        </SettingsRow>
      </div>

      <div className="rl-section-label" style={{ marginTop: 24 }}>HTTP 代理</div>
      <div className="rl-card">
        <SettingsRow title="启用代理" hint="发起连接时使用代理服务器">
          <Switch
            on={settings.proxyEnabled}
            onClick={() => setSetting('proxyEnabled', !settings.proxyEnabled)}
          />
        </SettingsRow>
        {settings.proxyEnabled && (
          <>
            <SettingsRow title="代理类型">
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
            <SettingsRow title="代理地址">
              <input
                type="text"
                className="rl-input font-mono-design"
                style={{ width: 200 }}
                value={settings.proxyHost}
                placeholder="host"
                onChange={(e) => setSetting('proxyHost', e.target.value)}
              />
            </SettingsRow>
            <SettingsRow title="代理端口" bordered={false}>
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
                    toast.error('端口范围 1-65535')
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
            未启用代理，连接将直连 NameServer。
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
  const copyPath = useCallback(async (p: string) => {
    try {
      await navigator.clipboard.writeText(p)
      toast.success('已复制路径')
    } catch {
      toast.error('复制失败')
    }
  }, [])

  return (
    <>
      <div className="rl-section-label" style={{ marginTop: 0 }}>数据存储位置</div>
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
            <span className="rl-muted text-[11px]">点击复制</span>
          </div>
        ))}
      </div>

      <div className="rl-section-label" style={{ marginTop: 24 }}>导入与导出</div>
      <div className="rl-card">
        <SettingsRow title="导出全部配置" hint="导出连接、ACL、应用设置为 JSON 文件">
          <button className="rl-btn rl-btn-outline rl-btn-sm" onClick={onExport}>
            <Download size={13} />导出
          </button>
        </SettingsRow>
        <SettingsRow title="导入配置" hint="从 JSON 文件恢复，重启应用后生效" bordered={false}>
          <button className="rl-btn rl-btn-outline rl-btn-sm" onClick={onImport}>
            <Upload size={13} />选择文件
          </button>
        </SettingsRow>
      </div>

      <div className="rl-section-label" style={{ marginTop: 24 }}>清理</div>
      <div className="rl-card">
        <SettingsRow title="清理缓存" hint="清除本地的查询、消息缓存数据" bordered={false}>
          <button
            className="rl-btn rl-btn-outline rl-btn-sm"
            style={{ color: 'hsl(var(--destructive))', borderColor: 'hsl(var(--destructive) / 0.5)' }}
            onClick={onClearCache}
          >
            <Trash2 size={13} />清理缓存
          </button>
        </SettingsRow>
      </div>
    </>
  )
}

function AboutPanel({ onCheckUpdate, onResetSettings }: { onCheckUpdate: () => void; onResetSettings: () => void }) {
  const openLink = (url: string) =>
    Browser.OpenURL(url).catch(() => window.open(url, '_blank', 'noopener,noreferrer'))

  return (
    <>
      <div className="rl-card" style={{ padding: 20 }}>
        <div className="flex items-start gap-4">
          <img src={logoUrl} alt="" className="h-14 w-14 shrink-0 rounded-xl object-contain" aria-hidden />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-[16px] font-semibold">Rocket-Leaf</h2>
              <span className="rl-badge rl-badge-outline">v{APP_VERSION}</span>
            </div>
            <p className="rl-muted mt-1 text-[13px]" style={{ lineHeight: 1.6 }}>
              一款基于 Wails 构建的轻量级、跨平台 RocketMQ 管理客户端。
            </p>
            <p className="rl-muted text-[12px]" style={{ lineHeight: 1.6 }}>
              A lightweight, cross-platform RocketMQ client built with Go and Wails.
            </p>
          </div>
        </div>
      </div>

      <div className="rl-section-label" style={{ marginTop: 20 }}>资源</div>
      <div className="flex flex-wrap gap-2">
        <button className="rl-btn rl-btn-outline rl-btn-sm" onClick={onCheckUpdate}>
          <RefreshCw size={13} />检查更新
        </button>
        <button className="rl-btn rl-btn-outline rl-btn-sm" onClick={() => openLink(GITHUB_URL)}>
          <Github size={13} />GitHub
        </button>
        <button className="rl-btn rl-btn-outline rl-btn-sm" onClick={() => openLink(GITHUB_ISSUES_URL)}>
          <ExternalLink size={13} />提交 Issue
        </button>
      </div>

      <div className="rl-section-label" style={{ marginTop: 20 }}>偏好设置</div>
      <div className="rl-card">
        <SettingsRow title="恢复默认设置" hint="将所有设置恢复为初始值（不影响连接）" bordered={false}>
          <button
            className="rl-btn rl-btn-outline rl-btn-sm"
            style={{ color: 'hsl(var(--destructive))', borderColor: 'hsl(var(--destructive) / 0.5)' }}
            onClick={onResetSettings}
          >
            <RotateCcw size={13} />恢复默认
          </button>
        </SettingsRow>
      </div>
    </>
  )
}

// =================== Main Screen ===================

export function SettingsScreen() {
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
      toast.success('配置已导出')
    } catch {
      toast.error('导出配置失败')
    }
  }, [])

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
        toast.success('配置已导入，重启应用后生效')
      } catch {
        toast.error('导入配置失败')
      }
    }
    input.click()
  }, [])

  const doClearCache = useCallback(async () => {
    try {
      await clearCacheApi()
      toast.success('缓存已清理')
    } catch {
      toast.error('清理缓存失败')
    }
  }, [])

  const handleClearCache = useCallback(() => {
    setConfirmAction({
      title: '清理缓存',
      description: '确定要清理所有缓存数据吗？此操作不可撤销。',
      onConfirm: () => {
        setConfirmAction(null)
        void doClearCache()
      },
    })
  }, [doClearCache])

  const handleResetSettings = useCallback(() => {
    setConfirmAction({
      title: '恢复默认设置',
      description: '确定要将所有设置恢复为默认值吗？当前的自定义设置将全部丢失。',
      onConfirm: async () => {
        setConfirmAction(null)
        try {
          await resetAllSettings()
          toast.success('已恢复默认设置')
        } catch {
          toast.error('恢复默认设置失败')
        }
      },
    })
  }, [resetAllSettings])

  const handleCheckUpdate = useCallback(() => {
    Browser.OpenURL(GITHUB_RELEASES_URL).catch(() =>
      window.open(GITHUB_RELEASES_URL, '_blank', 'noopener,noreferrer')
    )
  }, [])

  const currentSection = SECTIONS.find((s) => s.id === activeSection) ?? SECTIONS[0]!

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHeader title="设置" />
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
                <s.icon size={14} />{s.label}
              </div>
            )
          })}
        </aside>

        <div className="scroll-thin min-w-0 flex-1 overflow-auto p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <div className="text-[16px] font-semibold">{currentSection.label}</div>
              <div className="rl-muted mt-1 text-[12px]">{currentSection.subtitle}</div>
            </div>
            <div className="flex items-center gap-2">
              <span className="rl-muted text-[12px]">
                {loading ? '加载中…' : '所有更改自动保存'}
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
        confirmText="确认"
        cancelText="取消"
        variant="destructive"
        onConfirm={confirmAction?.onConfirm ?? (() => { })}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  )
}
