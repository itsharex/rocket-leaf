import { useMemo } from 'react'
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
  Loader2,
  PlugZap,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type {
  BrokerNode,
  ConsumerGroupItem,
  TopicItem,
} from '../../../bindings/rocket-leaf/internal/model/models.js'
import { PageHeader } from '../shell'
import { useOverview, type OverviewSnapshot } from '@/hooks/useOverview'
import { useSettings } from '@/hooks/useSettings'
import * as connectionApi from '@/api/connection'
import { toast } from 'sonner'
import type { NavId } from '../Sidebar'

const HISTORY_BUCKETS = 60

// ---------- helpers ----------

function formatTps(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return '0'
  if (n >= 10000) return `${(n / 1000).toFixed(1)}k`
  if (n >= 1000) return `${(n / 1000).toFixed(2)}k`
  return String(Math.round(n))
}

function formatLag(n: number): string {
  if (n >= 10000) return `${(n / 1000).toFixed(1)}k`
  return n.toLocaleString()
}

function formatTime(d: Date | null): string {
  if (!d) return '—'
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
}

function aggregateHistory(brokers: BrokerNode[], field: 'tpsInHistory' | 'tpsOutHistory'): number[] {
  // Use the longest history available; sum each index across brokers.
  const histories = brokers
    .map((b) => (b[field] ?? []) as number[])
    .filter((h) => Array.isArray(h) && h.length > 0)
  if (histories.length === 0) return []
  const len = Math.min(HISTORY_BUCKETS, Math.max(...histories.map((h) => h.length)))
  const out = new Array<number>(len).fill(0)
  for (const h of histories) {
    const offset = Math.max(0, h.length - len)
    for (let i = 0; i < len; i++) {
      out[i] = (out[i] ?? 0) + (h[offset + i] ?? 0)
    }
  }
  return out
}

interface AIFinding {
  key: string
  severity: 'high' | 'med' | 'low'
  title: string
  desc: React.ReactNode
}

function buildFindings(
  data: OverviewSnapshot,
  lagThreshold: number,
  t: (key: string, opts?: Record<string, unknown>) => string,
): AIFinding[] {
  const findings: AIFinding[] = []
  const effectiveThreshold = Math.max(1, lagThreshold)

  // Offline brokers — high
  const offlineBrokers = data.brokers.filter((b) => b.status === 'offline')
  for (const b of offlineBrokers.slice(0, 2)) {
    findings.push({
      key: `broker-off-${b.brokerName}`,
      severity: 'high',
      title: t('overview.ai.findings.brokerOfflineTitle', { broker: b.brokerName }),
      desc: t('overview.ai.findings.brokerOfflineDesc'),
    })
  }

  // Consumer groups: heavy lag w/o instances OR heavy lag with instances
  const sortedGroupsByLag = [...data.consumerGroups].sort(
    (a, b) => Number(b.lag ?? 0) - Number(a.lag ?? 0),
  )
  const noInstance = sortedGroupsByLag.find(
    (g) => Number(g.lag ?? 0) > effectiveThreshold && (g.onlineClients ?? 0) === 0,
  )
  if (noInstance) {
    findings.push({
      key: `group-off-${noInstance.group}`,
      severity: 'high',
      title: t('overview.ai.findings.offlineGroupTitle', { group: noInstance.group }),
      desc: t('overview.ai.findings.offlineGroupDesc', { lag: Number(noInstance.lag).toLocaleString() }),
    })
  }
  const withInstance = sortedGroupsByLag.find(
    (g) =>
      Number(g.lag ?? 0) > effectiveThreshold &&
      (g.onlineClients ?? 0) > 0 &&
      g.group !== noInstance?.group,
  )
  if (withInstance) {
    findings.push({
      key: `group-lag-${withInstance.group}`,
      severity: 'high',
      title: t('overview.ai.findings.highLagTitle', {
        group: withInstance.group,
        lag: Number(withInstance.lag).toLocaleString(),
      }),
      desc: t('overview.ai.findings.highLagDesc', { threshold: effectiveThreshold.toLocaleString() }),
    })
  }

  // Disk usage warning — med
  const heavyDisk = [...data.brokers]
    .filter((b) => Number((b as unknown as { diskUsage?: number }).diskUsage ?? 0) >= 75)
    .sort(
      (a, b) =>
        Number((b as unknown as { diskUsage?: number }).diskUsage ?? 0) -
        Number((a as unknown as { diskUsage?: number }).diskUsage ?? 0),
    )[0]
  if (heavyDisk) {
    const usage = Number((heavyDisk as unknown as { diskUsage?: number }).diskUsage ?? 0)
    findings.push({
      key: `disk-${heavyDisk.brokerName}`,
      severity: 'med',
      title: t('overview.ai.findings.diskTitle', { broker: heavyDisk.brokerName, usage }),
      desc: t('overview.ai.findings.diskDesc'),
    })
  }

  // Idle topics — low (no inbound and no consumers in a while)
  const idleTopics = data.topics.filter(
    (tp) => (tp.tpsIn ?? 0) === 0 && (tp.consumerGroups ?? 0) === 0,
  )
  if (idleTopics.length >= 3) {
    const sample = idleTopics.slice(0, 3).map((tp) => tp.topic)
    findings.push({
      key: 'idle-topics',
      severity: 'low',
      title: t('overview.ai.findings.idleTopicTitle', { count: idleTopics.length }),
      desc: t('overview.ai.findings.idleTopicDesc', { names: sample.join('、') }),
    })
  }

  return findings.slice(0, 4)
}

// ---------- main component ----------

interface OverviewScreenProps {
  onNavigate?: (id: NavId) => void
}

export function OverviewScreen({ onNavigate }: OverviewScreenProps) {
  const { t } = useTranslation()
  const { data, loading, refreshing, error, refresh } = useOverview()
  const { settings } = useSettings()
  const lagThreshold = settings.lagAlertThreshold || 10000

  const cluster = data.cluster
  const conn = data.activeConnection

  const totalLag = useMemo(
    () => data.consumerGroups.reduce((s, g) => s + Number(g.lag ?? 0), 0),
    [data.consumerGroups],
  )

  const onlineGroups = useMemo(
    () => data.consumerGroups.filter((g) => (g.onlineClients ?? 0) > 0).length,
    [data.consumerGroups],
  )

  const onlineBrokerCount = data.brokers.filter((b) => b.status === 'online').length
  const totalBrokerCount = data.brokers.length || cluster?.totalBrokers || 0
  const masterCount = data.brokers.filter((b) => String(b.role).toUpperCase() === 'MASTER').length
  const slaveCount = data.brokers.filter((b) => String(b.role).toUpperCase() === 'SLAVE').length

  const activeTopics = useMemo<TopicItem[]>(
    () =>
      [...data.topics]
        .filter((tp) => (tp.tpsIn ?? 0) > 0)
        .sort((a, b) => (b.tpsIn ?? 0) - (a.tpsIn ?? 0))
        .slice(0, 5),
    [data.topics],
  )
  const maxTopicTps = activeTopics[0]?.tpsIn ?? 0

  const lagAlerts = useMemo<ConsumerGroupItem[]>(
    () =>
      [...data.consumerGroups]
        .filter((g) => Number(g.lag ?? 0) > lagThreshold)
        .sort((a, b) => Number(b.lag ?? 0) - Number(a.lag ?? 0))
        .slice(0, 5),
    [data.consumerGroups, lagThreshold],
  )

  const findings = useMemo(() => buildFindings(data, lagThreshold, t), [data, lagThreshold, t])

  const tpsInSeries = useMemo(() => aggregateHistory(data.brokers, 'tpsInHistory'), [data.brokers])
  const tpsOutSeries = useMemo(() => aggregateHistory(data.brokers, 'tpsOutHistory'), [data.brokers])
  const currentTpsIn = data.brokers.reduce((s, b) => s + (b.tpsIn ?? 0), 0)
  const currentTpsOut = data.brokers.reduce((s, b) => s + (b.tpsOut ?? 0), 0)

  const handleDisconnect = async () => {
    if (!conn) return
    try {
      await connectionApi.disconnect(conn.id)
      toast.success(t('common.disconnect') + ' ✓')
      await refresh()
    } catch (e) {
      toast.error((e as Error).message ?? String(e))
    }
  }

  const handleRefresh = () => void refresh()

  const subtitle = conn
    ? t('overview.subtitleConnected', { cluster: conn.name, time: formatTime(data.lastUpdated) })
    : t('overview.subtitleNoConn')

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHeader title={t('overview.title')} subtitle={subtitle}>
        <button
          className="rl-btn rl-btn-ghost rl-btn-sm"
          onClick={handleRefresh}
          disabled={refreshing}
          title={t('common.refresh')}
        >
          {refreshing ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
          {t('common.refresh')}
        </button>
        {conn && (
          <button className="rl-btn rl-btn-outline rl-btn-sm" onClick={handleDisconnect}>
            <Unlink size={13} />{t('common.disconnect')}
          </button>
        )}
      </PageHeader>

      <div className="scroll-thin min-h-0 flex-1 overflow-auto p-5">
        {error && conn && (
          <div
            className="rl-card mb-4 flex items-center gap-2"
            style={{
              padding: '10px 14px',
              background: 'hsl(0 84% 96%)',
              color: 'hsl(0 70% 35%)',
              borderColor: 'hsl(0 84% 80%)',
            }}
          >
            <AlertCircle size={14} />
            <span className="text-[12px]">{t('overview.loadError', { message: error })}</span>
          </div>
        )}
        <div className="grid items-start gap-4" style={{ gridTemplateColumns: '1fr 320px' }}>
          {/* LEFT */}
          <div className="flex flex-col gap-4">
            <AIDiagnoseCard findings={findings} loading={loading} onRefresh={handleRefresh} />

            {/* KPI strip */}
            <div className="grid gap-2.5" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
              <KpiStat
                label={t('overview.stat.topics')}
                value={(cluster?.totalTopics ?? data.topics.length).toLocaleString()}
                sub={t('overview.stat.topicSummary', { active: activeTopics.length })}
                icon={LayoutGrid}
              />
              <KpiStat
                label={t('overview.stat.consumers')}
                value={(cluster?.totalGroups ?? data.consumerGroups.length).toLocaleString()}
                sub={t('overview.stat.consumersSummary', {
                  online: onlineGroups,
                  offline: data.consumerGroups.length - onlineGroups,
                })}
                icon={Users}
              />
              <KpiStat
                label={t('overview.stat.broker')}
                value={`${onlineBrokerCount} / ${totalBrokerCount || onlineBrokerCount}`}
                sub={
                  onlineBrokerCount === totalBrokerCount && totalBrokerCount > 0
                    ? t('overview.stat.brokerSummary_all', { master: masterCount, slave: slaveCount })
                    : t('overview.stat.brokerSummary_partial', {
                        online: onlineBrokerCount,
                        total: totalBrokerCount,
                      })
                }
                icon={Server}
              />
              <KpiStat
                label={t('overview.stat.lag')}
                value={formatLag(totalLag)}
                sub={
                  lagAlerts.length === 0
                    ? t('overview.stat.lagSummary_zero')
                    : t('overview.stat.lagSummary', { count: lagAlerts.length })
                }
                icon={Inbox}
              />
            </div>

            {/* Throughput chart */}
            <ThroughputCard
              prod={tpsInSeries}
              cons={tpsOutSeries}
              currentIn={currentTpsIn}
              currentOut={currentTpsOut}
            />

            {/* Two-col cards */}
            <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <ActiveTopicsCard topics={activeTopics} maxTps={maxTopicTps} />
              <LagAlertsCard
                alerts={lagAlerts}
                threshold={lagThreshold}
                totalGroups={data.consumerGroups.length}
              />
            </div>
          </div>

          {/* RIGHT */}
          <div className="flex flex-col gap-4">
            <CurrentConnectionCard conn={conn} cluster={cluster} onNavigate={onNavigate} />
            <BrokerStatusCard brokers={data.brokers} />
            <QuickActionsCard onNavigate={onNavigate} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------- subcomponents ----------

function KpiStat({
  label,
  value,
  sub,
  icon: Icon,
}: {
  label: string
  value: string
  sub: string
  icon: typeof LayoutGrid
}) {
  return (
    <div className="rl-stat" style={{ padding: 14 }}>
      <div className="flex items-center justify-between">
        <span className="rl-muted text-[12px]">{label}</span>
        <Icon size={14} className="rl-muted" />
      </div>
      <div className="value" style={{ fontSize: 24, marginTop: 6 }}>{value}</div>
      <div className="rl-muted mt-1 text-[12px]">{sub}</div>
    </div>
  )
}

function ThroughputCard({
  prod,
  cons,
  currentIn,
  currentOut,
}: {
  prod: number[]
  cons: number[]
  currentIn: number
  currentOut: number
}) {
  const { t } = useTranslation()
  const hasData = prod.length > 0 || cons.length > 0
  const peak = Math.max(...prod, ...cons, 1)
  const len = Math.max(prod.length, cons.length, 1)
  const x = (i: number) => (i / Math.max(len - 1, 1)) * 800
  const y = (v: number) => 200 - (v / peak) * 180 - 10
  const lineFor = (series: number[]) => series.map((v, i) => `${x(i)},${y(v)}`).join(' ')
  const polyFor = (series: number[]) => `0,200 ${lineFor(series)} ${x(series.length - 1)},200`
  return (
    <div className="rl-card" style={{ padding: 16 }}>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="text-[13px] font-medium">{t('overview.throughput.title')}</div>
          <div className="rl-muted mt-1 text-[12px]">{t('overview.throughput.subtitle')}</div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span style={{ width: 8, height: 8, borderRadius: 2, background: 'hsl(142 50% 38%)' }} />
            <span className="rl-muted text-[12px]">{t('overview.throughput.produce')}</span>
            <span className="font-mono-design rl-tabular text-[12px]">{formatTps(currentIn)}/s</span>
          </div>
          <div className="flex items-center gap-2">
            <span style={{ width: 8, height: 8, borderRadius: 2, background: 'hsl(217 80% 50%)' }} />
            <span className="rl-muted text-[12px]">{t('overview.throughput.consume')}</span>
            <span className="font-mono-design rl-tabular text-[12px]">{formatTps(currentOut)}/s</span>
          </div>
        </div>
      </div>
      {hasData ? (
        <svg viewBox="0 0 800 200" preserveAspectRatio="none" style={{ width: '100%', height: 180 }}>
          {[40, 80, 120, 160].map((yy) => (
            <line key={yy} x1={0} y1={yy} x2={800} y2={yy} stroke="hsl(var(--border))" strokeDasharray="3 3" />
          ))}
          {prod.length > 0 && (
            <>
              <polygon points={polyFor(prod)} fill="hsl(142 50% 38%)" opacity={0.06} />
              <polyline points={lineFor(prod)} fill="none" stroke="hsl(142 50% 38%)" strokeWidth={1.5} />
            </>
          )}
          {cons.length > 0 && (
            <polyline points={lineFor(cons)} fill="none" stroke="hsl(217 80% 50%)" strokeWidth={1.5} />
          )}
        </svg>
      ) : (
        <div
          className="rl-muted flex items-center justify-center text-[12px]"
          style={{ height: 180 }}
        >
          {t('overview.throughput.noData')}
        </div>
      )}
    </div>
  )
}

function ActiveTopicsCard({ topics, maxTps }: { topics: TopicItem[]; maxTps: number }) {
  const { t } = useTranslation()
  return (
    <div className="rl-card overflow-hidden">
      <div className="flex items-center justify-between p-4 pb-3">
        <div>
          <div className="text-[13px] font-medium">{t('overview.active.title')}</div>
          <div className="rl-muted mt-1 text-[12px]">{t('overview.active.subtitle')}</div>
        </div>
        <span className="rl-muted text-[12px]">{t('common.viewAll')} →</span>
      </div>
      <div style={{ borderTop: '1px solid hsl(var(--border))' }}>
        {topics.length === 0 ? (
          <div className="rl-muted text-[12px]" style={{ padding: '14px 16px' }}>
            {t('overview.active.empty')}
          </div>
        ) : (
          topics.map((topic, i) => {
            const tps = topic.tpsIn ?? 0
            const pct = maxTps > 0 ? Math.max(2, Math.round((tps / maxTps) * 100)) : 0
            return (
              <div
                key={topic.topic}
                className="flex items-center gap-3"
                style={{
                  padding: '10px 16px',
                  borderTop: i ? '1px solid hsl(var(--border))' : undefined,
                }}
              >
                <Tag size={12} className="rl-muted" />
                <span className="font-mono-design text-[12px] flex-1 truncate">{topic.topic}</span>
                <div className="rl-progress" style={{ width: 80 }}>
                  <div className="bar" style={{ width: pct + '%', background: 'hsl(217 60% 55%)' }} />
                </div>
                <span
                  className="font-mono-design rl-tabular rl-muted text-[12px]"
                  style={{ width: 70, textAlign: 'right' }}
                >
                  {formatTps(tps)}/s
                </span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

function LagAlertsCard({
  alerts,
  threshold,
  totalGroups,
}: {
  alerts: ConsumerGroupItem[]
  threshold: number
  totalGroups: number
}) {
  const { t } = useTranslation()
  const others = Math.max(0, totalGroups - alerts.length)
  return (
    <div className="rl-card overflow-hidden">
      <div className="flex items-center justify-between p-4 pb-3">
        <div>
          <div className="text-[13px] font-medium">{t('overview.lag.title')}</div>
          <div className="rl-muted mt-1 text-[12px]">
            {t('overview.lag.subtitle', { threshold: threshold.toLocaleString() })}
          </div>
        </div>
        {alerts.length > 0 && <span className="rl-badge rl-badge-danger">{alerts.length}</span>}
      </div>
      <div style={{ borderTop: '1px solid hsl(var(--border))' }}>
        {alerts.length === 0 ? (
          <div className="rl-muted text-[12px]" style={{ padding: '14px 16px' }}>
            {t('overview.lag.empty')}
          </div>
        ) : (
          alerts.map((g, i) => {
            const lag = Number(g.lag ?? 0)
            const danger = lag > threshold * 5
            return (
              <div
                key={g.group}
                className="flex items-center gap-3"
                style={{ padding: '10px 16px', borderTop: i ? '1px solid hsl(var(--border))' : undefined }}
              >
                <AlertCircle
                  size={13}
                  style={{ color: danger ? 'hsl(var(--destructive))' : 'hsl(28 80% 45%)' }}
                />
                <span className="font-mono-design text-[12px] flex-1 truncate">{g.group}</span>
                <span className={'rl-badge ' + (danger ? 'rl-badge-danger' : 'rl-badge-warn')}>
                  +{lag.toLocaleString()}
                </span>
              </div>
            )
          })
        )}
        {alerts.length > 0 && (
          <div
            className="flex items-center gap-3 rl-muted"
            style={{ padding: '10px 16px', borderTop: '1px solid hsl(var(--border))' }}
          >
            <span className="text-[12px]">{t('overview.lag.rest', { count: others })}</span>
          </div>
        )}
      </div>
    </div>
  )
}

function CurrentConnectionCard({
  conn,
  cluster,
  onNavigate,
}: {
  conn: { name: string; nameServer: string; env: string } | null
  cluster: { clusterName: string } | null
  onNavigate?: (id: NavId) => void
}) {
  const { t } = useTranslation()
  if (!conn) {
    return (
      <div className="rl-card" style={{ padding: 16 }}>
        <div className="rl-muted text-[12px]">{t('overview.current.title')}</div>
        <div className="mt-3 flex items-center gap-2">
          <PlugZap size={14} className="rl-muted" />
          <span className="text-[13px]">{t('overview.current.noConnection')}</span>
        </div>
        <button
          className="rl-btn rl-btn-outline rl-btn-sm mt-3"
          style={{ width: '100%', justifyContent: 'center' }}
          onClick={() => onNavigate?.('connections')}
        >
          {t('overview.current.goToConnections')}
        </button>
      </div>
    )
  }
  const addrs = conn.nameServer.split(/[;,\s]+/).filter(Boolean)
  return (
    <div className="rl-card" style={{ padding: 16 }}>
      <div className="rl-muted text-[12px]">{t('overview.current.title')}</div>
      <div className="mt-2 flex items-center gap-2">
        <span className="font-medium">{conn.name}</span>
        <span className="rl-badge rl-badge-success">
          <span style={{ width: 5, height: 5, borderRadius: 999, background: 'currentColor' }} />
          {t('common.connected')}
        </span>
      </div>
      <div
        className="font-mono-design rl-muted mt-2 text-[12px]"
        style={{ wordBreak: 'break-all', lineHeight: 1.6 }}
      >
        {addrs.map((a, i) => (
          <div key={i}>{a}</div>
        ))}
      </div>
      <div
        className="mt-3 flex flex-wrap gap-2"
        style={{ paddingTop: 12, borderTop: '1px dashed hsl(var(--border))' }}
      >
        {conn.env && <span className="rl-badge rl-badge-outline">{conn.env}</span>}
        {cluster?.clusterName && (
          <span className="rl-badge rl-badge-outline">{cluster.clusterName}</span>
        )}
      </div>
    </div>
  )
}

function BrokerStatusCard({ brokers }: { brokers: BrokerNode[] }) {
  const { t } = useTranslation()
  const online = brokers.filter((b) => b.status === 'online').length
  const subtitle =
    brokers.length === 0
      ? ''
      : online === brokers.length
        ? t('overview.broker.subtitle', { count: brokers.length })
        : t('overview.broker.subtitle_partial', { online, total: brokers.length })
  const sortedBrokers = [...brokers]
    .sort((a, b) => a.brokerName.localeCompare(b.brokerName) || a.brokerId - b.brokerId)
    .slice(0, 6)
  return (
    <div className="rl-card overflow-hidden">
      <div className="p-4 pb-3">
        <div className="text-[13px] font-medium">{t('overview.broker.title')}</div>
        {subtitle && <div className="rl-muted mt-1 text-[12px]">{subtitle}</div>}
      </div>
      <div style={{ borderTop: '1px solid hsl(var(--border))' }}>
        {sortedBrokers.length === 0 ? (
          <div className="rl-muted text-[12px]" style={{ padding: '14px 16px' }}>
            {t('overview.broker.empty')}
          </div>
        ) : (
          sortedBrokers.map((b, i) => {
            const isOnline = b.status === 'online'
            const role = (b.role || '').toString().toUpperCase()
            const label = `${b.brokerName}${b.brokerId !== 0 ? `-${b.brokerId}` : ''}`
            const usage = Number((b as unknown as { diskUsage?: number }).diskUsage ?? 0)
            return (
              <div
                key={`${b.brokerName}-${b.brokerId}`}
                className="flex items-center gap-2"
                style={{ padding: '8px 16px', borderTop: i ? '1px solid hsl(var(--border))' : undefined }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 999,
                    background: isOnline ? 'hsl(var(--success))' : 'hsl(var(--destructive))',
                    flexShrink: 0,
                  }}
                />
                <span className="font-mono-design text-[12px] flex-1 truncate">{label}</span>
                {role && (
                  <span className="rl-badge rl-badge-outline" style={{ height: 18, fontSize: 10 }}>
                    {role.startsWith('M') ? 'M' : 'S'}
                  </span>
                )}
                {usage > 0 && (
                  <span
                    className="font-mono-design rl-tabular rl-muted text-[12px]"
                    style={{ width: 40, textAlign: 'right' }}
                  >
                    {usage}%
                  </span>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

function QuickActionsCard({ onNavigate }: { onNavigate?: (id: NavId) => void }) {
  const { t } = useTranslation()
  const actions: { icon: typeof Send; label: string; nav: NavId }[] = [
    { icon: Send, label: t('overview.shortcut.send'), nav: 'producer' },
    { icon: Search, label: t('overview.shortcut.search'), nav: 'messages' },
    { icon: Plus, label: t('overview.shortcut.create'), nav: 'topics' },
    { icon: RotateCcw, label: t('overview.shortcut.reset'), nav: 'consumers' },
  ]
  return (
    <div className="rl-card overflow-hidden">
      <div className="p-4 pb-3">
        <div className="text-[13px] font-medium">{t('overview.shortcut.title')}</div>
      </div>
      <div style={{ borderTop: '1px solid hsl(var(--border))' }}>
        {actions.map((a, i) => (
          <button
            key={a.label}
            type="button"
            className="flex items-center gap-2 hover:bg-muted/40 w-full text-left bg-transparent border-0"
            style={{
              padding: '10px 16px',
              borderTop: i ? '1px solid hsl(var(--border))' : undefined,
              cursor: 'pointer',
            }}
            onClick={() => onNavigate?.(a.nav)}
          >
            <a.icon size={13} className="rl-muted" />
            <span className="text-[13px] flex-1">{a.label}</span>
            <ChevronRight size={12} className="rl-muted" />
          </button>
        ))}
      </div>
    </div>
  )
}

function AIDiagnoseCard({
  findings,
  loading,
  onRefresh,
}: {
  findings: AIFinding[]
  loading: boolean
  onRefresh: () => void
}) {
  const { t } = useTranslation()
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
          <div className="text-[13px] font-semibold">{t('overview.ai.title')}</div>
          <div className="rl-muted text-[12px]">
            {findings.length === 0 && !loading
              ? t('overview.ai.subtitleEmpty')
              : t('overview.ai.subtitle')}
          </div>
        </div>
        <button className="rl-btn rl-btn-ghost rl-btn-sm" onClick={onRefresh} disabled={loading}>
          {loading ? <Loader2 size={12} className="animate-spin" /> : null}
          {t('overview.ai.reanalyze')}
        </button>
        <button className="rl-btn rl-btn-outline rl-btn-sm">
          <Sparkles size={12} />{t('overview.ai.chat')}
        </button>
      </div>

      <div>
        {findings.length === 0 ? (
          <div className="rl-muted text-[12px]" style={{ padding: '12px 0' }}>
            {t('overview.ai.empty')}
          </div>
        ) : (
          findings.map((f) => (
            <div key={f.key} className={'rl-ai-finding ' + f.severity}>
              <div className="ai-sev" />
              <div className="rl-ai-finding-body">
                <div className="flex items-center justify-between">
                  <div className="rl-ai-finding-title">{f.title}</div>
                  <span className="rl-muted text-[12px]">{t(`overview.ai.${f.severity}`)}</span>
                </div>
                <div className="rl-ai-finding-desc">{f.desc}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
