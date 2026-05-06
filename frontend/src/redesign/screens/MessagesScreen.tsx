import { useState } from 'react'
import {
  Search,
  Copy,
  Download,
  X,
  Send,
  GitBranch,
} from 'lucide-react'
import { PageHeader, JSONView } from '../shell'

const MESSAGES = [
  { id: 'AC1A0F23000078A4F0B8C1234E2F0001', tag: 'create', key: 'order-2025-091823', body: '{"orderId":"2025-091823","amount":128.5,"status":"PAID"…', q: 0 },
  { id: 'AC1A0F23000078A4F0B8C1234E2F0002', tag: 'create', key: 'order-2025-091824', body: '{"orderId":"2025-091824","amount":59.9,"status":"PENDIN…', q: 1 },
  { id: 'AC1A0F23000078A4F0B8C1234E2F0003', tag: 'update', key: 'order-2025-091823', body: '{"orderId":"2025-091823","status":"SHIPPED","ts":17463…', q: 0 },
  { id: 'AC1A0F23000078A4F0B8C1234E2F0004', tag: 'cancel', key: 'order-2025-091820', body: '{"orderId":"2025-091820","reason":"USER_CANCEL"}', q: 2 },
  { id: 'AC1A0F23000078A4F0B8C1234E2F0005', tag: 'create', key: 'order-2025-091825', body: '{"orderId":"2025-091825","amount":1280,"status":"PAID"…', q: 1 },
  { id: 'AC1A0F23000078A4F0B8C1234E2F0006', tag: 'create', key: 'order-2025-091826', body: '{"orderId":"2025-091826","amount":42,"status":"PAID","u…', q: 3 },
  { id: 'AC1A0F23000078A4F0B8C1234E2F0007', tag: 'update', key: 'order-2025-091824', body: '{"orderId":"2025-091824","status":"PAID"}', q: 1 },
  { id: 'AC1A0F23000078A4F0B8C1234E2F0008', tag: 'update', key: 'order-2025-091825', body: '{"orderId":"2025-091825","status":"SHIPPED"}', q: 1 },
]

const SAMPLE_BODY = `{
  "orderId": "2025-091823",
  "userId": 778451,
  "amount": 128.5,
  "currency": "CNY",
  "status": "PAID",
  "paid": true,
  "couponCode": null,
  "items": [
    { "sku": "SKU-A21", "qty": 1 },
    { "sku": "SKU-B07", "qty": 2 }
  ],
  "createdAt": "2025-05-04T10:24:18.218Z"
}`

export function MessagesScreen() {
  const [activeTab, setActiveTab] = useState('按主题查询')

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHeader
        title="消息"
        tabs={['按主题查询', '按 Key 查询', '按 MsgID 查询', '发送消息']}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <div
        className="flex items-center gap-2 px-6 py-3"
        style={{ borderBottom: '1px solid hsl(var(--border))', background: 'hsl(var(--background))' }}
      >
        <select className="rl-select" style={{ width: 220 }} defaultValue="order-events">
          <option>order-events</option>
        </select>
        <input className="rl-input" placeholder="开始时间  2025-05-04 09:00" style={{ width: 220 }} />
        <input className="rl-input" placeholder="结束时间  2025-05-04 11:00" style={{ width: 220 }} />
        <input className="rl-input" placeholder="Tag (可选)" style={{ width: 140 }} />
        <button className="rl-btn rl-btn-primary rl-btn-sm">
          <Search size={13} />查询
        </button>
        <div className="rl-muted ml-auto text-[12px]">共 1,284 条 · 第 1 / 26 页</div>
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="min-w-0 flex-1 overflow-auto">
          <table className="rl-table">
            <thead>
              <tr>
                <th style={{ width: 200 }}>Message ID</th>
                <th style={{ width: 110 }}>Tag</th>
                <th style={{ width: 180 }}>Key</th>
                <th>预览</th>
                <th style={{ width: 70, textAlign: 'right' }}>队列</th>
                <th style={{ width: 170 }}>存储时间</th>
              </tr>
            </thead>
            <tbody>
              {MESSAGES.map((m, i) => (
                <tr key={i} className={i === 0 ? 'selected' : ''}>
                  <td><div className="font-mono-design text-[12px]">{m.id.slice(0, 24)}…</div></td>
                  <td><span className="rl-badge rl-badge-outline">{m.tag}</span></td>
                  <td><span className="font-mono-design text-[12px]">{m.key}</span></td>
                  <td>
                    <div
                      className="font-mono-design rl-muted text-[12px]"
                      style={{ maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    >
                      {m.body}
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }} className="rl-tabular rl-muted">{m.q}</td>
                  <td className="font-mono-design rl-muted text-[12px]">2025-05-04 10:24:18.{220 + i * 7}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Detail */}
        <aside
          className="scroll-thin"
          style={{
            width: 460,
            borderLeft: '1px solid hsl(var(--border))',
            overflow: 'auto',
            background: 'hsl(var(--background))',
          }}
        >
          <div style={{ padding: 20 }}>
            <div className="flex items-center justify-between">
              <div className="font-semibold">消息详情</div>
              <div className="flex gap-1">
                <button className="rl-btn rl-btn-ghost rl-btn-icon rl-btn-sm"><Copy size={13} /></button>
                <button className="rl-btn rl-btn-ghost rl-btn-icon rl-btn-sm"><Download size={13} /></button>
                <button className="rl-btn rl-btn-ghost rl-btn-icon rl-btn-sm"><X size={14} /></button>
              </div>
            </div>

            <div
              className="rl-utabs"
              style={{ marginTop: 12, marginLeft: -20, marginRight: -20, paddingLeft: 20, paddingRight: 20 }}
            >
              <div className="utab active">Body</div>
              <div className="utab">属性</div>
              <div className="utab"><GitBranch size={12} />轨迹</div>
            </div>

            <div className="rl-section-label" style={{ marginTop: 16 }}>基本信息</div>
            <div>
              <div className="rl-detail-row"><div className="k">Message ID</div><div className="v font-mono-design text-[12px]">AC1A0F23000078A4F0B8C1234E2F0001</div></div>
              <div className="rl-detail-row"><div className="k">Topic</div><div className="v font-mono-design text-[12px]">order-events</div></div>
              <div className="rl-detail-row"><div className="k">Tag</div><div className="v">create</div></div>
              <div className="rl-detail-row"><div className="k">Key</div><div className="v font-mono-design text-[12px]">order-2025-091823</div></div>
              <div className="rl-detail-row"><div className="k">队列</div><div className="v">broker-a / queue-0</div></div>
              <div className="rl-detail-row"><div className="k">Born Time</div><div className="v font-mono-design text-[12px]">2025-05-04 10:24:18.220</div></div>
              <div className="rl-detail-row"><div className="k">Store Time</div><div className="v font-mono-design text-[12px]">2025-05-04 10:24:18.224</div></div>
            </div>

            <div className="rl-section-label" style={{ marginTop: 20 }}>Body</div>
            <JSONView src={SAMPLE_BODY} maxHeight={300} />

            <div className="mt-6 flex gap-2">
              <button className="rl-btn rl-btn-outline rl-btn-sm"><Send size={13} />重新发送</button>
              <button className="rl-btn rl-btn-outline rl-btn-sm"><GitBranch size={13} />查看轨迹</button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
