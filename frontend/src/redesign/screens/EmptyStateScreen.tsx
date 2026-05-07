import {
  Github,
  Plus,
  Download,
  HardDrive,
  Box,
  Server,
  Layers,
  Activity,
  Lock,
  Shield,
  AlertCircle,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { PageHeader } from '../shell'

const SAMPLES: {
  name: string
  host: string
  env: string
  desc: string
  icon: LucideIcon
  ghost?: boolean
}[] = [
  {
    name: '本地开发',
    host: '127.0.0.1:9876',
    env: 'DEV',
    desc: '运行在本机的 NameServer',
    icon: HardDrive,
  },
  {
    name: 'Docker Compose',
    host: 'rocketmq:9876',
    env: 'DEV',
    desc: '容器网络内的 NameServer',
    icon: Box,
  },
  {
    name: '粘贴地址…',
    host: 'host:9876;host2:9876',
    env: '—',
    desc: '从剪贴板快速添加',
    icon: Plus,
    ghost: true,
  },
]

const STEPS = [
  {
    n: '01',
    title: '添加 NameServer',
    desc: '填写 host:port，可选启用 ACL 与 TLS。配置仅保存在本地。',
    icon: Server,
  },
  {
    n: '02',
    title: '选择集群与命名空间',
    desc: 'Rocket-Leaf 自动发现 Broker，按环境组织视图。',
    icon: Layers,
  },
  {
    n: '03',
    title: '管理 Topic 与消费',
    desc: '创建、查询、回溯消费位点，跟踪消息轨迹。',
    icon: Activity,
  },
]

export function EmptyStateScreen({ onAddConnection }: { onAddConnection?: () => void }) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHeader title="概览" subtitle="未连接 · 请先添加 NameServer">
        <button className="rl-btn rl-btn-ghost rl-btn-sm">
          <Github size={13} />
          文档
        </button>
        <button className="rl-btn rl-btn-primary rl-btn-sm" onClick={onAddConnection}>
          <Plus size={13} />
          添加连接
        </button>
      </PageHeader>

      <div className="scroll-thin min-h-0 flex-1 overflow-auto">
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '20px 20px 32px' }}>
          {/* Hero */}
          <div className="rl-card" style={{ position: 'relative', overflow: 'hidden', padding: 0 }}>
            <div
              aria-hidden
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage:
                  'linear-gradient(hsl(var(--border) / 0.6) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border) / 0.6) 1px, transparent 1px)',
                backgroundSize: '28px 28px',
                maskImage: 'radial-gradient(ellipse 60% 75% at 85% 30%, #000 0%, transparent 70%)',
                WebkitMaskImage:
                  'radial-gradient(ellipse 60% 75% at 85% 30%, #000 0%, transparent 70%)',
                opacity: 0.45,
              }}
            />

            <div
              className="flex"
              style={{ position: 'relative', padding: '20px 22px', gap: 20, alignItems: 'center' }}
            >
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex items-center gap-2">
                  <span className="rl-badge rl-badge-outline" style={{ height: 19 }}>
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 999,
                        background: 'hsl(var(--muted-foreground))',
                      }}
                    />
                    未连接
                  </span>
                  <span className="rl-muted text-[12px]">
                    支持 RocketMQ 4.x / 5.x · 本地运行 · 无服务端
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 600,
                    letterSpacing: '-0.01em',
                    lineHeight: 1.3,
                  }}
                >
                  连接到你的第一个 NameServer
                </div>
                <div
                  className="rl-muted mt-1.5 text-[12px]"
                  style={{ maxWidth: 520, lineHeight: 1.6 }}
                >
                  配置 NameServer 地址后即可访问
                  Topic、消费者组、消息查询与集群监控。所有配置仅保存在本地。
                </div>
                <div className="mt-3 flex gap-2">
                  <button className="rl-btn rl-btn-primary rl-btn-sm" onClick={onAddConnection}>
                    <Plus size={13} />
                    添加连接
                  </button>
                  <button className="rl-btn rl-btn-outline rl-btn-sm">
                    <Download size={12} />
                    从文件导入
                  </button>
                </div>
              </div>

              <div style={{ width: 200, flexShrink: 0, display: 'grid', placeItems: 'center' }}>
                <EmptySchematic />
              </div>
            </div>
          </div>

          {/* Quick start */}
          <div className="rl-section-label" style={{ marginTop: 20 }}>
            快速开始
          </div>
          <div className="grid gap-2.5" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {SAMPLES.map((s) => (
              <div
                key={s.name}
                className="rl-card cursor-pointer"
                style={{
                  padding: 14,
                  borderStyle: s.ghost ? 'dashed' : 'solid',
                  background: s.ghost ? 'transparent' : 'hsl(var(--card))',
                }}
              >
                <div className="flex items-center gap-2">
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 6,
                      background: s.ghost ? 'transparent' : 'hsl(var(--muted))',
                      border: s.ghost ? '1px dashed hsl(var(--border))' : 'none',
                      display: 'grid',
                      placeItems: 'center',
                    }}
                  >
                    <s.icon size={13} className="rl-muted" />
                  </div>
                  <span className="text-[13px] font-medium">{s.name}</span>
                  {!s.ghost && (
                    <span
                      className="rl-badge rl-badge-outline"
                      style={{ height: 17, fontSize: 10, marginLeft: 'auto' }}
                    >
                      {s.env}
                    </span>
                  )}
                </div>
                <div className="font-mono-design rl-muted mt-2 truncate text-[12px]">{s.host}</div>
                <div className="rl-muted mt-2 text-[12px]" style={{ lineHeight: 1.5 }}>
                  {s.desc}
                </div>
              </div>
            ))}
          </div>

          {/* Three-step flow */}
          <div className="rl-section-label" style={{ marginTop: 20 }}>
            使用流程
          </div>
          <div className="rl-card" style={{ padding: 0 }}>
            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
              {STEPS.map((step, i) => (
                <div
                  key={step.n}
                  style={{
                    padding: 14,
                    borderRight: i < 2 ? '1px solid hsl(var(--border))' : 'none',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono-design rl-muted rl-tabular text-[12px]">
                      {step.n}
                    </span>
                    <span style={{ flex: 1, height: 1, background: 'hsl(var(--border))' }} />
                    <step.icon size={13} className="rl-muted" />
                  </div>
                  <div className="mt-2 text-[13px] font-medium">{step.title}</div>
                  <div className="rl-muted mt-1 text-[12px]" style={{ lineHeight: 1.55 }}>
                    {step.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div
            className="mt-4 flex items-center justify-between"
            style={{ paddingTop: 12, borderTop: '1px solid hsl(var(--border))' }}
          >
            <div className="flex items-center gap-4">
              <a
                className="rl-muted flex items-center gap-1 text-[12px]"
                style={{ textDecoration: 'none' }}
              >
                <Github size={12} />
                GitHub
              </a>
              <a
                className="rl-muted flex items-center gap-1 text-[12px]"
                style={{ textDecoration: 'none' }}
              >
                <Lock size={12} />
                ACL 配置指南
              </a>
              <a
                className="rl-muted flex items-center gap-1 text-[12px]"
                style={{ textDecoration: 'none' }}
              >
                <Shield size={12} />
                TLS 配置指南
              </a>
              <a
                className="rl-muted flex items-center gap-1 text-[12px]"
                style={{ textDecoration: 'none' }}
              >
                <AlertCircle size={12} />
                常见问题
              </a>
            </div>
            <div className="rl-muted text-[12px]">v1.4.2 · 本地数据 · 不上传任何信息</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function EmptySchematic() {
  return (
    <svg width={220} height={160} viewBox="0 0 220 160" fill="none" style={{ display: 'block' }}>
      <defs>
        <pattern id="dots" width={4} height={4} patternUnits="userSpaceOnUse">
          <circle cx={1} cy={1} r={0.6} fill="hsl(var(--muted-foreground))" opacity={0.35} />
        </pattern>
      </defs>

      {/* Client */}
      <g>
        <rect
          x={6}
          y={58}
          width={56}
          height={44}
          rx={8}
          fill="hsl(var(--card))"
          stroke="hsl(var(--border))"
        />
        <rect
          x={14}
          y={66}
          width={40}
          height={3}
          rx={1.5}
          fill="hsl(var(--muted-foreground))"
          opacity={0.4}
        />
        <rect
          x={14}
          y={73}
          width={28}
          height={3}
          rx={1.5}
          fill="hsl(var(--muted-foreground))"
          opacity={0.25}
        />
        <rect x={14} y={86} width={40} height={10} rx={2} fill="hsl(var(--foreground))" />
        <text
          x={34}
          y={93.5}
          textAnchor="middle"
          fontSize={6}
          fontFamily="ui-monospace, monospace"
          fill="hsl(var(--background))"
          fontWeight={600}
        >
          RL
        </text>
      </g>

      {/* Connection line */}
      <line
        x1={62}
        y1={80}
        x2={92}
        y2={80}
        stroke="hsl(var(--muted-foreground))"
        strokeWidth={1.2}
        strokeDasharray="3 3"
      />
      <line
        x1={118}
        y1={80}
        x2={148}
        y2={80}
        stroke="hsl(var(--muted-foreground))"
        strokeWidth={1.2}
        strokeDasharray="3 3"
        opacity={0.4}
      />

      {/* NameServer slot */}
      <rect
        x={92}
        y={64}
        width={34}
        height={32}
        rx={6}
        fill="url(#dots)"
        stroke="hsl(var(--border))"
        strokeDasharray="3 3"
      />
      <text
        x={109}
        y={82}
        textAnchor="middle"
        fontSize={6.5}
        fontFamily="ui-sans-serif, system-ui"
        fill="hsl(var(--muted-foreground))"
        fontWeight={500}
      >
        NameServer
      </text>
      <text
        x={109}
        y={91}
        textAnchor="middle"
        fontSize={6}
        fontFamily="ui-sans-serif, system-ui"
        fill="hsl(var(--muted-foreground))"
        opacity={0.7}
      >
        未配置
      </text>

      {/* Broker cluster */}
      <g opacity={0.4}>
        {[40, 69, 98].map((y) => (
          <g key={y}>
            <rect
              x={148}
              y={y}
              width={60}
              height={22}
              rx={5}
              fill="hsl(var(--muted))"
              stroke="hsl(var(--border))"
            />
            <circle cx={155} cy={y + 11} r={1.5} fill="hsl(var(--muted-foreground))" />
            <rect
              x={160}
              y={y + 9}
              width={42}
              height={2}
              rx={1}
              fill="hsl(var(--muted-foreground))"
              opacity={0.6}
            />
            <rect
              x={160}
              y={y + 13}
              width={28}
              height={2}
              rx={1}
              fill="hsl(var(--muted-foreground))"
              opacity={0.4}
            />
          </g>
        ))}
      </g>

      <text
        x={34}
        y={116}
        textAnchor="middle"
        fontSize={6.5}
        fill="hsl(var(--muted-foreground))"
        fontFamily="ui-sans-serif"
      >
        Rocket-Leaf
      </text>
      <text
        x={178}
        y={134}
        textAnchor="middle"
        fontSize={6.5}
        fill="hsl(var(--muted-foreground))"
        fontFamily="ui-sans-serif"
        opacity={0.55}
      >
        Broker 集群
      </text>
    </svg>
  )
}
