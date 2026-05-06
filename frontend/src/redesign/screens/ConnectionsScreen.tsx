import {
  Search,
  Plus,
  Server,
  Check,
  Unlink,
  MoreHorizontal,
  Wifi,
  Trash2,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '../shell'

const CONNS = [
  { name: 'prod-cluster-01', env: 'PROD', host: '10.20.30.41:9876;10.20.30.42:9876', status: 'online', default: true, desc: '生产集群（北京）' },
  { name: 'staging-cluster', env: 'STAGING', host: '10.50.0.11:9876', status: 'offline', default: false, desc: '预发布环境' },
  { name: 'dev-local', env: 'DEV', host: '127.0.0.1:9876', status: 'offline', default: false, desc: '本地开发' },
  { name: 'shanghai-dr', env: 'PROD', host: '10.21.10.5:9876;10.21.10.6:9876', status: 'offline', default: false, desc: '灾备集群（上海）' },
]

export function ConnectionsScreen() {
  const { t } = useTranslation()
  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHeader title={t('connections.title')} subtitle="本地保存 · 4 个连接配置">
        <div className="rl-search-input" style={{ width: 220 }}>
          <span className="icon"><Search size={14} /></span>
          <input className="rl-input" placeholder={t('common.search')} />
        </div>
        <button className="rl-btn rl-btn-primary rl-btn-sm">
          <Plus size={13} />{t('common.create')}
        </button>
      </PageHeader>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* List */}
        <div
          className="scroll-thin"
          style={{
            width: 380,
            borderRight: '1px solid hsl(var(--border))',
            overflow: 'auto',
            background: 'hsl(var(--background))',
          }}
        >
          {CONNS.map((c, i) => (
            <div
              key={c.name}
              className={'flex items-center gap-3 ' + (i === 0 ? 'selected' : '')}
              style={{
                padding: '14px 16px',
                borderBottom: '1px solid hsl(var(--border))',
                background: i === 0 ? 'hsl(var(--accent))' : 'transparent',
                cursor: 'pointer',
                borderLeft: i === 0 ? '2px solid hsl(var(--foreground))' : '2px solid transparent',
              }}
            >
              <div
                className="rl-conn-icon"
                style={{
                  width: 32, height: 32,
                  background: c.status === 'online' ? 'hsl(142 50% 38% / 0.1)' : 'hsl(var(--muted))',
                  color: c.status === 'online' ? 'hsl(142 60% 28%)' : 'hsl(var(--muted-foreground))',
                }}
              >
                <Server size={15} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-medium truncate">{c.name}</span>
                  {c.default && <Check size={11} className="rl-muted" />}
                </div>
                <div className="font-mono-design rl-muted mt-1 text-[12px] truncate">
                  {c.host.split(';')[0]}
                </div>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="rl-badge rl-badge-outline" style={{ height: 18, fontSize: 10 }}>{c.env}</span>
                {c.status === 'online' ? (
                  <span style={{ width: 6, height: 6, borderRadius: 999, background: 'hsl(var(--success))' }} />
                ) : (
                  <span style={{ width: 6, height: 6, borderRadius: 999, background: 'hsl(var(--border))' }} />
                )}
              </div>
            </div>
          ))}
          <div style={{ padding: 12, borderBottom: '1px solid hsl(var(--border))' }}>
            <button
              className="rl-btn rl-btn-outline rl-btn-sm"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <Plus size={13} />添加连接
            </button>
          </div>
        </div>

        {/* Detail */}
        <div className="scroll-thin min-w-0 flex-1 overflow-auto" style={{ padding: 24 }}>
          <div style={{ maxWidth: 640 }}>
            <div className="mb-2 flex items-center gap-3">
              <div
                className="rl-conn-icon"
                style={{
                  width: 44, height: 44,
                  background: 'hsl(142 50% 38% / 0.1)', color: 'hsl(142 60% 28%)',
                }}
              >
                <Server size={20} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[16px] font-semibold">prod-cluster-01</span>
                  <span className="rl-badge rl-badge-success">
                    <span style={{ width: 5, height: 5, borderRadius: 999, background: 'currentColor' }} />已连接
                  </span>
                  <span className="rl-badge"><Check size={10} />默认</span>
                </div>
                <div className="rl-muted mt-1 text-[12px]">生产集群（北京）· 已连接 2h 14m</div>
              </div>
              <div className="flex gap-2">
                <button className="rl-btn rl-btn-outline rl-btn-sm"><Unlink size={13} />断开</button>
                <button className="rl-btn rl-btn-outline rl-btn-icon rl-btn-sm"><MoreHorizontal size={14} /></button>
              </div>
            </div>

            <div className="grid mt-4 gap-2.5" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              <div className="rl-card" style={{ padding: 12 }}>
                <div className="rl-muted text-[12px]">RocketMQ 版本</div>
                <div className="mt-1 font-medium">5.3.0</div>
              </div>
              <div className="rl-card" style={{ padding: 12 }}>
                <div className="rl-muted text-[12px]">Broker 数量</div>
                <div className="rl-tabular mt-1 font-medium">8</div>
              </div>
              <div className="rl-card" style={{ padding: 12 }}>
                <div className="rl-muted text-[12px]">延迟</div>
                <div className="rl-tabular mt-1 font-medium">12 ms</div>
              </div>
            </div>

            <div className="rl-section-label" style={{ marginTop: 24 }}>连接配置</div>
            <div className="rl-card" style={{ padding: 20 }}>
              <div className="grid gap-3.5" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div>
                  <div className="rl-muted mb-2 text-[12px]">名称</div>
                  <input className="rl-input" defaultValue="prod-cluster-01" />
                </div>
                <div>
                  <div className="rl-muted mb-2 text-[12px]">环境</div>
                  <select className="rl-select" defaultValue="PROD">
                    <option>PROD</option>
                    <option>STAGING</option>
                    <option>DEV</option>
                  </select>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <div className="rl-muted mb-2 text-[12px]">
                    NameServer 地址 <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
                  </div>
                  <input
                    className="rl-input font-mono-design"
                    defaultValue="10.20.30.41:9876;10.20.30.42:9876"
                  />
                </div>
                <div>
                  <div className="rl-muted mb-2 text-[12px]">AccessKey <span className="rl-muted">(可选)</span></div>
                  <input className="rl-input font-mono-design" defaultValue="rocketmq-admin" />
                </div>
                <div>
                  <div className="rl-muted mb-2 text-[12px]">SecretKey</div>
                  <input
                    className="rl-input font-mono-design"
                    type="password"
                    defaultValue="abcdefghijklmnop"
                  />
                </div>
                <div>
                  <div className="rl-muted mb-2 text-[12px]">连接超时</div>
                  <div className="flex items-center gap-2">
                    <input className="rl-input" defaultValue="3000" />
                    <span className="rl-muted text-[12px]">ms</span>
                  </div>
                </div>
                <div>
                  <div className="rl-muted mb-2 text-[12px]">命名空间 <span className="rl-muted">(可选)</span></div>
                  <input className="rl-input font-mono-design" placeholder="" />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <div className="rl-muted mb-2 text-[12px]">备注</div>
                  <input className="rl-input" defaultValue="生产集群（北京）" />
                </div>
              </div>
              <div
                className="mt-5 flex gap-2"
                style={{ paddingTop: 16, borderTop: '1px solid hsl(var(--border))' }}
              >
                <button className="rl-btn rl-btn-outline rl-btn-sm"><Wifi size={13} />测试连接</button>
                <button
                  className="rl-btn rl-btn-ghost rl-btn-sm"
                  style={{ marginLeft: 'auto', color: 'hsl(var(--destructive))' }}
                >
                  <Trash2 size={13} />删除连接
                </button>
                <button className="rl-btn rl-btn-primary rl-btn-sm"><Check size={13} />保存修改</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
