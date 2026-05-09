import { useEffect, useMemo, useState } from 'react'
import { Search, Plus, Server, Check, Unlink, PlugZap, Trash2, Wifi, Star } from 'lucide-react'
import { Spinner } from '@/components/Spinner'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { PageHeader } from '../shell'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useConnections } from '@/hooks/useConnections'
import * as connectionApi from '@/api/connection'
import { formatErrorMessage } from '@/lib/utils'
import {
  ConnectionEnv,
  type Connection,
} from '../../../bindings/rocket-leaf/internal/model/models.js'

const NEW_FORM_ID = -1

interface FormState {
  id: number
  name: string
  env: ConnectionEnv
  nameServer: string
  timeoutSec: number
  enableACL: boolean
  accessKey: string
  secretKey: string
  remark: string
}

const EMPTY_FORM: FormState = {
  id: NEW_FORM_ID,
  name: '',
  env: ConnectionEnv.EnvTest,
  nameServer: '',
  timeoutSec: 5,
  enableACL: false,
  accessKey: '',
  secretKey: '',
  remark: '',
}

function fromConnection(c: Connection): FormState {
  return {
    id: c.id,
    name: c.name,
    env: c.env,
    nameServer: c.nameServer,
    timeoutSec: c.timeoutSec || 5,
    enableACL: c.enableACL,
    accessKey: c.accessKey,
    secretKey: c.secretKey,
    remark: c.remark,
  }
}

export function ConnectionsScreen() {
  const { t } = useTranslation()
  const { list, loading, refresh } = useConnections()

  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [originalForm, setOriginalForm] = useState<FormState>(EMPTY_FORM)
  const [busy, setBusy] = useState<'test' | 'connect' | 'disconnect' | 'save' | 'delete' | null>(
    null,
  )
  const [confirmDelete, setConfirmDelete] = useState<Connection | null>(null)

  // Auto-select first connection on mount
  useEffect(() => {
    if (selectedId == null && list.length > 0) {
      setSelectedId(list[0]!.id)
    }
  }, [list, selectedId])

  // Sync form with the selected connection
  const selected = useMemo<Connection | null>(
    () => (selectedId == null ? null : (list.find((c) => c.id === selectedId) ?? null)),
    [list, selectedId],
  )

  useEffect(() => {
    if (selectedId === NEW_FORM_ID) {
      setForm(EMPTY_FORM)
      setOriginalForm(EMPTY_FORM)
      return
    }
    if (selected) {
      const next = fromConnection(selected)
      setForm(next)
      setOriginalForm(next)
    }
  }, [selected, selectedId])

  const isNew = selectedId === NEW_FORM_ID
  const dirty = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(originalForm),
    [form, originalForm],
  )

  // Search filter
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return list
    return list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.nameServer.toLowerCase().includes(q) ||
        (c.remark || '').toLowerCase().includes(q),
    )
  }, [list, search])

  // ---------- handlers ----------

  const validate = (): string | null => {
    if (!form.name.trim()) return t('connections.validateName')
    if (!form.nameServer.trim()) return t('connections.validateNameServer')
    if (form.enableACL && (!form.accessKey.trim() || !form.secretKey.trim())) {
      return t('connections.validateAcl')
    }
    return null
  }

  const handleNew = () => {
    setSelectedId(NEW_FORM_ID)
  }

  const handleSelect = (c: Connection) => {
    setSelectedId(c.id)
  }

  const handleSave = async () => {
    const err = validate()
    if (err) {
      toast.error(err)
      return
    }
    setBusy('save')
    try {
      if (isNew) {
        const created = await connectionApi.addConnection(
          form.name.trim(),
          form.env,
          form.nameServer.trim(),
          form.timeoutSec,
          form.enableACL,
          form.accessKey.trim(),
          form.secretKey,
          form.remark.trim(),
        )
        toast.success(t('connections.createSuccess', { name: form.name.trim() }))
        await refresh()
        if (created) setSelectedId(created.id)
      } else {
        await connectionApi.updateConnection(
          form.id,
          form.name.trim(),
          form.env,
          form.nameServer.trim(),
          form.timeoutSec,
          form.enableACL,
          form.accessKey.trim(),
          form.secretKey,
          form.remark.trim(),
        )
        toast.success(t('connections.saveSuccess', { name: form.name.trim() }))
        await refresh()
      }
    } catch (e) {
      toast.error(formatErrorMessage(e))
    } finally {
      setBusy(null)
    }
  }

  const handleTest = async () => {
    if (isNew || !selected) return
    setBusy('test')
    try {
      const result = await connectionApi.testConnection(selected.id)
      toast.success(t('connections.testSuccess'), { description: result })
    } catch (e) {
      toast.error(t('connections.testFail'), {
        description: formatErrorMessage(e),
      })
    } finally {
      setBusy(null)
    }
  }

  const handleConnect = async () => {
    if (isNew || !selected) return
    setBusy('connect')
    try {
      await connectionApi.connect(selected.id)
      toast.success(t('connections.connectSuccess', { name: selected.name }))
      await refresh()
    } catch (e) {
      toast.error(formatErrorMessage(e))
    } finally {
      setBusy(null)
    }
  }

  const handleDisconnect = async () => {
    if (isNew || !selected) return
    setBusy('disconnect')
    try {
      await connectionApi.disconnect(selected.id)
      toast.success(t('connections.disconnectSuccess', { name: selected.name }))
      await refresh()
    } catch (e) {
      toast.error(formatErrorMessage(e))
    } finally {
      setBusy(null)
    }
  }

  const handleSetDefault = async () => {
    if (isNew || !selected) return
    try {
      await connectionApi.setDefaultConnection(selected.id)
      toast.success(t('connections.setDefaultSuccess', { name: selected.name }))
      await refresh()
    } catch (e) {
      toast.error(formatErrorMessage(e))
    }
  }

  const handleDelete = async () => {
    if (!confirmDelete) return
    setBusy('delete')
    try {
      await connectionApi.deleteConnection(confirmDelete.id)
      toast.success(t('connections.deleteSuccess'))
      setConfirmDelete(null)
      // Pick another connection or jump back to "select hint"
      const remaining = list.filter((c) => c.id !== confirmDelete.id)
      setSelectedId(remaining[0]?.id ?? null)
      await refresh()
    } catch (e) {
      toast.error(formatErrorMessage(e))
    } finally {
      setBusy(null)
    }
  }

  // ---------- render ----------

  const isOnline = selected?.status === 'online'

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHeader
        title={t('connections.title')}
        subtitle={t('connections.subtitle', { count: list.length })}
      >
        <div className="rl-search-input" style={{ width: 220 }}>
          <span className="icon">
            <Search size={14} />
          </span>
          <input
            className="rl-input"
            placeholder={t('connections.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="rl-btn rl-btn-primary rl-btn-sm" onClick={handleNew}>
          <Plus size={13} />
          {t('common.create')}
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
          {loading && list.length === 0 ? (
            <div
              className="rl-muted flex items-center justify-center"
              style={{ padding: 32, gap: 8 }}
            >
              <Spinner size={14} />
              <span className="text-[12px]">{t('common.loading')}</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="rl-muted text-center" style={{ padding: 40 }}>
              <PlugZap size={28} className="mx-auto mb-3 opacity-40" />
              <div className="text-[13px]">{t('connections.empty')}</div>
              <div className="mt-1 text-[12px]">{t('connections.emptyHint')}</div>
            </div>
          ) : (
            filtered.map((c) => {
              const active = selectedId === c.id
              const online = c.status === 'online'
              return (
                <div
                  key={c.id}
                  className={'flex items-center gap-3'}
                  style={{
                    padding: '14px 16px',
                    borderBottom: '1px solid hsl(var(--border))',
                    background: active ? 'hsl(var(--accent))' : 'transparent',
                    cursor: 'pointer',
                    borderLeft: active
                      ? '2px solid hsl(var(--foreground))'
                      : '2px solid transparent',
                  }}
                  onClick={() => handleSelect(c)}
                >
                  <div
                    className="rl-conn-icon"
                    style={{
                      width: 32,
                      height: 32,
                      background: online ? 'hsl(142 50% 38% / 0.1)' : 'hsl(var(--muted))',
                      color: online ? 'hsl(142 60% 28%)' : 'hsl(var(--muted-foreground))',
                    }}
                  >
                    <Server size={15} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-[13px] font-medium">{c.name}</span>
                      {c.isDefault && <Check size={11} className="rl-muted" />}
                    </div>
                    <div className="font-mono-design rl-muted mt-1 truncate text-[12px]">
                      {(c.nameServer || '').split(/[;\s,]+/)[0] || '—'}
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    {c.env && (
                      <span
                        className="rl-badge rl-badge-outline"
                        style={{ height: 18, fontSize: 10 }}
                      >
                        {c.env}
                      </span>
                    )}
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 999,
                        background: online ? 'hsl(var(--success))' : 'hsl(var(--border))',
                      }}
                    />
                  </div>
                </div>
              )
            })
          )}
          <div style={{ padding: 12, borderBottom: '1px solid hsl(var(--border))' }}>
            <button
              className="rl-btn rl-btn-outline rl-btn-sm"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={handleNew}
            >
              <Plus size={13} />
              {list.length === 0 ? t('connections.addFirst') : t('connections.newConnection')}
            </button>
          </div>
        </div>

        {/* Detail / form */}
        <div className="scroll-thin min-w-0 flex-1 overflow-auto" style={{ padding: 24 }}>
          {selectedId == null ? (
            <div
              className="rl-muted flex flex-col items-center justify-center text-center"
              style={{ minHeight: 240 }}
            >
              <PlugZap size={32} className="mb-3 opacity-40" />
              <div className="text-[13px]">{t('connections.selectHint')}</div>
            </div>
          ) : (
            <div style={{ maxWidth: 640 }}>
              {/* Header */}
              <div className="mb-2 flex items-center gap-3">
                <div
                  className="rl-conn-icon"
                  style={{
                    width: 44,
                    height: 44,
                    background: isOnline ? 'hsl(142 50% 38% / 0.1)' : 'hsl(var(--muted))',
                    color: isOnline ? 'hsl(142 60% 28%)' : 'hsl(var(--muted-foreground))',
                  }}
                >
                  <Server size={20} />
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[16px] font-semibold">
                      {isNew ? t('connections.newTitle') : selected?.name || form.name}
                    </span>
                    {!isNew && selected && (
                      <>
                        {isOnline ? (
                          <span className="rl-badge rl-badge-success">
                            <span
                              style={{
                                width: 5,
                                height: 5,
                                borderRadius: 999,
                                background: 'currentColor',
                              }}
                            />
                            {t('common.connected')}
                          </span>
                        ) : (
                          <span className="rl-badge rl-badge-outline">{t('common.offline')}</span>
                        )}
                        {selected.isDefault && (
                          <span className="rl-badge">
                            <Check size={10} />
                            {t('connections.default')}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                  {!isNew && selected?.lastCheck && (
                    <div className="rl-muted mt-1 text-[12px]">
                      {t('connections.lastCheck', { time: selected.lastCheck })}
                    </div>
                  )}
                </div>
                {!isNew && selected && (
                  <div className="flex gap-2">
                    {isOnline ? (
                      <button
                        className="rl-btn rl-btn-outline rl-btn-sm"
                        onClick={handleDisconnect}
                        disabled={busy === 'disconnect'}
                      >
                        {busy === 'disconnect' ? <Spinner size={13} /> : <Unlink size={13} />}
                        {t('connections.disconnect')}
                      </button>
                    ) : (
                      <button
                        className="rl-btn rl-btn-primary rl-btn-sm"
                        onClick={handleConnect}
                        disabled={busy === 'connect'}
                      >
                        {busy === 'connect' ? <Spinner size={13} /> : <PlugZap size={13} />}
                        {t('connections.connect')}
                      </button>
                    )}
                    {!selected.isDefault && (
                      <button
                        className="rl-btn rl-btn-outline rl-btn-sm"
                        onClick={handleSetDefault}
                      >
                        <Star size={13} />
                        {t('connections.setDefault')}
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="rl-section-label" style={{ marginTop: 24 }}>
                {t('connections.config')}
              </div>
              <div className="rl-card" style={{ padding: 20 }}>
                <div className="grid gap-3.5" style={{ gridTemplateColumns: '1fr 1fr' }}>
                  <div>
                    <div className="rl-muted mb-2 text-[12px]">
                      {t('connections.name')}{' '}
                      <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
                    </div>
                    <input
                      className="rl-input"
                      placeholder={t('connections.namePlaceholder')}
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <div className="rl-muted mb-2 text-[12px]">{t('connections.env')}</div>
                    <select
                      className="rl-select"
                      value={form.env}
                      onChange={(e) => setForm({ ...form, env: e.target.value as ConnectionEnv })}
                    >
                      <option value={ConnectionEnv.EnvProduction}>
                        {t('connections.envProd')}
                      </option>
                      <option value={ConnectionEnv.EnvTest}>{t('connections.envTest')}</option>
                      <option value={ConnectionEnv.EnvDevelopment}>
                        {t('connections.envDev')}
                      </option>
                    </select>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <div className="rl-muted mb-2 text-[12px]">
                      {t('connections.nameServer')}{' '}
                      <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
                    </div>
                    <input
                      className="rl-input font-mono-design"
                      placeholder="10.20.30.41:9876;10.20.30.42:9876"
                      value={form.nameServer}
                      onChange={(e) => setForm({ ...form, nameServer: e.target.value })}
                    />
                    <div className="rl-muted mt-1 text-[11px]">
                      {t('connections.nameServerHint')}
                    </div>
                  </div>
                  <div>
                    <div className="rl-muted mb-2 text-[12px]">{t('connections.timeout')}</div>
                    <div className="flex items-center gap-2">
                      <input
                        className="rl-input"
                        type="number"
                        min={1}
                        max={300}
                        value={form.timeoutSec}
                        onChange={(e) =>
                          setForm({ ...form, timeoutSec: Number(e.target.value) || 1 })
                        }
                      />
                      <span className="rl-muted text-[12px]">{t('connections.timeoutUnit')}</span>
                    </div>
                  </div>
                  <div
                    style={{
                      gridColumn: '1 / -1',
                      paddingTop: 12,
                      borderTop: '1px solid hsl(var(--border))',
                    }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="text-[13px] font-medium">{t('connections.enableAcl')}</div>
                        <div className="rl-muted mt-1 text-[12px]">
                          {t('connections.enableAclHint')}
                        </div>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={form.enableACL}
                        onClick={() => setForm({ ...form, enableACL: !form.enableACL })}
                        className={'rl-switch ' + (form.enableACL ? 'on' : '')}
                      />
                    </div>
                    {form.enableACL && (
                      <div className="mt-3 grid gap-3" style={{ gridTemplateColumns: '1fr 1fr' }}>
                        <div>
                          <div className="rl-muted mb-2 text-[12px]">{t('connections.ak')}</div>
                          <input
                            className="rl-input font-mono-design"
                            value={form.accessKey}
                            onChange={(e) => setForm({ ...form, accessKey: e.target.value })}
                          />
                        </div>
                        <div>
                          <div className="rl-muted mb-2 text-[12px]">{t('connections.sk')}</div>
                          <input
                            className="rl-input font-mono-design"
                            type="password"
                            value={form.secretKey}
                            onChange={(e) => setForm({ ...form, secretKey: e.target.value })}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <div className="rl-muted mb-2 text-[12px]">{t('connections.remark')}</div>
                    <input
                      className="rl-input"
                      placeholder={t('connections.remarkPlaceholder')}
                      value={form.remark}
                      onChange={(e) => setForm({ ...form, remark: e.target.value })}
                    />
                  </div>
                </div>
                <div
                  className="mt-5 flex flex-wrap gap-2"
                  style={{ paddingTop: 16, borderTop: '1px solid hsl(var(--border))' }}
                >
                  {!isNew && (
                    <button
                      className="rl-btn rl-btn-outline rl-btn-sm"
                      onClick={handleTest}
                      disabled={busy === 'test'}
                    >
                      {busy === 'test' ? <Spinner size={13} /> : <Wifi size={13} />}
                      {busy === 'test' ? t('connections.testing') : t('connections.test')}
                    </button>
                  )}
                  {!isNew && selected && (
                    <button
                      className="rl-btn rl-btn-ghost rl-btn-sm"
                      style={{ color: 'hsl(var(--destructive))' }}
                      onClick={() => setConfirmDelete(selected)}
                    >
                      <Trash2 size={13} />
                      {t('connections.deleteBtn')}
                    </button>
                  )}
                  <div style={{ marginLeft: 'auto' }} />
                  <button
                    className="rl-btn rl-btn-primary rl-btn-sm"
                    onClick={handleSave}
                    disabled={busy === 'save' || (!isNew && !dirty)}
                  >
                    {busy === 'save' ? <Spinner size={13} /> : <Check size={13} />}
                    {isNew ? t('connections.create') : t('connections.save')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete != null}
        title={t('connections.deleteBtn')}
        description={t('connections.deleteConfirm', { name: confirmDelete?.name ?? '' })}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        variant="destructive"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  )
}
