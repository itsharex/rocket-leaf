import { useMemo, useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  Info,
  PlugZap,
  Settings,
  RefreshCw,
  Loader2,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { PageHeader } from '../shell'
import { useOverview } from '@/hooks/useOverview'
import { useSettings } from '@/hooks/useSettings'
import type { NavId } from '../Sidebar'

type Severity = 'crit' | 'warn' | 'info'

interface AlertEntry {
  key: string
  severity: Severity
  ruleKey: string
  title: string
  desc: string
  since?: string
}

interface AlertsScreenProps {
  onNavigate?: (id: NavId) => void
}

const DISK_THRESHOLD = 75

export function AlertsScreen({ onNavigate }: AlertsScreenProps) {
  const { t } = useTranslation()
  const { data, refresh, refreshing, loading } = useOverview()
  const { settings } = useSettings()
  const lagThreshold = settings.lagAlertThreshold || 10000

  const [tab, setTab] = useState<'active' | 'rules'>('active')

  const hasOnline = data.activeConnection?.status === 'online'

  const alerts = useMemo<AlertEntry[]>(() => {
    if (!hasOnline) return []
    const out: AlertEntry[] = []
    // Offline brokers — critical
    for (const b of data.brokers) {
      if (b.status === 'offline') {
        out.push({
          key: `broker-off-${b.brokerName}-${b.brokerId}`,
          severity: 'crit',
          ruleKey: 'brokerOffline',
          title: t('alerts.rule.brokerOffline'),
          desc: `${b.brokerName}${b.brokerId !== 0 ? `-${b.brokerId}` : ''} (${b.address || '—'})`,
          since: b.lastUpdate || undefined,
        })
      }
    }
    // Consumer groups: high lag + offline groups
    for (const g of data.consumerGroups) {
      const lag = Number(g.lag ?? 0)
      if (lag > lagThreshold && (g.onlineClients ?? 0) === 0) {
        out.push({
          key: `group-off-${g.group}`,
          severity: 'crit',
          ruleKey: 'groupOffline',
          title: t('alerts.rule.groupOffline'),
          desc: `${g.group} · lag ${lag.toLocaleString()}`,
          since: g.lastUpdate || undefined,
        })
      } else if (lag > lagThreshold) {
        out.push({
          key: `group-lag-${g.group}`,
          severity: 'warn',
          ruleKey: 'groupLag',
          title: t('alerts.rule.groupLag'),
          desc: `${g.group} · lag ${lag.toLocaleString()} > ${lagThreshold.toLocaleString()}`,
          since: g.lastUpdate || undefined,
        })
      }
      if ((g.dlq ?? 0) > 0) {
        out.push({
          key: `dlq-${g.group}`,
          severity: 'info',
          ruleKey: 'dlqGrowth',
          title: t('alerts.rule.dlqGrowth'),
          desc: `${g.group} · ${g.dlq} dead letters`,
        })
      }
    }
    // Disk usage warnings
    for (const b of data.brokers) {
      const usage = Number((b as unknown as { commitLogDiskUsage?: number }).commitLogDiskUsage ?? 0)
      if (usage >= DISK_THRESHOLD) {
        out.push({
          key: `disk-${b.brokerName}-${b.brokerId}`,
          severity: usage >= 90 ? 'crit' : 'warn',
          ruleKey: 'diskUsage',
          title: t('alerts.rule.diskUsage'),
          desc: `${b.brokerName}${b.brokerId !== 0 ? `-${b.brokerId}` : ''} · ${Math.round(usage)}%`,
          since: b.lastUpdate || undefined,
        })
      }
    }
    return out.sort((a, b) => severityWeight(b.severity) - severityWeight(a.severity))
  }, [hasOnline, data, lagThreshold, t])

  const handleRefresh = async () => {
    try {
      await refresh()
      toast.success(t('common.refreshed'))
    } catch (e) {
      toast.error((e as Error).message ?? String(e))
    }
  }

  const subtitle = !hasOnline
    ? t('alerts.subtitleNoConn')
    : t('alerts.subtitle', { count: alerts.length })

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHeader
        title={t('alerts.title')}
        subtitle={subtitle}
        tabs={[t('alerts.tabs.active'), t('alerts.tabs.rules')]}
        activeTab={tab === 'active' ? t('alerts.tabs.active') : t('alerts.tabs.rules')}
        onTabChange={(label) =>
          setTab(label === t('alerts.tabs.active') ? 'active' : 'rules')
        }
      >
        <button
          className="rl-btn rl-btn-outline rl-btn-icon rl-btn-sm"
          onClick={handleRefresh}
          disabled={refreshing || !hasOnline}
          title={t('common.refresh')}
        >
          {refreshing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
        </button>
      </PageHeader>

      <div className="scroll-thin min-h-0 flex-1 overflow-auto" style={{ padding: 20 }}>
        {!hasOnline ? (
          <div
            className="rl-muted flex flex-col items-center justify-center text-center"
            style={{ minHeight: 240 }}
          >
            <PlugZap size={32} className="mb-3 opacity-40" />
            <div className="text-[13px]">{t('alerts.subtitleNoConn')}</div>
          </div>
        ) : tab === 'active' ? (
          <ActiveAlerts alerts={alerts} loading={loading} />
        ) : (
          <RulesPanel
            lagThreshold={lagThreshold}
            onOpenSettings={() => onNavigate?.('settings')}
          />
        )}
      </div>
    </div>
  )
}

function severityWeight(s: Severity): number {
  return s === 'crit' ? 3 : s === 'warn' ? 2 : 1
}

function severityIcon(s: Severity) {
  if (s === 'crit') return <AlertCircle size={13} style={{ color: 'hsl(var(--destructive))' }} />
  if (s === 'warn') return <AlertTriangle size={13} style={{ color: 'hsl(28 80% 45%)' }} />
  return <Info size={13} style={{ color: 'hsl(217 80% 50%)' }} />
}

function ActiveAlerts({ alerts, loading }: { alerts: AlertEntry[]; loading: boolean }) {
  const { t } = useTranslation()
  if (loading && alerts.length === 0) {
    return (
      <div
        className="flex items-center justify-center rl-muted"
        style={{ padding: 60, gap: 8 }}
      >
        <Loader2 size={14} className="animate-spin" />
        <span className="text-[12px]">{t('common.loading')}</span>
      </div>
    )
  }
  if (alerts.length === 0) {
    return (
      <div
        className="rl-card rl-muted text-[12px] text-center"
        style={{ padding: 32, maxWidth: 760 }}
      >
        {t('alerts.active.empty')}
      </div>
    )
  }
  return (
    <div className="rl-card overflow-hidden" style={{ maxWidth: 760 }}>
      {alerts.map((a, i) => (
        <div
          key={a.key}
          style={{
            padding: '12px 16px',
            borderTop: i ? '1px solid hsl(var(--border))' : undefined,
          }}
        >
          <div className="flex items-center gap-2">
            {severityIcon(a.severity)}
            <span className="text-[13px] font-medium">{a.title}</span>
            <span className="rl-badge rl-badge-outline" style={{ marginLeft: 4 }}>
              {t(`alerts.level.${a.severity}`)}
            </span>
            <span className="flex-1" />
            {a.since && (
              <span className="font-mono-design rl-muted rl-tabular text-[11px]">
                {t('alerts.active.since', { time: a.since })}
              </span>
            )}
          </div>
          <div
            className="rl-muted mt-1 text-[12px] font-mono-design"
            style={{ lineHeight: 1.5 }}
          >
            {a.desc}
          </div>
        </div>
      ))}
    </div>
  )
}

function RulesPanel({
  lagThreshold,
  onOpenSettings,
}: {
  lagThreshold: number
  onOpenSettings: () => void
}) {
  const { t } = useTranslation()
  return (
    <div className="rl-card" style={{ padding: 20, maxWidth: 760 }}>
      <div className="text-[13px] font-medium">{t('alerts.rules.title')}</div>
      <div className="rl-muted mt-1 text-[12px]" style={{ lineHeight: 1.5 }}>
        {t('alerts.rules.desc')}
      </div>

      <div
        className="mt-4 grid gap-3"
        style={{ gridTemplateColumns: '1fr 1fr' }}
      >
        <div
          style={{
            padding: 12,
            border: '1px solid hsl(var(--border))',
            borderRadius: 8,
          }}
        >
          <div className="rl-muted text-[12px]">{t('alerts.rules.lagThreshold')}</div>
          <div className="rl-tabular mt-1 text-[18px] font-semibold">
            {t('alerts.rules.lagThresholdValue', { n: lagThreshold.toLocaleString() })}
          </div>
        </div>
        <div
          style={{
            padding: 12,
            border: '1px solid hsl(var(--border))',
            borderRadius: 8,
          }}
        >
          <div className="rl-muted text-[12px]">{t('alerts.rules.diskThreshold')}</div>
          <div className="rl-tabular mt-1 text-[18px] font-semibold">
            {t('alerts.rules.diskThresholdValue', { n: DISK_THRESHOLD })}
          </div>
        </div>
      </div>

      <div className="rl-section-label" style={{ marginTop: 20 }}>
        {t('alerts.tabs.rules')}
      </div>
      <div>
        {(['brokerOffline', 'groupOffline', 'groupLag', 'diskUsage', 'dlqGrowth'] as const).map(
          (k, i) => (
            <div
              key={k}
              className="flex items-center gap-3"
              style={{
                padding: '10px 0',
                borderTop: i ? '1px solid hsl(var(--border))' : undefined,
              }}
            >
              {severityIcon(
                k === 'brokerOffline' || k === 'groupOffline'
                  ? 'crit'
                  : k === 'groupLag' || k === 'diskUsage'
                    ? 'warn'
                    : 'info',
              )}
              <span className="text-[13px] flex-1">{t(`alerts.rule.${k}`)}</span>
            </div>
          ),
        )}
      </div>

      <div
        className="mt-4 flex justify-end"
        style={{ paddingTop: 12, borderTop: '1px solid hsl(var(--border))' }}
      >
        <button
          className="rl-btn rl-btn-outline rl-btn-sm"
          onClick={onOpenSettings}
        >
          <Settings size={13} />
          {t('alerts.rules.openSettings')}
        </button>
      </div>
    </div>
  )
}
