import {
  RefreshCw,
  Unlink,
  LayoutGrid,
  Users,
  Server,
  Inbox,
  Tag,
  AlertCircle,
  Send,
  Search,
  Plus,
  RotateCcw,
  ChevronRight,
  Sparkles,
} from 'lucide-react'
import { PageHeader } from '../shell'

function trend(offset = 0, amp = 30): number[] {
  return Array.from({ length: 60 }, (_, i) =>
    100 + Math.sin(i * 0.4 + offset) * amp + Math.cos(i * 0.15 + offset) * (amp * 0.6) + (i % 5) * 2
  )
}

const KPIS = [
  { label: 'Topic', value: '248', icon: LayoutGrid, sub: '活跃 196 · 新增 +3' },
  { label: '消费者组', value: '82', icon: Users, sub: '在线 71 · 离线 11' },
  { label: 'Broker', value: '8 / 8', icon: Server, sub: '4 主 + 4 备 · 全部在线' },
  { label: '消息积压', value: '15.1k', icon: Inbox, sub: '3 个 Group 异常' },
]

const ACTIVE_TOPICS = [
  { n: 'im.message', t: '8.4k/s', p: 100 },
  { n: 'audit-log', t: '2.4k/s', p: 28 },
  { n: 'order-events', t: '1.2k/s', p: 14 },
  { n: 'payment-result', t: '820/s', p: 9 },
  { n: 'inventory-tx', t: '340/s', p: 4 },
]

const LAG_ALERTS: { n: string; lag: number; sev: 'danger' | 'warn' }[] = [
  { n: 'marketing-campaign-bg', lag: 14820, sev: 'danger' },
  { n: 'search-indexer', lag: 248, sev: 'warn' },
  { n: 'payment-result-consumer', lag: 12, sev: 'warn' },
]

const BROKERS = [
  { n: 'broker-a-master', role: 'M', disk: 38 },
  { n: 'broker-a-slave-1', role: 'S', disk: 38 },
  { n: 'broker-b-master', role: 'M', disk: 51 },
  { n: 'broker-b-slave-1', role: 'S', disk: 51 },
]

const QUICK_ACTIONS = [
  { icon: Send, label: '发送测试消息' },
  { icon: Search, label: '查询消息' },
  { icon: Plus, label: '新建 Topic' },
  { icon: RotateCcw, label: '重置消费进度' },
]

export function OverviewScreen() {
  const prod = trend(0, 30)
  const cons = trend(0.4, 28)

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHeader title="概览" subtitle="prod-cluster-01 · 实时刷新于 10:24:38">
        <button className="rl-btn rl-btn-ghost rl-btn-sm">
          <RefreshCw size={13} />刷新
        </button>
        <button className="rl-btn rl-btn-outline rl-btn-sm">
          <Unlink size={13} />断开
        </button>
      </PageHeader>

      <div className="scroll-thin min-h-0 flex-1 overflow-auto p-5">
        <div className="grid items-start gap-4" style={{ gridTemplateColumns: '1fr 320px' }}>
          {/* LEFT */}
          <div className="flex flex-col gap-4">
            <AIDiagnoseCard />

            {/* KPI strip */}
            <div className="grid gap-2.5" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
              {KPIS.map((s) => (
                <div key={s.label} className="rl-stat" style={{ padding: 14 }}>
                  <div className="flex items-center justify-between">
                    <span className="rl-muted text-[12px]">{s.label}</span>
                    <s.icon size={14} className="rl-muted" />
                  </div>
                  <div className="value" style={{ fontSize: 24, marginTop: 6 }}>{s.value}</div>
                  <div className="rl-muted mt-1 text-[12px]">{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Throughput chart */}
            <div className="rl-card" style={{ padding: 16 }}>
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <div className="text-[13px] font-medium">实时吞吐</div>
                  <div className="rl-muted mt-1 text-[12px]">最近 60 分钟 · 每分钟采样</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: 'hsl(142 50% 38%)' }} />
                    <span className="rl-muted text-[12px]">生产</span>
                    <span className="font-mono-design rl-tabular text-[12px]">12,847/s</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: 'hsl(217 80% 50%)' }} />
                    <span className="rl-muted text-[12px]">消费</span>
                    <span className="font-mono-design rl-tabular text-[12px]">12,604/s</span>
                  </div>
                  <div className="rl-tabs">
                    <button className="tab active">1h</button>
                    <button className="tab">6h</button>
                    <button className="tab">24h</button>
                  </div>
                </div>
              </div>
              <svg viewBox="0 0 800 200" preserveAspectRatio="none" style={{ width: '100%', height: 180 }}>
                {[40, 80, 120, 160].map((y) => (
                  <line key={y} x1={0} y1={y} x2={800} y2={y} stroke="hsl(var(--border))" strokeDasharray="3 3" />
                ))}
                <polygon
                  points={`0,200 ${prod.map((v, i) => `${(i / 59) * 800},${200 - v * 0.8}`).join(' ')} 800,200`}
                  fill="hsl(142 50% 38%)"
                  opacity={0.06}
                />
                <polyline
                  points={prod.map((v, i) => `${(i / 59) * 800},${200 - v * 0.8}`).join(' ')}
                  fill="none"
                  stroke="hsl(142 50% 38%)"
                  strokeWidth={1.5}
                />
                <polyline
                  points={cons.map((v, i) => `${(i / 59) * 800},${200 - v * 0.8}`).join(' ')}
                  fill="none"
                  stroke="hsl(217 80% 50%)"
                  strokeWidth={1.5}
                />
              </svg>
            </div>

            {/* Two-col cards */}
            <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div className="rl-card overflow-hidden">
                <div className="flex items-center justify-between p-4 pb-3">
                  <div>
                    <div className="text-[13px] font-medium">活跃 Topic</div>
                    <div className="rl-muted mt-1 text-[12px]">按入流量排序</div>
                  </div>
                  <span className="rl-muted text-[12px]">查看全部 →</span>
                </div>
                <div style={{ borderTop: '1px solid hsl(var(--border))' }}>
                  {ACTIVE_TOPICS.map((r, i) => (
                    <div
                      key={r.n}
                      className="flex items-center gap-3"
                      style={{
                        padding: '10px 16px',
                        borderTop: i ? '1px solid hsl(var(--border))' : undefined,
                      }}
                    >
                      <Tag size={12} className="rl-muted" />
                      <span className="font-mono-design text-[12px] flex-1 truncate">{r.n}</span>
                      <div className="rl-progress" style={{ width: 80 }}>
                        <div className="bar" style={{ width: r.p + '%', background: 'hsl(217 60% 55%)' }} />
                      </div>
                      <span className="font-mono-design rl-tabular rl-muted text-[12px]" style={{ width: 70, textAlign: 'right' }}>
                        {r.t}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rl-card overflow-hidden">
                <div className="flex items-center justify-between p-4 pb-3">
                  <div>
                    <div className="text-[13px] font-medium">堆积告警</div>
                    <div className="rl-muted mt-1 text-[12px]">堆积 &gt; 100 条的消费组</div>
                  </div>
                  <span className="rl-badge rl-badge-danger">3</span>
                </div>
                <div style={{ borderTop: '1px solid hsl(var(--border))' }}>
                  {LAG_ALERTS.map((r, i) => (
                    <div
                      key={r.n}
                      className="flex items-center gap-3"
                      style={{ padding: '10px 16px', borderTop: i ? '1px solid hsl(var(--border))' : undefined }}
                    >
                      <AlertCircle
                        size={13}
                        style={{ color: r.sev === 'danger' ? 'hsl(var(--destructive))' : 'hsl(28 80% 45%)' }}
                      />
                      <span className="font-mono-design text-[12px] flex-1 truncate">{r.n}</span>
                      <span className={'rl-badge ' + (r.sev === 'danger' ? 'rl-badge-danger' : 'rl-badge-warn')}>
                        +{r.lag.toLocaleString()}
                      </span>
                    </div>
                  ))}
                  <div
                    className="flex items-center gap-3 rl-muted"
                    style={{ padding: '10px 16px', borderTop: '1px solid hsl(var(--border))' }}
                  >
                    <span className="text-[12px]">其余 79 个消费组运行正常</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="flex flex-col gap-4">
            <div className="rl-card" style={{ padding: 16 }}>
              <div className="rl-muted text-[12px]">当前连接</div>
              <div className="mt-2 flex items-center gap-2">
                <span className="font-medium">prod-cluster-01</span>
                <span className="rl-badge rl-badge-success">
                  <span style={{ width: 5, height: 5, borderRadius: 999, background: 'currentColor' }} />
                  已连接
                </span>
              </div>
              <div className="font-mono-design rl-muted mt-2 text-[12px]" style={{ wordBreak: 'break-all', lineHeight: 1.6 }}>
                10.20.30.41:9876<br />10.20.30.42:9876
              </div>
              <div className="mt-3 flex gap-2" style={{ paddingTop: 12, borderTop: '1px dashed hsl(var(--border))' }}>
                <span className="rl-badge rl-badge-outline">PROD</span>
                <span className="rl-badge rl-badge-outline">v5.3.0</span>
                <span className="rl-badge rl-badge-outline">ACL</span>
              </div>
            </div>

            <div className="rl-card overflow-hidden">
              <div className="p-4 pb-3">
                <div className="text-[13px] font-medium">Broker 状态</div>
                <div className="rl-muted mt-1 text-[12px]">8 个节点全部在线</div>
              </div>
              <div style={{ borderTop: '1px solid hsl(var(--border))' }}>
                {BROKERS.map((b, i) => (
                  <div
                    key={b.n}
                    className="flex items-center gap-2"
                    style={{ padding: '8px 16px', borderTop: i ? '1px solid hsl(var(--border))' : undefined }}
                  >
                    <span style={{ width: 6, height: 6, borderRadius: 999, background: 'hsl(var(--success))', flexShrink: 0 }} />
                    <span className="font-mono-design text-[12px] flex-1 truncate">{b.n}</span>
                    <span className="rl-badge rl-badge-outline" style={{ height: 18, fontSize: 10 }}>{b.role}</span>
                    <span className="font-mono-design rl-tabular rl-muted text-[12px]" style={{ width: 32, textAlign: 'right' }}>
                      {b.disk}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rl-card overflow-hidden">
              <div className="p-4 pb-3">
                <div className="text-[13px] font-medium">快捷操作</div>
              </div>
              <div style={{ borderTop: '1px solid hsl(var(--border))' }}>
                {QUICK_ACTIONS.map((a, i) => (
                  <div
                    key={a.label}
                    className="flex items-center gap-2 cursor-pointer hover:bg-muted/40"
                    style={{ padding: '10px 16px', borderTop: i ? '1px solid hsl(var(--border))' : undefined }}
                  >
                    <a.icon size={13} className="rl-muted" />
                    <span className="text-[13px] flex-1">{a.label}</span>
                    <ChevronRight size={12} className="rl-muted" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function AIDiagnoseCard() {
  return (
    <div className="rl-ai-diag-card">
      <div className="rl-ai-diag-head">
        <div
          style={{
            width: 22, height: 22, borderRadius: 5,
            background: 'hsl(var(--muted))',
            display: 'grid', placeItems: 'center', color: 'hsl(240 6% 25%)',
          }}
        >
          <Sparkles size={12} />
        </div>
        <div className="flex-1">
          <div className="text-[13px] font-semibold">AI 诊断 · 集群健康</div>
          <div className="rl-muted text-[12px]">2 分钟前更新 · 检查了 14 个 Topic, 9 个消费者组, 8 个 Broker</div>
        </div>
        <button className="rl-btn rl-btn-ghost rl-btn-sm">重新分析</button>
        <button className="rl-btn rl-btn-outline rl-btn-sm">
          <Sparkles size={12} />和 AI 聊聊
        </button>
      </div>

      <div>
        <div className="rl-ai-finding high">
          <div className="ai-sev" />
          <div className="rl-ai-finding-body">
            <div className="flex items-center justify-between">
              <div className="rl-ai-finding-title">search-indexer 持续堆积，疑似下游解析异常</div>
              <span className="rl-muted text-[12px]">高优先级</span>
            </div>
            <div className="rl-ai-finding-desc">
              重试率 18.2%（正常 &lt; 2%），与 1h 前 <strong>order-events v2.3</strong> 升级时间吻合。建议跳过异常消息并通知下游团队。
            </div>
          </div>
        </div>
        <div className="rl-ai-finding med">
          <div className="ai-sev" />
          <div className="rl-ai-finding-body">
            <div className="flex items-center justify-between">
              <div className="rl-ai-finding-title">broker-b-master 磁盘水位 78%，预计 36h 后触发只读</div>
              <span className="rl-muted text-[12px]">中优先级</span>
            </div>
            <div className="rl-ai-finding-desc">
              按当前增长速度（约 3.2GB/h）将在阈值 85% 前 36 小时触达。可考虑扩容或清理 7 天前的归档消息。
            </div>
          </div>
        </div>
        <div className="rl-ai-finding low">
          <div className="ai-sev" />
          <div className="rl-ai-finding-body">
            <div className="flex items-center justify-between">
              <div className="rl-ai-finding-title">3 个 Topic 长期无生产者，建议归档</div>
              <span className="rl-muted text-[12px]">低优先级</span>
            </div>
            <div className="rl-ai-finding-desc">
              <code>legacy-orders</code>、<code>test-evt</code>、<code>tmp-import</code> 已 14 天无新消息，仍占用 832MB 存储。
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
