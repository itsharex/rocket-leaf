import { useState } from 'react'
import {
  RefreshCw,
  CircleDot,
  Activity,
  HardDrive,
  Inbox,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '../shell'

const BROKERS = [
  { name: 'broker-a-master', role: 'MASTER', addr: '10.20.30.41:10911', ver: '5.3.0', tps: '8.2k / 8.0k', disk: 38 },
  { name: 'broker-a-slave-1', role: 'SLAVE', addr: '10.20.30.42:10911', ver: '5.3.0', tps: '—', disk: 38 },
  { name: 'broker-b-master', role: 'MASTER', addr: '10.20.30.43:10911', ver: '5.3.0', tps: '9.4k / 9.2k', disk: 51 },
  { name: 'broker-b-slave-1', role: 'SLAVE', addr: '10.20.30.44:10911', ver: '5.3.0', tps: '—', disk: 51 },
]

export function ClusterScreen() {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState('概览')

  const prodPoints = Array.from({ length: 60 }, (_, i) => {
    const v = 100 + Math.sin(i * 0.4) * 30 + Math.cos(i * 0.15) * 20 + ((i * 17) % 10)
    return `${(i / 59) * 800},${200 - v - 10}`
  }).join(' ')
  const consPoints = Array.from({ length: 60 }, (_, i) => {
    const v = 95 + Math.sin(i * 0.4 + 0.3) * 28 + Math.cos(i * 0.15) * 20 + ((i * 13) % 10)
    return `${(i / 59) * 800},${200 - v - 10}`
  }).join(' ')

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHeader
        title={t('cluster.title')}
        subtitle="prod-cluster-01 · 2 个 NameServer · 4 台 Broker"
        tabs={['概览', 'Broker', 'NameServer', 'Topic 路由']}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      >
        <button className="rl-btn rl-btn-outline rl-btn-icon rl-btn-sm">
          <RefreshCw size={14} />
        </button>
      </PageHeader>

      <div className="scroll-thin min-h-0 flex-1 overflow-auto p-5">
        <div>
          {/* Top stats */}
          <div className="grid gap-2.5" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            <div className="rl-stat" style={{ padding: 14 }}>
              <div className="flex items-center justify-between">
                <span className="rl-muted text-[12px]">集群健康</span>
                <CircleDot size={13} style={{ color: 'hsl(142 60% 38%)' }} />
              </div>
              <div className="value" style={{ fontSize: 22, color: 'hsl(142 60% 28%)', marginTop: 6 }}>正常</div>
              <div className="rl-muted mt-1 text-[12px]">8/8 在线 · 已运行 47 天</div>
            </div>
            <div className="rl-stat" style={{ padding: 14 }}>
              <div className="flex items-center justify-between">
                <span className="rl-muted text-[12px]">总 TPS</span>
                <Activity size={13} className="rl-muted" />
              </div>
              <div className="value rl-tabular" style={{ fontSize: 22, marginTop: 6 }}>25,451</div>
              <div className="mt-1 text-[12px]">
                <span style={{ color: 'hsl(142 60% 28%)' }}>↑ 4.2%</span>
                <span className="rl-muted"> vs 1h</span>
              </div>
            </div>
            <div className="rl-stat" style={{ padding: 14 }}>
              <div className="flex items-center justify-between">
                <span className="rl-muted text-[12px]">磁盘使用</span>
                <HardDrive size={13} className="rl-muted" />
              </div>
              <div className="value rl-tabular" style={{ fontSize: 22, marginTop: 6 }}>42%</div>
              <div className="rl-progress mt-2"><div className="bar" style={{ width: '42%' }} /></div>
            </div>
            <div className="rl-stat" style={{ padding: 14 }}>
              <div className="flex items-center justify-between">
                <span className="rl-muted text-[12px]">消息积压</span>
                <Inbox size={13} className="rl-muted" />
              </div>
              <div className="value rl-tabular" style={{ fontSize: 22, marginTop: 6 }}>15.1k</div>
              <div className="mt-1 text-[12px]">
                <span style={{ color: 'hsl(var(--destructive))' }}>3 个 Group 异常</span>
              </div>
            </div>
          </div>

          {/* Throughput chart */}
          <div className="rl-section-label" style={{ marginTop: 24 }}>吞吐趋势 · 最近 60 分钟</div>
          <div className="rl-card" style={{ padding: 16 }}>
            <div className="mb-3 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span style={{ width: 8, height: 8, borderRadius: 2, background: 'hsl(142 50% 38%)' }} />
                <span className="text-[12px]">生产</span>
              </div>
              <div className="flex items-center gap-2">
                <span style={{ width: 8, height: 8, borderRadius: 2, background: 'hsl(217 80% 50%)' }} />
                <span className="text-[12px]">消费</span>
              </div>
              <div className="ml-auto">
                <div className="rl-tabs">
                  <button className="tab active">1h</button>
                  <button className="tab">6h</button>
                  <button className="tab">24h</button>
                </div>
              </div>
            </div>
            <svg viewBox="0 0 800 200" preserveAspectRatio="none" style={{ width: '100%', height: 200 }}>
              {[40, 80, 120, 160].map((y) => (
                <line key={y} x1={0} y1={y} x2={800} y2={y} stroke="hsl(var(--border))" strokeDasharray="3 3" />
              ))}
              <polyline points={prodPoints} fill="none" stroke="hsl(142 50% 38%)" strokeWidth={1.5} />
              <polyline points={consPoints} fill="none" stroke="hsl(217 80% 50%)" strokeWidth={1.5} />
            </svg>
          </div>

          {/* Brokers */}
          <div className="rl-section-label" style={{ marginTop: 24 }}>Broker 列表</div>
          <div className="rl-card overflow-hidden">
            <table className="rl-table">
              <thead>
                <tr>
                  <th>Broker</th>
                  <th>角色</th>
                  <th>地址</th>
                  <th>版本</th>
                  <th style={{ textAlign: 'right' }}>TPS (P/C)</th>
                  <th style={{ width: 200 }}>磁盘</th>
                  <th style={{ width: 100 }}>状态</th>
                </tr>
              </thead>
              <tbody>
                {BROKERS.map((b) => (
                  <tr key={b.name}>
                    <td><div className="font-mono-design">{b.name}</div></td>
                    <td>
                      <span className={'rl-badge ' + (b.role === 'MASTER' ? 'rl-badge-info' : 'rl-badge-outline')}>
                        {b.role}
                      </span>
                    </td>
                    <td><span className="font-mono-design rl-muted text-[12px]">{b.addr}</span></td>
                    <td><span className="rl-muted text-[12px]">{b.ver}</span></td>
                    <td style={{ textAlign: 'right' }} className="font-mono-design text-[12px]">{b.tps}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="rl-progress flex-1" style={{ maxWidth: 120 }}>
                          <div className="bar" style={{ width: b.disk + '%' }} />
                        </div>
                        <span className="rl-tabular rl-muted text-[12px]">{b.disk}%</span>
                      </div>
                    </td>
                    <td><span className="rl-badge rl-badge-success">在线</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
