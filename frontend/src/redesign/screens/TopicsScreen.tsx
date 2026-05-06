import {
  Search,
  Filter,
  RefreshCw,
  Plus,
  Tag,
  MoreHorizontal,
  X,
  Server,
  Users,
  Edit,
  Send,
  Trash2,
} from 'lucide-react'
import { PageHeader } from '../shell'

type TopicType = 'NORMAL' | 'DELAY' | 'TRANSACTION' | 'RETRY' | 'DLQ'

const TOPICS: { name: string; type: TopicType; queues: number; perm: string; routes: number; msgIn: string }[] = [
  { name: 'order-events', type: 'NORMAL', queues: 16, perm: '读写', routes: 4, msgIn: '1.2k/s' },
  { name: 'payment-result', type: 'NORMAL', queues: 8, perm: '读写', routes: 4, msgIn: '820/s' },
  { name: 'user-signup-delay', type: 'DELAY', queues: 4, perm: '读写', routes: 2, msgIn: '12/s' },
  { name: 'inventory-tx', type: 'TRANSACTION', queues: 8, perm: '读写', routes: 4, msgIn: '340/s' },
  { name: 'ops.notification', type: 'NORMAL', queues: 4, perm: '只读', routes: 2, msgIn: '—' },
  { name: 'audit-log', type: 'NORMAL', queues: 16, perm: '读写', routes: 4, msgIn: '2.4k/s' },
  { name: 'RETRY%order-consumer', type: 'RETRY', queues: 1, perm: '读写', routes: 1, msgIn: '3/s' },
  { name: 'DLQ%order-consumer', type: 'DLQ', queues: 1, perm: '读写', routes: 1, msgIn: '0/s' },
  { name: 'search-index', type: 'NORMAL', queues: 8, perm: '读写', routes: 4, msgIn: '180/s' },
  { name: 'im.message', type: 'NORMAL', queues: 32, perm: '读写', routes: 4, msgIn: '8.4k/s' },
]

function typeBadge(t: TopicType) {
  const cls: Record<TopicType, string> = {
    NORMAL: 'rl-badge',
    DELAY: 'rl-badge rl-badge-info',
    TRANSACTION: 'rl-badge rl-badge-warn',
    RETRY: 'rl-badge rl-badge-outline',
    DLQ: 'rl-badge rl-badge-danger',
  }
  return <span className={cls[t]}>{t}</span>
}

export function TopicsScreen() {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHeader title="主题" subtitle="248 个 Topic">
        <div className="rl-search-input" style={{ width: 240 }}>
          <span className="icon"><Search size={14} /></span>
          <input className="rl-input" placeholder="搜索 Topic 名称…" />
        </div>
        <button className="rl-btn rl-btn-outline rl-btn-sm">
          <Filter size={13} />筛选
        </button>
        <button className="rl-btn rl-btn-outline rl-btn-icon rl-btn-sm">
          <RefreshCw size={14} />
        </button>
        <button className="rl-btn rl-btn-primary rl-btn-sm">
          <Plus size={13} />新建
        </button>
      </PageHeader>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="min-w-0 flex-1 overflow-auto">
          <table className="rl-table">
            <thead>
              <tr>
                <th style={{ width: 32 }} />
                <th>名称</th>
                <th style={{ width: 130 }}>类型</th>
                <th style={{ width: 90 }} className="rl-tabular">队列</th>
                <th style={{ width: 90 }}>权限</th>
                <th style={{ width: 90 }} className="rl-tabular">Broker</th>
                <th style={{ width: 110 }} className="rl-tabular">入流量</th>
                <th style={{ width: 60 }} />
              </tr>
            </thead>
            <tbody>
              {TOPICS.map((t, i) => (
                <tr key={t.name} className={i === 0 ? 'selected' : ''}>
                  <td><Tag size={14} className="rl-muted" /></td>
                  <td><div className="font-mono-design">{t.name}</div></td>
                  <td>{typeBadge(t.type)}</td>
                  <td className="rl-tabular">{t.queues}</td>
                  <td><span className="rl-muted text-[12px]">{t.perm}</span></td>
                  <td className="rl-tabular">{t.routes}</td>
                  <td className="rl-tabular rl-muted">{t.msgIn}</td>
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

        <TopicDetail />
      </div>
    </div>
  )
}

function TopicDetail() {
  return (
    <aside
      className="scroll-thin"
      style={{
        width: 380,
        borderLeft: '1px solid hsl(var(--border))',
        overflow: 'auto',
        background: 'hsl(var(--background))',
      }}
    >
      <div style={{ padding: 20 }}>
        <div className="flex items-center justify-between">
          <div className="font-mono-design font-semibold">order-events</div>
          <button className="rl-btn rl-btn-ghost rl-btn-icon rl-btn-sm">
            <X size={14} />
          </button>
        </div>
        <div className="mt-2 flex gap-2">
          <span className="rl-badge">NORMAL</span>
          <span className="rl-badge rl-badge-outline">读写</span>
          <span className="rl-badge rl-badge-success">活跃</span>
        </div>

        <div
          className="rl-utabs"
          style={{ marginTop: 16, marginLeft: -20, marginRight: -20, paddingLeft: 20, paddingRight: 20 }}
        >
          <div className="utab active">详情</div>
          <div className="utab">路由</div>
          <div className="utab">消费组</div>
          <div className="utab">消息</div>
        </div>

        <div className="mt-4 grid gap-2" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div className="rl-card" style={{ padding: 12 }}>
            <div className="rl-muted text-[12px]">入流量</div>
            <div className="rl-tabular mt-1 text-[16px] font-semibold">
              1.2k<span className="rl-muted text-[12px] font-medium">/s</span>
            </div>
          </div>
          <div className="rl-card" style={{ padding: 12 }}>
            <div className="rl-muted text-[12px]">出流量</div>
            <div className="rl-tabular mt-1 text-[16px] font-semibold">
              1.18k<span className="rl-muted text-[12px] font-medium">/s</span>
            </div>
          </div>
          <div className="rl-card" style={{ padding: 12 }}>
            <div className="rl-muted text-[12px]">订阅消费组</div>
            <div className="rl-tabular mt-1 text-[16px] font-semibold">3</div>
          </div>
          <div className="rl-card" style={{ padding: 12 }}>
            <div className="rl-muted text-[12px]">总堆积</div>
            <div className="rl-tabular mt-1 text-[16px] font-semibold">0</div>
          </div>
        </div>

        <div className="rl-section-label" style={{ marginTop: 20 }}>基础信息</div>
        <div>
          <div className="rl-detail-row"><div className="k">类型</div><div className="v">NORMAL</div></div>
          <div className="rl-detail-row"><div className="k">队列总数</div><div className="v rl-tabular">16 (4 队列 × 4 Broker)</div></div>
          <div className="rl-detail-row"><div className="k">权限</div><div className="v">6 · 读 + 写</div></div>
          <div className="rl-detail-row"><div className="k">顺序消费</div><div className="v rl-muted">否</div></div>
          <div className="rl-detail-row"><div className="k">创建时间</div><div className="v font-mono-design text-[12px]">2025-08-12 14:32:08</div></div>
        </div>

        <div className="rl-section-label" style={{ marginTop: 20 }}>路由分布</div>
        <div className="rl-card overflow-hidden">
          {[
            { n: 'broker-a-master', r: 4, w: 4, t: '320/s' },
            { n: 'broker-a-slave-1', r: 4, w: 0, t: '—' },
            { n: 'broker-b-master', r: 4, w: 4, t: '880/s' },
            { n: 'broker-b-slave-1', r: 4, w: 0, t: '—' },
          ].map((b, i) => (
            <div
              key={b.n}
              className="flex items-center justify-between"
              style={{ padding: '10px 14px', borderTop: i ? '1px solid hsl(var(--border))' : undefined }}
            >
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <Server size={13} className="rl-muted" />
                <span className="font-mono-design text-[12px] truncate">{b.n}</span>
              </div>
              <span className="font-mono-design rl-tabular rl-muted text-[12px]" style={{ marginRight: 8 }}>{b.t}</span>
              <div className="flex gap-1">
                <span className="rl-badge rl-badge-outline" style={{ height: 18, fontSize: 10 }}>R {b.r}</span>
                <span className="rl-badge rl-badge-outline" style={{ height: 18, fontSize: 10 }}>W {b.w}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="rl-section-label" style={{ marginTop: 20 }}>订阅消费组</div>
        <div className="rl-card overflow-hidden">
          {[
            { n: 'order-consumer-group', lag: 0 },
            { n: 'audit-log-collector', lag: 0 },
            { n: 'search-indexer', lag: 248 },
          ].map((g, i) => (
            <div
              key={g.n}
              className="flex items-center gap-2"
              style={{ padding: '10px 14px', borderTop: i ? '1px solid hsl(var(--border))' : undefined }}
            >
              <Users size={13} className="rl-muted" />
              <span className="font-mono-design text-[12px] flex-1 truncate">{g.n}</span>
              <span className={'rl-badge ' + (g.lag === 0 ? 'rl-badge-success' : 'rl-badge-warn')}>
                {g.lag === 0 ? '已追平' : '+' + g.lag}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-5 flex gap-2">
          <button className="rl-btn rl-btn-outline rl-btn-sm"><Edit size={13} />编辑</button>
          <button className="rl-btn rl-btn-outline rl-btn-sm"><Send size={13} />发送测试</button>
          <button
            className="rl-btn rl-btn-ghost rl-btn-sm"
            style={{ marginLeft: 'auto', color: 'hsl(var(--destructive))' }}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </aside>
  )
}
