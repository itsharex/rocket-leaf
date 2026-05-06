import {
  History,
  Send,
  Plus,
  Trash2,
  X,
} from 'lucide-react'
import { PageHeader, JSONView } from '../shell'

const SAMPLE_BODY = `{
  "orderId": "ORD-20250812-08472",
  "userId": 80142,
  "amount": 459.00,
  "items": [
    { "sku": "SKU-A104", "qty": 2 }
  ]
}`

const HISTORY: { ok: boolean; t: string; topic: string; id?: string; ms?: string; err?: string }[] = [
  { ok: true, t: '10:24:18', topic: 'order-events', id: '7F00...4B2D', ms: '12ms' },
  { ok: true, t: '10:23:55', topic: 'order-events', id: '7F00...4B2C', ms: '9ms' },
  { ok: false, t: '10:22:41', topic: 'payment-events', err: 'Topic not found' },
  { ok: true, t: '10:21:08', topic: 'user-events', id: '7F00...4B11', ms: '14ms' },
]

export function ProducerScreen() {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHeader title="发送测试消息" subtitle="向 Topic 发送一条消息用于联调与诊断">
        <button className="rl-btn rl-btn-ghost rl-btn-sm">
          <History size={13} />历史
        </button>
      </PageHeader>

      <div className="min-h-0 flex-1 overflow-hidden">
        <div className="grid h-full" style={{ gridTemplateColumns: '1fr 380px' }}>
          <div className="scroll-thin min-w-0 overflow-auto" style={{ padding: 24 }}>
            <div style={{ maxWidth: 720 }}>
              <div className="rl-section-label">目标</div>
              <div className="rl-card" style={{ padding: 16 }}>
                <div className="grid gap-3.5" style={{ gridTemplateColumns: '1fr 1fr' }}>
                  <div>
                    <div className="rl-muted mb-2 text-[12px]">Topic</div>
                    <select className="rl-select" defaultValue="order-events">
                      <option>order-events</option>
                      <option>payment-events</option>
                      <option>user-events</option>
                    </select>
                  </div>
                  <div>
                    <div className="rl-muted mb-2 text-[12px]">消息类型</div>
                    <select className="rl-select">
                      <option>NORMAL</option>
                      <option>ORDER (顺序)</option>
                      <option>TRANSACTION (事务)</option>
                      <option>DELAY (延迟)</option>
                    </select>
                  </div>
                  <div>
                    <div className="rl-muted mb-2 text-[12px]">Tag <span className="rl-muted">(可选)</span></div>
                    <input className="rl-input font-mono-design" placeholder="order.create" />
                  </div>
                  <div>
                    <div className="rl-muted mb-2 text-[12px]">Key <span className="rl-muted">(可选)</span></div>
                    <input className="rl-input font-mono-design" placeholder="ORD-..." />
                  </div>
                  <div>
                    <div className="rl-muted mb-2 text-[12px]">指定队列 <span className="rl-muted">(可选)</span></div>
                    <select className="rl-select">
                      <option>自动选择</option>
                      <option>QID 0</option>
                      <option>QID 1</option>
                      <option>QID 2</option>
                    </select>
                  </div>
                  <div>
                    <div className="rl-muted mb-2 text-[12px]">延迟级别</div>
                    <select className="rl-select">
                      <option>不延迟</option>
                      <option>1s</option>
                      <option>5s</option>
                      <option>10s</option>
                      <option>1m</option>
                      <option>5m</option>
                      <option>1h</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="rl-section-label" style={{ marginTop: 20 }}>消息体</div>
              <div className="rl-card">
                <div
                  className="flex items-center justify-between"
                  style={{ padding: '8px 12px', borderBottom: '1px solid hsl(var(--border))' }}
                >
                  <div className="rl-tabs">
                    <button className="tab active">JSON</button>
                    <button className="tab">Text</button>
                    <button className="tab">Hex</button>
                    <button className="tab">Base64</button>
                  </div>
                  <div className="flex gap-1">
                    <button className="rl-btn rl-btn-ghost rl-btn-sm">载入示例</button>
                    <button className="rl-btn rl-btn-ghost rl-btn-sm">格式化</button>
                  </div>
                </div>
                <JSONView
                  src={SAMPLE_BODY}
                  maxHeight={220}
                  style={{ border: 'none', borderRadius: 0, minHeight: 200 }}
                />
              </div>

              <div className="rl-section-label" style={{ marginTop: 20 }}>用户属性</div>
              <div className="rl-card" style={{ padding: 16 }}>
                {[
                  ['X-Trace-Id', 'abc123def456'],
                  ['region', 'cn-north'],
                ].map(([k, v]) => (
                  <div key={k} className="mb-2 flex items-center gap-2">
                    <input className="rl-input font-mono-design" defaultValue={k} style={{ flex: 1 }} />
                    <span className="rl-muted">=</span>
                    <input className="rl-input font-mono-design" defaultValue={v} style={{ flex: 2 }} />
                    <button className="rl-btn rl-btn-ghost rl-btn-icon rl-btn-sm">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
                <button className="rl-btn rl-btn-ghost rl-btn-sm mt-1">
                  <Plus size={12} />添加属性
                </button>
              </div>

              <div className="mt-5 flex gap-2">
                <button className="rl-btn rl-btn-primary"><Send size={13} />发送</button>
                <button className="rl-btn rl-btn-outline">发送并查询轨迹</button>
                <button className="rl-btn rl-btn-ghost">重置</button>
                <div className="flex-1" />
                <label className="flex items-center gap-2 rl-muted text-[12px]">
                  <input type="checkbox" defaultChecked />同步等待结果
                </label>
              </div>
            </div>
          </div>

          {/* History */}
          <div
            className="scroll-thin overflow-auto"
            style={{
              borderLeft: '1px solid hsl(var(--border))',
              background: 'hsl(var(--background))',
            }}
          >
            <div style={{ padding: '12px 14px', borderBottom: '1px solid hsl(var(--border))' }}>
              <div className="text-[13px] font-medium">最近发送</div>
              <div className="rl-muted mt-1 text-[12px]">仅本会话保留</div>
            </div>
            {HISTORY.map((h, i) => (
              <div key={i} style={{ padding: '10px 14px', borderBottom: '1px solid hsl(var(--border))' }}>
                <div className="flex items-center gap-2">
                  {h.ok ? (
                    <span style={{ width: 6, height: 6, borderRadius: 999, background: 'hsl(var(--success))' }} />
                  ) : (
                    <X size={11} style={{ color: 'hsl(var(--destructive))' }} />
                  )}
                  <span className="font-mono-design rl-muted rl-tabular text-[12px]">{h.t}</span>
                  <span className="text-[12px]">{h.topic}</span>
                  <span className="flex-1" />
                  <span className="rl-muted font-mono-design text-[12px]">{h.ms || ''}</span>
                </div>
                {h.ok ? (
                  <div className="font-mono-design rl-muted mt-1 text-[12px]">ID {h.id}</div>
                ) : (
                  <div className="mt-1 text-[12px]" style={{ color: 'hsl(var(--destructive))' }}>{h.err}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
