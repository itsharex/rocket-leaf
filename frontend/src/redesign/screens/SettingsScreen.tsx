import { useState } from 'react'
import {
  Sun,
  Settings as SettingsIcon,
  PanelLeft,
  Search,
  Globe,
  Database,
  AlertCircle,
  Folder,
  Check,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { PageHeader } from '../shell'

const SECTIONS: { k: string; icon: LucideIcon }[] = [
  { k: '外观', icon: Sun },
  { k: '通用', icon: SettingsIcon },
  { k: '字体与显示', icon: PanelLeft },
  { k: '消息查询', icon: Search },
  { k: '代理', icon: Globe },
  { k: '数据与备份', icon: Database },
  { k: '关于', icon: AlertCircle },
]

const ACCENT_COLORS = [
  { c: '#0a0a0a', name: '默认', active: true },
  { c: '#2563eb', name: '蓝' },
  { c: '#16a34a', name: '绿' },
  { c: '#ea580c', name: '橙' },
  { c: '#dc2626', name: '红' },
  { c: '#9333ea', name: '紫' },
  { c: '#0891b2', name: '青' },
]

const THEMES = [
  { name: '浅色', desc: '默认', mode: 'light' as const, active: true },
  { name: '深色', desc: '护眼', mode: 'dark' as const },
  { name: '跟随系统', desc: '自动切换', mode: 'auto' as const },
]

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

export function SettingsScreen() {
  const [activeSection, setActiveSection] = useState('外观')

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHeader title="设置" />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <aside
          style={{
            width: 200,
            borderRight: '1px solid hsl(var(--border))',
            padding: '12px 0',
            background: 'hsl(0 0% 99%)',
          }}
        >
          {SECTIONS.map((s) => {
            const active = s.k === activeSection
            return (
              <div
                key={s.k}
                className="flex items-center gap-2"
                onClick={() => setActiveSection(s.k)}
                style={{
                  padding: '8px 16px',
                  fontSize: 13,
                  color: active ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
                  background: active ? 'hsl(var(--accent))' : 'transparent',
                  cursor: 'pointer',
                  borderLeft: active ? '2px solid hsl(var(--foreground))' : '2px solid transparent',
                }}
              >
                <s.icon size={14} />{s.k}
              </div>
            )
          })}
        </aside>

        <div className="scroll-thin min-w-0 flex-1 overflow-auto p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <div className="text-[16px] font-semibold">外观</div>
              <div className="rl-muted mt-1 text-[12px]">主题、字体与界面密度</div>
            </div>
            <div className="flex items-center gap-2">
              <button className="rl-btn rl-btn-ghost rl-btn-sm">恢复默认</button>
              <span className="rl-muted text-[12px]">所有更改自动保存</span>
            </div>
          </div>

          <div className="grid items-start gap-5" style={{ gridTemplateColumns: '1fr 320px' }}>
            <div>
              <div className="rl-section-label" style={{ marginTop: 0 }}>主题</div>
              <div className="grid gap-2.5" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                {THEMES.map((t) => {
                  const palette = t.mode === 'dark' ? DARK_P : LIGHT_P
                  return (
                    <div
                      key={t.name}
                      className="rl-card"
                      style={{
                        padding: 0,
                        overflow: 'hidden',
                        borderColor: t.active ? 'hsl(var(--foreground))' : 'hsl(var(--border))',
                        boxShadow: t.active ? '0 0 0 1px hsl(var(--foreground))' : undefined,
                        cursor: 'pointer',
                      }}
                    >
                      <div
                        style={{
                          height: 84,
                          position: 'relative',
                          background:
                            t.mode === 'auto'
                              ? 'linear-gradient(105deg, #ffffff 0%, #ffffff 49%, #262626 49%, #0a0a0a 100%)'
                              : palette.bg,
                          borderBottom: '1px solid hsl(var(--border))',
                        }}
                      >
                        {t.mode === 'auto' ? (
                          <div
                            style={{
                              position: 'absolute',
                              inset: 0,
                              display: 'grid',
                              gridTemplateColumns: '1fr 1fr',
                            }}
                          >
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
                            border: '1px solid ' + (t.active ? 'hsl(var(--foreground))' : 'hsl(var(--border))'),
                            background: t.active ? 'hsl(var(--foreground))' : 'transparent',
                            display: 'grid',
                            placeItems: 'center',
                            color: 'hsl(var(--background))',
                          }}
                        >
                          {t.active && <Check size={10} strokeWidth={3} />}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="rl-section-label" style={{ marginTop: 24 }}>强调色</div>
              <div className="rl-card" style={{ padding: 16 }}>
                <div className="flex flex-wrap items-center gap-2">
                  {ACCENT_COLORS.map((c) => (
                    <div key={c.name} className="flex flex-col items-center gap-1 cursor-pointer">
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 999,
                          background: c.c,
                          border: c.active ? '2px solid hsl(var(--foreground))' : '2px solid transparent',
                          outline: c.active ? '2px solid hsl(var(--background))' : 'none',
                          outlineOffset: -4,
                        }}
                      />
                      <span className="rl-muted text-[12px]">{c.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rl-section-label" style={{ marginTop: 24 }}>字体与排版</div>
              <div className="rl-card">
                <div
                  className="flex items-center justify-between p-4"
                  style={{ borderBottom: '1px solid hsl(var(--border))' }}
                >
                  <div>
                    <div className="text-[13px] font-medium">界面字号</div>
                    <div className="rl-muted mt-1 text-[12px]">影响整个应用的基础字号</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="rl-btn rl-btn-outline rl-btn-icon rl-btn-sm">−</button>
                    <span className="font-mono-design rl-tabular text-[13px]" style={{ width: 40, textAlign: 'center' }}>14px</span>
                    <button className="rl-btn rl-btn-outline rl-btn-icon rl-btn-sm">+</button>
                  </div>
                </div>
                <div
                  className="flex items-center justify-between p-4"
                  style={{ borderBottom: '1px solid hsl(var(--border))' }}
                >
                  <div>
                    <div className="text-[13px] font-medium">界面字体</div>
                    <div className="rl-muted mt-1 text-[12px]">默认使用系统 UI 字体</div>
                  </div>
                  <select className="rl-select" style={{ width: 200 }}>
                    <option>系统默认</option>
                    <option>Inter</option>
                    <option>HarmonyOS Sans</option>
                    <option>PingFang SC</option>
                  </select>
                </div>
                <div
                  className="flex items-center justify-between p-4"
                  style={{ borderBottom: '1px solid hsl(var(--border))' }}
                >
                  <div>
                    <div className="text-[13px] font-medium">等宽字体</div>
                    <div className="rl-muted mt-1 text-[12px]">用于消息体、ID、JSON 显示</div>
                  </div>
                  <select className="rl-select" style={{ width: 200 }}>
                    <option>JetBrains Mono</option>
                    <option>SF Mono</option>
                    <option>Cascadia Code</option>
                    <option>系统默认</option>
                  </select>
                </div>
                <div className="flex items-center justify-between p-4">
                  <div>
                    <div className="text-[13px] font-medium">界面密度</div>
                    <div className="rl-muted mt-1 text-[12px]">紧凑、舒适或宽松</div>
                  </div>
                  <div
                    style={{
                      display: 'inline-flex',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 6,
                      overflow: 'hidden',
                    }}
                  >
                    {['紧凑', '舒适', '宽松'].map((k, i) => (
                      <button
                        key={k}
                        className="rl-btn rl-btn-ghost rl-btn-sm"
                        style={{
                          borderRadius: 0,
                          height: 30,
                          background: i === 1 ? 'hsl(var(--accent))' : 'transparent',
                          fontWeight: i === 1 ? 500 : 400,
                        }}
                      >
                        {k}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rl-section-label" style={{ marginTop: 24 }}>语言与区域</div>
              <div className="rl-card">
                <div
                  className="flex items-center justify-between p-4"
                  style={{ borderBottom: '1px solid hsl(var(--border))' }}
                >
                  <div>
                    <div className="text-[13px] font-medium">界面语言</div>
                    <div className="rl-muted mt-1 text-[12px]">应用启动后生效</div>
                  </div>
                  <select className="rl-select" style={{ width: 200 }}>
                    <option>简体中文</option>
                    <option>English</option>
                    <option>跟随系统</option>
                  </select>
                </div>
                <div className="flex items-center justify-between p-4">
                  <div>
                    <div className="text-[13px] font-medium">时间格式</div>
                    <div className="rl-muted mt-1 text-[12px]">影响列表与详情中的时间显示</div>
                  </div>
                  <select className="rl-select" style={{ width: 200 }}>
                    <option>2024-10-21 14:32:08</option>
                    <option>10/21/2024 2:32 PM</option>
                    <option>相对时间（5 分钟前）</option>
                  </select>
                </div>
              </div>

              <div className="rl-section-label" style={{ marginTop: 24 }}>动效与可访问性</div>
              <div className="rl-card">
                <div
                  className="flex items-center justify-between p-4"
                  style={{ borderBottom: '1px solid hsl(var(--border))' }}
                >
                  <div>
                    <div className="text-[13px] font-medium">界面过渡动画</div>
                    <div className="rl-muted mt-1 text-[12px]">页面切换、面板展开等过渡效果</div>
                  </div>
                  <div className="rl-switch on" />
                </div>
                <div
                  className="flex items-center justify-between p-4"
                  style={{ borderBottom: '1px solid hsl(var(--border))' }}
                >
                  <div>
                    <div className="text-[13px] font-medium">减少透明效果</div>
                    <div className="rl-muted mt-1 text-[12px]">关闭背景模糊与半透明面板</div>
                  </div>
                  <div className="rl-switch" />
                </div>
                <div className="flex items-center justify-between p-4">
                  <div>
                    <div className="text-[13px] font-medium">高对比度</div>
                    <div className="rl-muted mt-1 text-[12px]">增强边框与文本对比度</div>
                  </div>
                  <div className="rl-switch" />
                </div>
              </div>
            </div>

            {/* Right: live preview */}
            <div style={{ position: 'sticky', top: 0 }}>
              <div className="rl-section-label" style={{ marginTop: 0 }}>预览</div>
              <div className="rl-card overflow-hidden">
                <div
                  style={{
                    background: 'hsl(0 0% 99%)',
                    padding: '8px 12px',
                    borderBottom: '1px solid hsl(var(--border))',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <div style={{ width: 8, height: 8, borderRadius: 999, background: '#ef4444' }} />
                  <div style={{ width: 8, height: 8, borderRadius: 999, background: '#f59e0b' }} />
                  <div style={{ width: 8, height: 8, borderRadius: 999, background: '#10b981' }} />
                  <span className="rl-muted text-[12px]" style={{ marginLeft: 8 }}>预览</span>
                </div>
                <div style={{ padding: 14 }}>
                  <div className="rl-muted text-[12px]">订单主题</div>
                  <div className="mt-1 font-medium">ORDER_PAYMENT_TOPIC</div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="rl-badge rl-badge-success">活跃</span>
                    <span className="rl-badge rl-badge-outline">PUB|SUB</span>
                  </div>
                  <div className="grid mt-3 gap-2" style={{ gridTemplateColumns: '1fr 1fr' }}>
                    <div>
                      <div className="rl-muted text-[12px]">TPS</div>
                      <div className="font-mono-design rl-tabular mt-1 text-[13px]">1,284</div>
                    </div>
                    <div>
                      <div className="rl-muted text-[12px]">堆积</div>
                      <div className="font-mono-design rl-tabular mt-1 text-[13px]">0</div>
                    </div>
                  </div>
                  <div
                    className="mt-3"
                    style={{ padding: 10, background: 'hsl(var(--muted) / 0.4)', borderRadius: 6 }}
                  >
                    <div className="font-mono-design text-[12px]" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      msgId: <span style={{ color: 'hsl(var(--foreground))' }}>7F0000010A2E18B4...</span>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button className="rl-btn rl-btn-primary rl-btn-sm" style={{ flex: 1 }}>查看消息</button>
                    <button className="rl-btn rl-btn-outline rl-btn-sm">配置</button>
                  </div>
                </div>
              </div>

              <div className="rl-card mt-3" style={{ padding: 16 }}>
                <div className="rl-muted mb-2 text-[12px]">数据存储位置</div>
                <div className="font-mono-design text-[12px] truncate">~/Library/.../rocket-leaf</div>
                <button
                  className="rl-btn rl-btn-outline rl-btn-sm mt-3"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <Folder size={13} />在文件夹中显示
                </button>
              </div>

              <div className="rl-card mt-3" style={{ padding: 16 }}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[13px] font-medium">Rocket-Leaf</div>
                    <div className="font-mono-design rl-muted mt-1 text-[12px]">v1.4.2 · 2024-10-21</div>
                  </div>
                  <span className="rl-badge rl-badge-success">最新</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
