import {
  Search,
  RefreshCw,
  MoreHorizontal,
  AlertCircle,
  Users,
  X,
  Tag,
  RotateCcw,
  Edit,
} from 'lucide-react'
import { PageHeader } from '../shell'

const GROUPS = [
  { name: 'order-consumer-group', topic: 'order-events', model: 'CLUSTERING', status: '在线', consumers: 4, lag: 0 },
  { name: 'payment-result-consumer', topic: 'payment-result', model: 'CLUSTERING', status: '在线', consumers: 2, lag: 12 },
  { name: 'audit-log-collector', topic: 'audit-log', model: 'CLUSTERING', status: '在线', consumers: 6, lag: 0 },
  { name: 'search-indexer', topic: 'search-index', model: 'CLUSTERING', status: '在线', consumers: 3, lag: 248 },
  { name: 'im-fanout-broadcast', topic: 'im.message', model: 'BROADCASTING', status: '在线', consumers: 8, lag: 0 },
  { name: 'inventory-tx-handler', topic: 'inventory-tx', model: 'CLUSTERING', status: '在线', consumers: 2, lag: 0 },
  { name: 'marketing-campaign-bg', topic: 'user-signup-delay', model: 'CLUSTERING', status: '离线', consumers: 0, lag: 14820 },
  { name: 'ops-notify-bot', topic: 'ops.notification', model: 'CLUSTERING', status: '在线', consumers: 1, lag: 4 },
]

const QUEUE_PROGRESS = [
  { q: 'broker-a', qid: 0, brk: 12480, cmt: 12480, lag: 0 },
  { q: 'broker-a', qid: 1, brk: 9821, cmt: 9821, lag: 0 },
  { q: 'broker-b', qid: 0, brk: 15042, cmt: 14920, lag: 122 },
  { q: 'broker-b', qid: 1, brk: 8204, cmt: 8078, lag: 126 },
]

export function ConsumersScreen() {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHeader title="消费者组" subtitle="82 个 Group">
        <div className="rl-search-input" style={{ width: 240 }}>
          <span className="icon"><Search size={14} /></span>
          <input className="rl-input" placeholder="搜索 Group…" />
        </div>
        <button className="rl-btn rl-btn-outline rl-btn-icon rl-btn-sm">
          <RefreshCw size={14} />
        </button>
      </PageHeader>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="min-w-0 flex-1 overflow-auto">
          <table className="rl-table">
            <thead>
              <tr>
                <th>Group 名称</th>
                <th>订阅主题</th>
                <th style={{ width: 130 }}>模式</th>
                <th style={{ width: 100 }}>状态</th>
                <th style={{ width: 90, textAlign: 'right' }}>实例</th>
                <th style={{ width: 130, textAlign: 'right' }}>堆积</th>
                <th style={{ width: 50 }} />
              </tr>
            </thead>
            <tbody>
              {GROUPS.map((g, i) => (
                <tr key={g.name} className={i === 3 ? 'selected' : ''}>
                  <td><div className="font-mono-design">{g.name}</div></td>
                  <td><span className="font-mono-design rl-muted text-[13px]">{g.topic}</span></td>
                  <td><span className="rl-badge rl-badge-outline">{g.model}</span></td>
                  <td>
                    {g.status === '在线' ? (
                      <span className="rl-badge rl-badge-success">
                        <span style={{ width: 5, height: 5, borderRadius: 999, background: 'currentColor' }} />在线
                      </span>
                    ) : (
                      <span className="rl-badge rl-badge-danger">离线</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }} className="rl-tabular">{g.consumers}</td>
                  <td style={{ textAlign: 'right' }} className={'rl-tabular ' + (g.lag > 1000 ? '' : 'rl-muted')}>
                    {g.lag > 1000 && (
                      <AlertCircle size={11} style={{ display: 'inline', marginRight: 3, color: 'hsl(var(--destructive))' }} />
                    )}
                    {g.lag.toLocaleString()}
                  </td>
                  <td>
                    <button className="rl-btn rl-btn-ghost rl-btn-icon rl-btn-sm">
                      <MoreHorizontal size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Detail */}
        <aside
          className="scroll-thin"
          style={{
            width: 420,
            borderLeft: '1px solid hsl(var(--border))',
            overflow: 'auto',
            background: 'hsl(var(--background))',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ padding: '16px 20px', borderBottom: '1px solid hsl(var(--border))' }}>
            <div className="flex items-center justify-between">
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <Users size={15} className="rl-muted" />
                <span className="font-mono-design font-semibold truncate">search-indexer</span>
                <span className="rl-badge rl-badge-warn">堆积</span>
              </div>
              <button className="rl-btn rl-btn-ghost rl-btn-icon rl-btn-sm">
                <X size={14} />
              </button>
            </div>
            <div className="rl-muted mt-2 flex items-center gap-2 text-[12px]">
              <Tag size={11} />
              <span className="font-mono-design">search-index</span>
              <span style={{ width: 3, height: 3, borderRadius: 999, background: 'hsl(var(--border))' }} />
              <span>CLUSTERING</span>
              <span style={{ width: 3, height: 3, borderRadius: 999, background: 'hsl(var(--border))' }} />
              <span>3 实例</span>
            </div>
          </div>

          <div className="rl-utabs" style={{ paddingLeft: 20, paddingRight: 20, borderBottom: '1px solid hsl(var(--border))' }}>
            <div className="utab active">概览</div>
            <div className="utab">实例 <span className="rl-muted" style={{ marginLeft: 4 }}>3</span></div>
            <div className="utab">订阅</div>
            <div className="utab">配置</div>
          </div>

          <div className="scroll-thin min-h-0 flex-1 overflow-auto" style={{ padding: '16px 20px' }}>
            <div
              className="grid"
              style={{
                gridTemplateColumns: '1fr 1fr 1fr',
                border: '1px solid hsl(var(--border))',
                borderRadius: 8,
                overflow: 'hidden',
              }}
            >
              <div style={{ padding: '12px 14px' }}>
                <div className="rl-muted text-[12px]">实例</div>
                <div className="rl-tabular mt-1 font-semibold" style={{ fontSize: 18 }}>3</div>
              </div>
              <div style={{ padding: '12px 14px', borderLeft: '1px solid hsl(var(--border))' }}>
                <div className="flex items-center gap-1">
                  <div className="rl-muted text-[12px]">总堆积</div>
                  <AlertCircle size={10} style={{ color: 'hsl(28 80% 45%)' }} />
                </div>
                <div className="rl-tabular mt-1 font-semibold" style={{ fontSize: 18, color: 'hsl(28 80% 38%)' }}>248</div>
              </div>
              <div style={{ padding: '12px 14px', borderLeft: '1px solid hsl(var(--border))' }}>
                <div className="rl-muted text-[12px]">消费 TPS</div>
                <div className="mt-1 flex items-center gap-1">
                  <span className="rl-tabular font-semibold" style={{ fontSize: 18 }}>182</span>
                  <span className="rl-muted text-[12px]" style={{ marginBottom: 1 }}>/s</span>
                </div>
              </div>
            </div>

            <div className="rl-section-label" style={{ marginTop: 20 }}>订阅主题</div>
            <div
              className="flex items-center gap-2"
              style={{ padding: '8px 12px', border: '1px solid hsl(var(--border))', borderRadius: 8 }}
            >
              <Tag size={12} className="rl-muted" />
              <span className="font-mono-design text-[13px] flex-1">search-index</span>
              <span className="rl-muted text-[12px]">Tag</span>
              <span className="font-mono-design text-[12px]">*</span>
            </div>

            <div className="mb-2 mt-5 flex items-center justify-between">
              <div className="rl-section-label" style={{ marginBottom: 0 }}>队列消费进度</div>
              <div className="rl-muted text-[12px]">4 队列 · 2 落后</div>
            </div>
            <div className="rl-card overflow-hidden">
              {QUEUE_PROGRESS.map((q, i) => {
                const pct = (q.cmt / q.brk) * 100
                return (
                  <div
                    key={i}
                    style={{ padding: '10px 14px', borderTop: i ? '1px solid hsl(var(--border))' : undefined }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono-design rl-muted text-[12px]">{q.q}</span>
                        <span style={{ width: 1, height: 10, background: 'hsl(var(--border))' }} />
                        <span className="font-mono-design text-[12px]">queue-{q.qid}</span>
                      </div>
                      {q.lag === 0 ? (
                        <span className="text-[12px]" style={{ color: 'hsl(142 60% 28%)' }}>已追平</span>
                      ) : (
                        <span className="font-mono-design rl-tabular text-[12px]" style={{ color: 'hsl(28 80% 38%)' }}>+{q.lag}</span>
                      )}
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="rl-progress flex-1" style={{ height: 4 }}>
                        <div
                          className="bar"
                          style={{
                            width: pct + '%',
                            background: q.lag === 0 ? 'hsl(142 50% 45%)' : 'hsl(28 80% 55%)',
                          }}
                        />
                      </div>
                      <span
                        className="font-mono-design rl-tabular rl-muted text-[12px]"
                        style={{ minWidth: 120, textAlign: 'right' }}
                      >
                        {q.cmt.toLocaleString()}
                        <span className="rl-muted" style={{ opacity: 0.5 }}> / </span>
                        {q.brk.toLocaleString()}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div
            className="flex items-center gap-2 rl-subtle-bg"
            style={{ padding: '12px 20px', borderTop: '1px solid hsl(var(--border))' }}
          >
            <button className="rl-btn rl-btn-outline rl-btn-sm"><RotateCcw size={13} />重置进度</button>
            <button className="rl-btn rl-btn-outline rl-btn-sm" style={{ marginLeft: 'auto' }}>
              <Edit size={13} />修改订阅
            </button>
            <button className="rl-btn rl-btn-ghost rl-btn-icon rl-btn-sm">
              <MoreHorizontal size={14} />
            </button>
          </div>
        </aside>
      </div>
    </div>
  )
}
