import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Search,
  RefreshCw,
  Plus,
  Tag,
  X,
  Server,
  Edit,
  Trash2,
  AlertCircle,
  PlugZap,
  Check,
} from 'lucide-react'
import { Spinner } from '@/components/Spinner'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  TopicMessageType,
  TopicPerm,
  type TopicItem,
} from '../../../bindings/rocket-leaf/internal/model/models.js'
import { PageHeader } from '../shell'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useTopics } from '@/hooks/useTopics'
import { useCluster } from '@/hooks/useCluster'
import { useDelayedUnmount } from '@/hooks/useDelayedUnmount'
import * as topicApi from '@/api/topic'

type TypeFilter = 'all' | 'normal' | 'fifo' | 'delay' | 'retry' | 'dlq'

const RETRY_PREFIX = '%RETRY%'
const DLQ_PREFIX = '%DLQ%'

interface DerivedTopic {
  raw: TopicItem
  kind: 'normal' | 'fifo' | 'delay' | 'retry' | 'dlq'
}

function classifyTopic(t: TopicItem): DerivedTopic['kind'] {
  if (t.topic.startsWith(RETRY_PREFIX) || t.topic.startsWith('RETRY%')) return 'retry'
  if (t.topic.startsWith(DLQ_PREFIX) || t.topic.startsWith('DLQ%')) return 'dlq'
  if (t.messageType === TopicMessageType.MessageTypeFIFO) return 'fifo'
  if (t.messageType === TopicMessageType.MessageTypeDelay) return 'delay'
  return 'normal'
}

function formatTps(n: number): string {
  if (!n || !Number.isFinite(n)) return '—'
  if (n >= 10000) return `${(n / 1000).toFixed(1)}k/s`
  if (n >= 1000) return `${(n / 1000).toFixed(2)}k/s`
  return `${Math.round(n)}/s`
}

function permLabel(p: TopicPerm, t: (k: string) => string): string {
  switch (p) {
    case TopicPerm.PermRW:
      return t('topics.perm.rw')
    case TopicPerm.PermR:
      return t('topics.perm.r')
    case TopicPerm.PermW:
      return t('topics.perm.w')
    case TopicPerm.PermDeny:
      return t('topics.perm.deny')
    default:
      return p || '—'
  }
}

function typeBadgeClass(kind: DerivedTopic['kind']): string {
  switch (kind) {
    case 'fifo':
      return 'rl-badge rl-badge-warn'
    case 'delay':
      return 'rl-badge rl-badge-info'
    case 'retry':
      return 'rl-badge rl-badge-outline'
    case 'dlq':
      return 'rl-badge rl-badge-danger'
    default:
      return 'rl-badge'
  }
}

export function TopicsScreen() {
  const { t } = useTranslation()
  const { topics, loading, refreshing, error, refresh, hasOnline } = useTopics()
  const { data: clusterData } = useCluster()

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [selectedName, setSelectedName] = useState<string | null>(null)
  const [detail, setDetail] = useState<TopicItem | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [editorOpen, setEditorOpen] = useState<
    { mode: 'create' } | { mode: 'edit'; topic: TopicItem } | null
  >(null)
  const [confirmDelete, setConfirmDelete] = useState<TopicItem | null>(null)
  const [deleting, setDeleting] = useState(false)

  const derived = useMemo<DerivedTopic[]>(
    () => topics.map((raw) => ({ raw, kind: classifyTopic(raw) })),
    [topics],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return derived.filter((d) => {
      if (typeFilter !== 'all' && d.kind !== typeFilter) return false
      if (
        q &&
        !d.raw.topic.toLowerCase().includes(q) &&
        !(d.raw.description || '').toLowerCase().includes(q)
      ) {
        return false
      }
      return true
    })
  }, [derived, search, typeFilter])

  const dismissPanel = useCallback(() => {
    setSelectedName(null)
  }, [])

  const panelMount = useDelayedUnmount(!!(hasOnline && selectedName))
  // Keep the displayed item alive during the exit animation.
  const [pinnedDetail, setPinnedDetail] = useState<TopicItem | null>(null)
  useEffect(() => {
    if (detail) setPinnedDetail(detail)
  }, [detail])

  // Esc closes the detail panel
  useEffect(() => {
    if (!selectedName) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismissPanel()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [selectedName, dismissPanel])

  // Clicking the list pane outside any row closes the panel
  const handleListBackgroundClick = (e: React.MouseEvent) => {
    if (!selectedName) return
    if ((e.target as HTMLElement).closest('tr')) return
    dismissPanel()
  }

  // When selected name changes, fetch detail (with routes)
  useEffect(() => {
    let cancelled = false
    if (!selectedName) {
      setDetail(null)
      return
    }
    setDetailLoading(true)
    topicApi
      .getTopicDetail(selectedName)
      .then((d) => {
        if (!cancelled) setDetail(d)
      })
      .catch((e) => {
        if (!cancelled) toast.error((e as Error).message ?? String(e))
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [selectedName, topics.length]) // re-run when list refreshes too

  const handleRefresh = async () => {
    try {
      await refresh()
      toast.success(t('common.refreshed'))
    } catch (e) {
      toast.error((e as Error).message ?? String(e))
    }
  }

  const handleDelete = async () => {
    if (!confirmDelete) return
    setDeleting(true)
    try {
      await topicApi.deleteTopic(confirmDelete.topic, confirmDelete.cluster || '')
      toast.success(t('topics.create.deleteSuccess'))
      setConfirmDelete(null)
      if (selectedName === confirmDelete.topic) setSelectedName(null)
      await refresh()
    } catch (e) {
      toast.error((e as Error).message ?? String(e))
    } finally {
      setDeleting(false)
    }
  }

  const subtitle = !hasOnline
    ? t('topics.subtitleNoConn')
    : filtered.length === topics.length
      ? t('topics.subtitle', { count: topics.length })
      : t('topics.subtitleFiltered', { count: filtered.length, total: topics.length })

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHeader title={t('topics.title')} subtitle={subtitle}>
        <div className="rl-search-input" style={{ width: 240 }}>
          <span className="icon">
            <Search size={14} />
          </span>
          <input
            className="rl-input"
            placeholder={t('topics.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          className="rl-btn rl-btn-outline rl-btn-icon rl-btn-sm"
          onClick={handleRefresh}
          disabled={refreshing || !hasOnline}
          title={t('common.refresh')}
        >
          {refreshing ? <Spinner size={14} /> : <RefreshCw size={14} />}
        </button>
        <button
          className="rl-btn rl-btn-primary rl-btn-sm"
          onClick={() => setEditorOpen({ mode: 'create' })}
          disabled={!hasOnline}
        >
          <Plus size={13} />
          {t('common.create')}
        </button>
      </PageHeader>

      {/* Type filter chips */}
      {hasOnline && (
        <div
          className="flex items-center gap-2"
          style={{
            padding: '8px 20px',
            borderBottom: '1px solid hsl(var(--border))',
            background: 'hsl(var(--background))',
          }}
        >
          {(
            [
              ['all', 'topics.filterAll'],
              ['normal', 'topics.filterNormal'],
              ['fifo', 'topics.filterFifo'],
              ['delay', 'topics.filterDelay'],
              ['retry', 'topics.filterRetry'],
              ['dlq', 'topics.filterDlq'],
            ] as const
          ).map(([k, key]) => (
            <button
              key={k}
              type="button"
              className={
                'rl-btn rl-btn-sm ' + (typeFilter === k ? 'rl-btn-primary' : 'rl-btn-ghost')
              }
              style={{ height: 24 }}
              onClick={() => setTypeFilter(k)}
            >
              {t(key)}
            </button>
          ))}
        </div>
      )}

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div
          className="scroll-thin min-w-0 flex-1 overflow-auto"
          onClick={handleListBackgroundClick}
        >
          {!hasOnline ? (
            <div
              className="rl-muted flex flex-col items-center justify-center text-center"
              style={{ minHeight: 240, padding: 40 }}
            >
              <PlugZap size={32} className="mb-3 opacity-40" />
              <div className="text-[13px]">{t('topics.subtitleNoConn')}</div>
            </div>
          ) : loading && topics.length === 0 ? (
            <div
              className="rl-muted flex items-center justify-center"
              style={{ padding: 60, gap: 8 }}
            >
              <Spinner size={14} />
              <span className="text-[12px]">{t('common.loading')}</span>
            </div>
          ) : (
            <>
              {error && (
                <div
                  className="flex items-center gap-2"
                  style={{
                    margin: 16,
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: 'hsl(0 84% 96%)',
                    color: 'hsl(0 70% 35%)',
                    border: '1px solid hsl(0 84% 80%)',
                  }}
                >
                  <AlertCircle size={14} />
                  <span className="text-[12px]">{t('topics.loadError', { message: error })}</span>
                </div>
              )}
              {filtered.length === 0 ? (
                <div className="rl-muted text-center" style={{ padding: 40, fontSize: 12 }}>
                  {t('topics.empty')}
                </div>
              ) : (
                <table className="rl-table">
                  <thead>
                    <tr>
                      <th style={{ width: 32 }} />
                      <th>{t('topics.table.name')}</th>
                      <th style={{ width: 110 }}>{t('topics.table.type')}</th>
                      <th style={{ width: 110 }} className="rl-tabular">
                        {t('topics.table.queues')}
                      </th>
                      <th style={{ width: 90 }}>{t('topics.table.perm')}</th>
                      <th style={{ width: 90 }} className="rl-tabular">
                        {t('topics.table.groups')}
                      </th>
                      <th style={{ width: 110 }} className="rl-tabular">
                        {t('topics.table.tpsIn')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(({ raw, kind }) => (
                      <tr
                        key={raw.topic}
                        className={selectedName === raw.topic ? 'selected' : ''}
                        onClick={() => setSelectedName(raw.topic)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td>
                          <Tag size={14} className="rl-muted" />
                        </td>
                        <td>
                          <div className="font-mono-design">{raw.topic}</div>
                          {raw.description && (
                            <div
                              className="rl-muted mt-0.5 truncate text-[11px]"
                              style={{ maxWidth: 320 }}
                            >
                              {raw.description}
                            </div>
                          )}
                        </td>
                        <td>
                          <span className={typeBadgeClass(kind)}>{t(`topics.type.${kind}`)}</span>
                        </td>
                        <td className="rl-tabular">
                          {raw.readQueue} / {raw.writeQueue}
                        </td>
                        <td>
                          <span className="rl-muted text-[12px]">{permLabel(raw.perm, t)}</span>
                        </td>
                        <td className="rl-tabular">{raw.consumerGroups || 0}</td>
                        <td className="rl-tabular rl-muted">{formatTps(raw.tpsIn)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}
        </div>

        {/* Detail panel */}
        {panelMount.shouldRender && (
          <TopicDetailPanel
            topic={detail ?? pinnedDetail}
            loading={detailLoading && !detail && !pinnedDetail}
            exiting={panelMount.exiting}
            onClose={dismissPanel}
            onEdit={(tp) => setEditorOpen({ mode: 'edit', topic: tp })}
            onDelete={(tp) => setConfirmDelete(tp)}
          />
        )}
      </div>

      {/* Editor modal */}
      {editorOpen && (
        <TopicEditor
          mode={editorOpen.mode}
          initial={editorOpen.mode === 'edit' ? editorOpen.topic : null}
          brokers={clusterData.brokers}
          onClose={() => setEditorOpen(null)}
          onSaved={async () => {
            setEditorOpen(null)
            await refresh()
          }}
        />
      )}

      <ConfirmDialog
        open={confirmDelete != null}
        title={t('topics.detail.actions.delete')}
        description={t('topics.detail.deleteConfirm', { name: confirmDelete?.topic ?? '' })}
        confirmText={deleting ? t('common.loading') : t('common.delete')}
        cancelText={t('common.cancel')}
        variant="destructive"
        onConfirm={handleDelete}
        onCancel={() => !deleting && setConfirmDelete(null)}
      />
    </div>
  )
}

// ---------- Detail Panel ----------

function TopicDetailPanel({
  topic,
  loading,
  exiting,
  onClose,
  onEdit,
  onDelete,
}: {
  topic: TopicItem | null
  loading: boolean
  exiting: boolean
  onClose: () => void
  onEdit: (t: TopicItem) => void
  onDelete: (t: TopicItem) => void
}) {
  const { t } = useTranslation()
  const [tab, setTab] = useState<'info' | 'routes' | 'groups'>('info')

  const asideClass = 'scroll-thin rl-detail-panel' + (exiting ? ' exiting' : '')

  if (loading && !topic) {
    return (
      <aside
        className={asideClass}
        style={{
          width: 380,
          borderLeft: '1px solid hsl(var(--border))',
          overflow: 'auto',
          background: 'hsl(var(--background))',
        }}
      >
        <div className="rl-muted flex items-center justify-center" style={{ padding: 60, gap: 8 }}>
          <Spinner size={14} />
          <span className="text-[12px]">{t('common.loading')}</span>
        </div>
      </aside>
    )
  }

  if (!topic) return null

  const kind = classifyTopic(topic)
  const totalQueue = topic.readQueue + topic.writeQueue

  return (
    <aside
      className={asideClass}
      style={{
        width: 380,
        borderLeft: '1px solid hsl(var(--border))',
        overflow: 'auto',
        background: 'hsl(var(--background))',
      }}
    >
      <div style={{ padding: 20 }}>
        <div className="flex items-center justify-between gap-2">
          <div className="font-mono-design truncate font-semibold">{topic.topic}</div>
          <button className="rl-btn rl-btn-ghost rl-btn-icon rl-btn-sm shrink-0" onClick={onClose}>
            <X size={14} />
          </button>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          <span className={typeBadgeClass(kind)}>{t(`topics.type.${kind}`)}</span>
          <span className="rl-badge rl-badge-outline">{permLabel(topic.perm, t)}</span>
          {topic.tpsIn > 0 && <span className="rl-badge rl-badge-success">活跃</span>}
        </div>

        <div
          className="rl-utabs"
          style={{
            marginTop: 16,
            marginLeft: -20,
            marginRight: -20,
            paddingLeft: 20,
            paddingRight: 20,
          }}
        >
          {(['info', 'routes', 'groups'] as const).map((k) => (
            <div
              key={k}
              className={'utab ' + (tab === k ? 'active' : '')}
              onClick={() => setTab(k)}
            >
              {t(`topics.detail.tabs.${k}`)}
            </div>
          ))}
        </div>

        {tab === 'info' && (
          <>
            <div className="mt-4 grid gap-2" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div className="rl-card" style={{ padding: 12 }}>
                <div className="rl-muted text-[12px]">{t('topics.detail.stat.tpsIn')}</div>
                <div className="rl-tabular mt-1 text-[16px] font-semibold">
                  {formatTps(topic.tpsIn)}
                </div>
              </div>
              <div className="rl-card" style={{ padding: 12 }}>
                <div className="rl-muted text-[12px]">{t('topics.detail.stat.tpsOut')}</div>
                <div className="rl-tabular mt-1 text-[16px] font-semibold">
                  {formatTps(topic.tpsOut)}
                </div>
              </div>
              <div className="rl-card" style={{ padding: 12 }}>
                <div className="rl-muted text-[12px]">{t('topics.detail.stat.groups')}</div>
                <div className="rl-tabular mt-1 text-[16px] font-semibold">
                  {topic.consumerGroups}
                </div>
              </div>
              <div className="rl-card" style={{ padding: 12 }}>
                <div className="rl-muted text-[12px]">{t('topics.detail.stat.queues')}</div>
                <div className="rl-tabular mt-1 text-[16px] font-semibold">{totalQueue}</div>
              </div>
            </div>

            <div className="rl-section-label" style={{ marginTop: 20 }}>
              {t('topics.detail.info')}
            </div>
            <div>
              {topic.cluster && (
                <div className="rl-detail-row">
                  <div className="k">{t('topics.detail.infoCluster')}</div>
                  <div className="v">{topic.cluster}</div>
                </div>
              )}
              <div className="rl-detail-row">
                <div className="k">{t('topics.detail.infoType')}</div>
                <div className="v">{t(`topics.type.${kind}`)}</div>
              </div>
              <div className="rl-detail-row">
                <div className="k">{t('topics.detail.infoPerm')}</div>
                <div className="v">{permLabel(topic.perm, t)}</div>
              </div>
              <div className="rl-detail-row">
                <div className="k">{t('topics.detail.infoQueues')}</div>
                <div className="v rl-tabular">
                  {topic.readQueue} / {topic.writeQueue}
                </div>
              </div>
              <div className="rl-detail-row">
                <div className="k">{t('topics.detail.infoGroups')}</div>
                <div className="v rl-tabular">{topic.consumerGroups}</div>
              </div>
              {topic.lastUpdated && (
                <div className="rl-detail-row">
                  <div className="k">{t('topics.detail.infoUpdated')}</div>
                  <div className="v font-mono-design text-[12px]">{topic.lastUpdated}</div>
                </div>
              )}
              {topic.description && (
                <div className="rl-detail-row">
                  <div className="k">{t('topics.detail.infoDesc')}</div>
                  <div className="v">{topic.description}</div>
                </div>
              )}
            </div>
          </>
        )}

        {tab === 'routes' && (
          <div className="mt-4">
            {topic.routes.length === 0 ? (
              <div className="rl-muted text-[12px]" style={{ padding: 16, textAlign: 'center' }}>
                {t('topics.detail.routesEmpty')}
              </div>
            ) : (
              <div className="rl-card overflow-hidden">
                {topic.routes.map((r, i) => (
                  <div
                    key={`${r.broker}-${r.brokerAddr}`}
                    className="flex items-center justify-between"
                    style={{
                      padding: '10px 14px',
                      borderTop: i ? '1px solid hsl(var(--border))' : undefined,
                    }}
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <Server size={13} className="rl-muted" />
                      <span className="font-mono-design truncate text-[12px]">{r.broker}</span>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <span
                        className="rl-badge rl-badge-outline"
                        style={{ height: 18, fontSize: 10 }}
                      >
                        R {r.readQueue}
                      </span>
                      <span
                        className="rl-badge rl-badge-outline"
                        style={{ height: 18, fontSize: 10 }}
                      >
                        W {r.writeQueue}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'groups' && (
          <div className="mt-4">
            <div className="rl-card" style={{ padding: 16, textAlign: 'center' }}>
              <div className="rl-muted text-[12px]">
                {t('topics.detail.groupsTitle')} · {topic.consumerGroups}
              </div>
              <div className="rl-muted mt-1 text-[11px]">{t('topics.detail.groupsEmpty')}</div>
            </div>
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-2">
          <button className="rl-btn rl-btn-outline rl-btn-sm" onClick={() => onEdit(topic)}>
            <Edit size={13} />
            {t('topics.detail.actions.edit')}
          </button>
          <button
            className="rl-btn rl-btn-ghost rl-btn-sm"
            style={{ marginLeft: 'auto', color: 'hsl(var(--destructive))' }}
            onClick={() => onDelete(topic)}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </aside>
  )
}

// ---------- Editor Modal ----------

function TopicEditor({
  mode,
  initial,
  brokers,
  onClose,
  onSaved,
}: {
  mode: 'create' | 'edit'
  initial: TopicItem | null
  brokers: import('../../../bindings/rocket-leaf/internal/model/models.js').BrokerNode[]
  onClose: () => void
  onSaved: () => void | Promise<void>
}) {
  const { t } = useTranslation()
  const masterBrokers = useMemo(
    () =>
      brokers.filter(
        (b) => String(b.role).toUpperCase() === 'MASTER' && b.status === 'online' && b.address,
      ),
    [brokers],
  )

  const [name, setName] = useState(initial?.topic ?? '')
  const [brokerAddr, setBrokerAddr] = useState<string>(
    initial?.routes?.[0]?.brokerAddr || masterBrokers[0]?.address || '',
  )
  const [readQueue, setReadQueue] = useState<number>(initial?.readQueue ?? 8)
  const [writeQueue, setWriteQueue] = useState<number>(initial?.writeQueue ?? 8)
  const [perm, setPerm] = useState<TopicPerm>(initial?.perm ?? TopicPerm.PermRW)
  const [busy, setBusy] = useState(false)

  const isEdit = mode === 'edit'

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error(t('topics.create.namePlaceholder'))
      return
    }
    if (!brokerAddr) {
      toast.error(t('topics.create.noBrokers'))
      return
    }
    setBusy(true)
    try {
      if (isEdit) {
        await topicApi.updateTopic(name.trim(), brokerAddr, readQueue, writeQueue, perm)
        toast.success(t('topics.create.saveSuccess', { name: name.trim() }))
      } else {
        await topicApi.createTopic(name.trim(), brokerAddr, readQueue, writeQueue, perm)
        toast.success(t('topics.create.createSuccess', { name: name.trim() }))
      }
      await onSaved()
    } catch (e) {
      toast.error((e as Error).message ?? String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md rounded-xl border border-border/50 bg-background p-6 shadow-lg"
      >
        <h2 className="text-base font-semibold">
          {isEdit ? t('topics.create.edit') : t('topics.create.title')}
        </h2>
        <div className="mt-4 grid gap-3.5" style={{ gridTemplateColumns: '1fr' }}>
          <div>
            <div className="rl-muted mb-2 text-[12px]">
              {t('topics.create.name')} <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
            </div>
            <input
              className="rl-input font-mono-design"
              placeholder={t('topics.create.namePlaceholder')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isEdit}
            />
          </div>
          <div>
            <div className="rl-muted mb-2 text-[12px]">
              {t('topics.create.broker')}{' '}
              <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
            </div>
            {masterBrokers.length === 0 ? (
              <div className="rl-muted text-[12px]" style={{ padding: 8 }}>
                {t('topics.create.noBrokers')}
              </div>
            ) : (
              <select
                className="rl-select"
                value={brokerAddr}
                onChange={(e) => setBrokerAddr(e.target.value)}
              >
                {masterBrokers.map((b) => (
                  <option key={b.address} value={b.address}>
                    {b.brokerName} · {b.address}
                  </option>
                ))}
              </select>
            )}
            <div className="rl-muted mt-1 text-[11px]">{t('topics.create.brokerHint')}</div>
          </div>
          <div className="grid gap-3.5" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div>
              <div className="rl-muted mb-2 text-[12px]">{t('topics.create.readQueue')}</div>
              <input
                className="rl-input"
                type="number"
                min={1}
                max={64}
                value={readQueue}
                onChange={(e) => setReadQueue(Number(e.target.value) || 1)}
              />
            </div>
            <div>
              <div className="rl-muted mb-2 text-[12px]">{t('topics.create.writeQueue')}</div>
              <input
                className="rl-input"
                type="number"
                min={1}
                max={64}
                value={writeQueue}
                onChange={(e) => setWriteQueue(Number(e.target.value) || 1)}
              />
            </div>
          </div>
          <div>
            <div className="rl-muted mb-2 text-[12px]">{t('topics.create.perm')}</div>
            <select
              className="rl-select"
              value={perm}
              onChange={(e) => setPerm(e.target.value as TopicPerm)}
            >
              <option value={TopicPerm.PermRW}>{t('topics.perm.rw')}</option>
              <option value={TopicPerm.PermR}>{t('topics.perm.r')}</option>
              <option value={TopicPerm.PermW}>{t('topics.perm.w')}</option>
              <option value={TopicPerm.PermDeny}>{t('topics.perm.deny')}</option>
            </select>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2.5">
          <button
            type="button"
            className="rl-btn rl-btn-outline rl-btn-sm"
            onClick={onClose}
            disabled={busy}
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            className="rl-btn rl-btn-primary rl-btn-sm"
            onClick={handleSubmit}
            disabled={busy || masterBrokers.length === 0}
          >
            {busy ? <Spinner size={13} /> : <Check size={13} />}
            {isEdit ? t('topics.create.save') : t('topics.create.submit')}
          </button>
        </div>
      </div>
    </div>
  )
}
