import { useState } from 'react'
import { History, Plus, MoreHorizontal } from 'lucide-react'
import { PageHeader } from '../shell'

const RULES = [
  { name: '消息堆积告警', target: 'order-consumer-group', cond: 'lag > 1,000 持续 5m', channel: '钉钉 · #ops', enabled: true, fired: 2 },
  { name: '消费者下线', target: '* (全部)', cond: '在线实例 < 1', channel: 'PagerDuty · oncall', enabled: true, fired: 0 },
  { name: 'Broker 离线', target: 'broker-2-master', cond: '状态 != online', channel: '邮件 · ops@', enabled: true, fired: 0 },
  { name: 'TPS 突降', target: 'payment-events', cond: '比同比 -50%', channel: '钉钉 · #payments', enabled: false, fired: 0 },
  { name: '死信激增', target: '* (全部)', cond: 'DLQ +50/min', channel: 'Slack · #alerts', enabled: true, fired: 1 },
]

const FIRES: { t: string; level: 'crit' | 'warn' | 'info'; rule: string; text: string }[] = [
  { t: '10:18', level: 'warn', rule: '消息堆积告警', text: 'audit-consumer 堆积 1,432，已持续 7 分钟' },
  { t: '09:42', level: 'info', rule: '死信激增', text: 'payment-consumer 新增 12 条死信' },
  { t: '08:30', level: 'warn', rule: '消息堆积告警', text: 'audit-consumer 堆积 1,083，已持续 5 分钟' },
  { t: '昨天', level: 'crit', rule: 'Broker 离线', text: 'broker-3-slave 心跳超时（已自动恢复）' },
]

export function AlertsScreen() {
  const [activeTab, setActiveTab] = useState('规则')

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHeader
        title="监控告警"
        subtitle="3 条规则启用 · 近 24h 触发 3 次"
        tabs={['规则', '近期触发', '通知渠道']}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      >
        <button className="rl-btn rl-btn-ghost rl-btn-sm"><History size={13} />历史</button>
        <button className="rl-btn rl-btn-primary rl-btn-sm"><Plus size={13} />新建规则</button>
      </PageHeader>

      <div className="scroll-thin min-h-0 flex-1 overflow-auto" style={{ padding: 20 }}>
        <div className="grid items-start gap-3.5" style={{ gridTemplateColumns: '1fr 360px' }}>
          <div className="rl-card" style={{ padding: 0 }}>
            <table className="rl-table">
              <thead>
                <tr>
                  <th>规则</th>
                  <th>对象</th>
                  <th>条件</th>
                  <th>通知</th>
                  <th>近 24h</th>
                  <th>启用</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {RULES.map((r) => (
                  <tr key={r.name}>
                    <td className="font-medium">{r.name}</td>
                    <td className="rl-muted text-[12px]">{r.target}</td>
                    <td className="font-mono-design text-[12px]">{r.cond}</td>
                    <td className="text-[12px]">{r.channel}</td>
                    <td>
                      {r.fired > 0 ? (
                        <span className="rl-badge rl-badge-warn">{r.fired} 次</span>
                      ) : (
                        <span className="rl-muted text-[12px]">—</span>
                      )}
                    </td>
                    <td>
                      <div
                        style={{
                          width: 28,
                          height: 16,
                          borderRadius: 999,
                          background: r.enabled ? 'hsl(var(--foreground))' : 'hsl(var(--border))',
                          position: 'relative',
                          display: 'inline-block',
                        }}
                      >
                        <div
                          style={{
                            position: 'absolute',
                            width: 12,
                            height: 12,
                            borderRadius: 999,
                            background: 'white',
                            top: 2,
                            left: r.enabled ? 14 : 2,
                            transition: 'left .15s',
                          }}
                        />
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="rl-btn rl-btn-ghost rl-btn-icon rl-btn-sm">
                        <MoreHorizontal size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rl-card" style={{ padding: 16 }}>
            <div className="mb-3 flex items-center justify-between">
              <div className="text-[13px] font-medium">近期触发</div>
              <span className="rl-badge rl-badge-outline">{FIRES.length}</span>
            </div>
            {FIRES.map((f, i) => (
              <div
                key={i}
                style={{ padding: '8px 0', borderTop: i ? '1px solid hsl(var(--border))' : 'none' }}
              >
                <div className="flex items-center gap-2">
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 999,
                      background:
                        f.level === 'crit'
                          ? 'hsl(var(--destructive))'
                          : f.level === 'warn'
                          ? 'hsl(38 92% 50%)'
                          : 'hsl(217 80% 50%)',
                    }}
                  />
                  <span className="text-[13px] font-medium">{f.rule}</span>
                  <span className="flex-1" />
                  <span className="font-mono-design rl-muted rl-tabular text-[12px]">{f.t}</span>
                </div>
                <div className="rl-muted mt-1 text-[12px]" style={{ lineHeight: 1.5 }}>
                  {f.text}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
