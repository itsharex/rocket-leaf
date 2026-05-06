import { useState } from 'react'
import {
  RefreshCw,
  Plus,
  Key,
  Edit,
  MoreHorizontal,
  Eye,
  Copy,
  Trash2,
  Check,
} from 'lucide-react'
import { PageHeader } from '../shell'

const ROWS = [
  { ak: 'rocketmq-admin', sk: '••••••••••••', ip: '*', tp: 'DENY', gp: 'DENY', admin: true, ts: '2024-03-01', sel: true },
  { ak: 'order-service', sk: '••••••••••••', ip: '10.20.0.0/16', tp: 'PUB', gp: 'SUB', admin: false, ts: '2024-04-12' },
  { ak: 'payment-service', sk: '••••••••••••', ip: '10.20.0.0/16', tp: 'PUB|SUB', gp: 'SUB', admin: false, ts: '2024-04-15' },
  { ak: 'audit-collector', sk: '••••••••••••', ip: '10.30.0.0/16', tp: 'DENY', gp: 'SUB', admin: false, ts: '2024-05-02' },
  { ak: 'search-indexer', sk: '••••••••••••', ip: '10.30.0.0/16', tp: 'DENY', gp: 'SUB', admin: false, ts: '2024-05-18' },
  { ak: 'notification-svc', sk: '••••••••••••', ip: '10.20.0.0/16', tp: 'PUB', gp: 'DENY', admin: false, ts: '2024-06-04' },
  { ak: 'log-pipeline', sk: '••••••••••••', ip: '10.30.0.0/16', tp: 'PUB', gp: 'SUB', admin: false, ts: '2024-06-21' },
  { ak: 'data-warehouse', sk: '••••••••••••', ip: '10.40.5.0/24', tp: 'DENY', gp: 'SUB', admin: false, ts: '2024-07-03' },
  { ak: 'fraud-detect', sk: '••••••••••••', ip: '10.20.0.0/16', tp: 'DENY', gp: 'SUB', admin: false, ts: '2024-07-19' },
  { ak: 'ops-monitor', sk: '••••••••••••', ip: '10.0.0.0/8', tp: 'DENY', gp: 'DENY', admin: true, ts: '2024-08-01' },
  { ak: 'user-service', sk: '••••••••••••', ip: '10.20.0.0/16', tp: 'PUB|SUB', gp: 'SUB', admin: false, ts: '2024-08-15' },
  { ak: 'inventory-svc', sk: '••••••••••••', ip: '10.20.0.0/16', tp: 'PUB|SUB', gp: 'SUB', admin: false, ts: '2024-09-02' },
  { ak: 'shipping-svc', sk: '••••••••••••', ip: '10.20.0.0/16', tp: 'PUB', gp: 'SUB', admin: false, ts: '2024-09-14' },
  { ak: 'recommend-engine', sk: '••••••••••••', ip: '10.30.0.0/16', tp: 'DENY', gp: 'SUB', admin: false, ts: '2024-10-05' },
  { ak: 'external-webhook', sk: '••••••••••••', ip: '203.0.113.0/24', tp: 'PUB', gp: 'DENY', admin: false, ts: '2024-10-21' },
]

const RESOURCE_OVERRIDES = [
  { type: 'Topic', name: 'ORDER_TOPIC', perm: 'PUB|SUB' },
  { type: 'Topic', name: 'AUDIT_LOG', perm: 'PUB' },
  { type: 'Group', name: 'GID_ADMIN', perm: 'SUB' },
  { type: 'Group', name: 'GID_OPS_*', perm: 'SUB' },
]

export function AclScreen() {
  const [activeTab, setActiveTab] = useState('账号')

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHeader
        title="ACL 管理"
        subtitle="访问控制列表"
        tabs={['账号', 'Topic 权限', 'Group 权限']}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      >
        <button className="rl-btn rl-btn-outline rl-btn-icon rl-btn-sm">
          <RefreshCw size={14} />
        </button>
        <button className="rl-btn rl-btn-primary rl-btn-sm">
          <Plus size={13} />新增账号
        </button>
      </PageHeader>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="min-w-0 flex-1 overflow-auto">
          <table className="rl-table">
            <thead>
              <tr>
                <th style={{ width: 36 }}><input type="checkbox" /></th>
                <th>AccessKey</th>
                <th>SecretKey</th>
                <th>白名单 IP</th>
                <th style={{ width: 100 }}>默认 Topic</th>
                <th style={{ width: 100 }}>默认 Group</th>
                <th style={{ width: 90 }}>角色</th>
                <th style={{ width: 130 }}>创建时间</th>
                <th style={{ width: 70 }} />
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <tr key={r.ak} className={r.sel ? 'selected' : ''}>
                  <td><input type="checkbox" defaultChecked={r.sel} /></td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Key size={13} className="rl-muted" />
                      <span className="font-mono-design">{r.ak}</span>
                    </div>
                  </td>
                  <td><span className="font-mono-design rl-muted text-[12px]">{r.sk}</span></td>
                  <td><span className="font-mono-design text-[12px]">{r.ip}</span></td>
                  <td><span className="rl-badge rl-badge-outline">{r.tp}</span></td>
                  <td><span className="rl-badge rl-badge-outline">{r.gp}</span></td>
                  <td>{r.admin ? <span className="rl-badge rl-badge-warn">管理员</span> : <span className="rl-muted text-[12px]">普通</span>}</td>
                  <td>
                    <span className="font-mono-design rl-muted rl-tabular text-[12px] whitespace-nowrap">{r.ts}</span>
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <button className="rl-btn rl-btn-ghost rl-btn-icon rl-btn-sm"><Edit size={13} /></button>
                      <button className="rl-btn rl-btn-ghost rl-btn-icon rl-btn-sm"><MoreHorizontal size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Detail panel */}
        <aside
          className="scroll-thin rl-subtle-bg"
          style={{
            width: 360,
            borderLeft: '1px solid hsl(var(--border))',
            overflow: 'auto',
          }}
        >
          <div style={{ padding: 20 }}>
            <div className="flex items-center gap-3">
              <div
                className="rl-conn-icon"
                style={{ width: 40, height: 40, background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}
              >
                <Key size={17} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-mono-design font-medium truncate">rocketmq-admin</div>
                <div className="mt-1 flex items-center gap-2">
                  <span className="rl-badge rl-badge-warn">管理员</span>
                  <span className="rl-muted text-[12px]">创建于 2024-03-01</span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid hsl(var(--border))', padding: '16px 20px' }}>
            <div className="rl-section-label" style={{ marginTop: 0 }}>凭证</div>
            <div className="rl-muted mb-2 text-[12px]">SecretKey</div>
            <div className="flex items-center gap-2">
              <input className="rl-input font-mono-design text-[12px]" defaultValue="abcdef123456••••••••" readOnly />
              <button className="rl-btn rl-btn-outline rl-btn-icon rl-btn-sm" title="显示"><Eye size={13} /></button>
              <button className="rl-btn rl-btn-outline rl-btn-icon rl-btn-sm" title="复制"><Copy size={13} /></button>
            </div>
            <button
              className="rl-btn rl-btn-outline rl-btn-sm mt-3"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <RefreshCw size={13} />轮换 SecretKey
            </button>
          </div>

          <div style={{ borderTop: '1px solid hsl(var(--border))', padding: '16px 20px' }}>
            <div className="rl-section-label" style={{ marginTop: 0 }}>白名单 IP</div>
            <div className="flex flex-col gap-1">
              <div
                className="flex items-center justify-between"
                style={{
                  padding: '6px 10px', border: '1px solid hsl(var(--border))', borderRadius: 6,
                  background: 'hsl(var(--background))',
                }}
              >
                <span className="font-mono-design text-[12px]">*</span>
                <button className="rl-btn rl-btn-ghost rl-btn-icon rl-btn-sm"><Trash2 size={12} /></button>
              </div>
            </div>
            <div className="mt-2 flex gap-2">
              <input className="rl-input font-mono-design text-[12px]" placeholder="10.0.0.0/24" />
              <button className="rl-btn rl-btn-outline rl-btn-sm"><Plus size={12} /></button>
            </div>
          </div>

          <div style={{ borderTop: '1px solid hsl(var(--border))', padding: '16px 20px' }}>
            <div className="rl-section-label" style={{ marginTop: 0 }}>权限策略</div>
            <div className="flex items-center justify-between" style={{ padding: '8px 0' }}>
              <span className="text-[13px]">默认 Topic 权限</span>
              <select className="rl-select rl-btn-sm" style={{ width: 110 }}>
                <option>DENY</option>
                <option>PUB</option>
                <option>SUB</option>
                <option>PUB|SUB</option>
              </select>
            </div>
            <div
              className="flex items-center justify-between"
              style={{ padding: '8px 0', borderTop: '1px solid hsl(var(--border))' }}
            >
              <span className="text-[13px]">默认 Group 权限</span>
              <select className="rl-select rl-btn-sm" style={{ width: 110 }}>
                <option>DENY</option>
                <option>SUB</option>
              </select>
            </div>
            <div
              className="flex items-center justify-between"
              style={{ padding: '8px 0', borderTop: '1px solid hsl(var(--border))' }}
            >
              <span className="text-[13px]">管理员权限</span>
              <span className="rl-badge rl-badge-warn">已开启</span>
            </div>
          </div>

          <div style={{ borderTop: '1px solid hsl(var(--border))', padding: '16px 20px' }}>
            <div className="rl-section-label" style={{ marginTop: 0 }}>
              资源覆写 <span className="rl-muted text-[12px]" style={{ fontWeight: 400 }}>· 4</span>
            </div>
            <div className="flex flex-col gap-2">
              {RESOURCE_OVERRIDES.map((r) => (
                <div
                  key={r.name}
                  className="flex items-center justify-between"
                  style={{
                    padding: '8px 10px', border: '1px solid hsl(var(--border))', borderRadius: 6,
                    background: 'hsl(var(--background))',
                  }}
                >
                  <div>
                    <span className="rl-badge rl-badge-outline" style={{ marginRight: 6 }}>{r.type}</span>
                    <span className="font-mono-design text-[12px]">{r.name}</span>
                  </div>
                  <span className="rl-badge">{r.perm}</span>
                </div>
              ))}
            </div>
            <button
              className="rl-btn rl-btn-outline rl-btn-sm mt-3"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <Plus size={12} />新增覆写
            </button>
          </div>

          <div
            style={{
              borderTop: '1px solid hsl(var(--border))', padding: '16px 20px',
              display: 'flex', gap: 8,
            }}
          >
            <button className="rl-btn rl-btn-ghost rl-btn-sm" style={{ color: 'hsl(var(--destructive))' }}>
              <Trash2 size={13} />删除
            </button>
            <button className="rl-btn rl-btn-primary rl-btn-sm" style={{ marginLeft: 'auto' }}>
              <Check size={13} />保存
            </button>
          </div>
        </aside>
      </div>
    </div>
  )
}
