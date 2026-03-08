import { useState, useCallback, useEffect, useRef, type ReactNode } from 'react'
import { toast } from 'sonner'
import { Search, X, Loader2, Copy, CalendarIcon, Maximize2, Code, FileText, Binary } from 'lucide-react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { cn, formatErrorMessage } from '@/lib/utils'
import type { MessageItem } from '../../bindings/rocket-leaf/internal/model/models.js'
import { MessageStatus } from '../../bindings/rocket-leaf/internal/model/models.js'
import * as messageApi from '@/api/message'
import * as topicApi from '@/api/topic'
import * as clusterApi from '@/api/cluster'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'

const DEFAULT_MAX_RESULTS = 32

/** 尝试解析 JSON，返回解析结果或 null */
function tryParseJSON(s: string): unknown | null {
  if (!s?.trim()) return null
  try {
    return JSON.parse(s) as unknown
  } catch {
    return null
  }
}

/** 格式化 JSON 字符串 */
function formatJSONString(s: string): string {
  const parsed = tryParseJSON(s)
  if (parsed === null) return s
  try {
    return JSON.stringify(parsed, null, 2)
  } catch {
    return s
  }
}

/** 简单 JSON 语法高亮：key 绿、字符串值 琥珀、数字 蓝 */
function highlightJSON(jsonStr: string): ReactNode {
  const parts: ReactNode[] = []
  let lastIndex = 0
  const re = /"(?:[^"\\]|\\.)*"(?=\s*:)|:?\s*"(?:[^"\\]|\\.)*"|:?\s*(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(jsonStr)) !== null) {
    if (m.index > lastIndex) parts.push(jsonStr.slice(lastIndex, m.index))
    const token = m[0]
    const rest = jsonStr.slice(re.lastIndex)
    const isKey = token.startsWith('"') && token.endsWith('"') && /^\s*:/.test(rest)
    if (isKey) {
      parts.push(<span key={m.index} className="text-emerald-700 dark:text-emerald-400">{token}</span>)
    } else if (/^:?\s*"/.test(token)) {
      parts.push(<span key={m.index} className="text-amber-700 dark:text-amber-400">{token}</span>)
    } else if (/^:?\s*-?\d/.test(token)) {
      parts.push(<span key={m.index} className="text-sky-600 dark:text-sky-400">{token}</span>)
    } else {
      parts.push(token)
    }
    lastIndex = re.lastIndex
  }
  if (lastIndex < jsonStr.length) parts.push(jsonStr.slice(lastIndex))
  return parts.length > 0 ? parts : jsonStr
}

/** 将字符串转为十六进制视图（每行 16 字节） */
function toHexView(s: string): string {
  if (!s) return '（空）'
  const encoder = new TextEncoder()
  const bytes = encoder.encode(s)
  const lines: string[] = []
  for (let i = 0; i < bytes.length; i += 16) {
    const chunk = bytes.slice(i, i + 16)
    const hex = Array.from(chunk)
      .map((b) => b.toString(16).padStart(2, '0').toUpperCase())
      .join(' ')
    const ascii = Array.from(chunk)
      .map((b) => (b >= 32 && b < 127 ? String.fromCharCode(b) : '.'))
      .join('')
    lines.push(`${i.toString(16).padStart(6, '0')}  ${hex.padEnd(48)}  ${ascii}`)
  }
  return lines.length > 0 ? lines.join('\n') : '（空）'
}

/** RocketMQ 系统属性 Key 集合，用于与业务属性区分 */
const SYSTEM_PROP_KEYS = new Set([
  'RECONSUME_TIMES', 'MAX_RECONSUME_TIMES', 'STORE_SIZE', 'MSG_REGION', 'KEYS', 'TAGS', 'REAL_TOPIC',
  'UNIQ_KEY', 'DELAY', 'TRANSACTION_PREPARED', '__TRAN_MSG', 'BORN_HOST', 'STORE_HOST', 'BORN_TIMESTAMP',
  'STORE_TIMESTAMP', 'QUEUE_ID', 'SYS_FLAG', 'MIN_OFFSET', 'MAX_OFFSET', 'CONSUME_START_TIME',
])

/** 将 datetime-local 字符串转为 Date，无效则返回 undefined */
function parseDatetimeLocal(s: string): Date | undefined {
  if (!s?.trim()) return undefined
  const d = new Date(s.trim())
  return Number.isNaN(d.getTime()) ? undefined : d
}

/** 将 Date 格式化为 datetime-local 的 value (YYYY-MM-DDTHH:mm) */
function toDatetimeLocalValue(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${day}T${h}:${min}`
}

function DateTimePicker({
  value,
  onChange,
  id,
  labelId,
  placeholder = '选择日期时间',
}: {
  value: string
  onChange: (v: string) => void
  id: string
  labelId: string
  placeholder?: string
}) {
  const date = parseDatetimeLocal(value)
  const [open, setOpen] = useState(false)
  const [timePart, setTimePart] = useState(() => {
    if (date) return format(date, 'HH:mm')
    return '00:00'
  })

  const handleSelect = useCallback(
    (d: Date | undefined) => {
      if (!d) return
      const parts = timePart.split(':')
      const h = Number(parts[0]) || 0
      const min = Number(parts[1]) || 0
      d.setHours(h, min, 0, 0)
      onChange(toDatetimeLocalValue(d))
    },
    [timePart, onChange]
  )

  const handleTimeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const t = e.target.value
      setTimePart(t)
      const base = date ?? new Date()
      const parts = t.split(':')
      const h = Number(parts[0]) || 0
      const min = Number(parts[1]) || 0
      base.setHours(h, min, 0, 0)
      onChange(toDatetimeLocalValue(base))
    },
    [date, onChange]
  )

  useEffect(() => {
    if (date) setTimePart(format(date, 'HH:mm'))
  }, [value])

  const displayText = date ? format(date, 'yyyy/MM/dd HH:mm', { locale: zhCN }) : ''

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          aria-labelledby={labelId}
          title={displayText || placeholder}
          className={cn(
            'flex h-9 w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground',
            'hover:bg-muted/30 focus:outline-none focus:ring-1 focus:ring-ring focus:ring-offset-0'
          )}
        >
          <span className={displayText ? 'text-foreground' : 'text-muted-foreground'}>
            {displayText || placeholder}
          </span>
          <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          locale={zhCN}
        />
        <div className="border-t border-border/40 p-3">
          <label id={`${id}-time-label`} htmlFor={`${id}-time`} className="mb-1.5 block text-xs text-muted-foreground">
            时间
          </label>
          <input
            id={`${id}-time`}
            type="time"
            value={timePart}
            onChange={handleTimeChange}
            title="选择时间"
            aria-labelledby={`${id}-time-label`}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}

/** 消息状态/类型，用于 Badge 展示 */
type MessageBadgeType = 'normal' | 'retry' | 'dlq' | 'delay' | 'transaction'

function getMessageBadgeType(m: MessageItem): MessageBadgeType {
  const status = m.status
  const props = m.properties ?? {}
  if (props['TRANSACTION_PREPARED'] != null || props['__TRAN_MSG'] != null) return 'transaction'
  if (props['DELAY'] != null || props['__RETRY_TOPIC'] != null && props['REAL_TOPIC'] != null) return 'delay'
  if (status === MessageStatus.MsgRetry) return 'retry'
  if (status === MessageStatus.MsgDLQ) return 'dlq'
  return 'normal'
}

function MessageBadge({ type }: { type: MessageBadgeType }) {
  const [label, className] = {
    normal: ['正常', 'bg-muted/70 text-muted-foreground'],
    retry: ['重试', 'bg-amber-500/15 text-amber-700 dark:text-amber-400'],
    dlq: ['死信', 'bg-red-500/15 text-red-700 dark:text-red-400'],
    delay: ['延时', 'bg-sky-500/15 text-sky-700 dark:text-sky-400'],
    transaction: ['事务', 'bg-violet-500/15 text-violet-700 dark:text-violet-400'],
  }[type]
  return (
    <span className={cn('shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium', className)}>
      {label}
    </span>
  )
}

/** 将 datetime-local 输入转为 Unix 毫秒 */
function fromDatetimeLocalInput(s: string): number {
  if (!s || !s.trim()) return 0
  const n = new Date(s.trim()).getTime()
  return Number.isNaN(n) ? 0 : n
}

function TopicCombobox({
  value,
  onChange,
  options,
  id,
  labelId,
  placeholder = '选择或输入 Topic',
}: {
  value: string
  onChange: (v: string) => void
  options: string[]
  id: string
  labelId: string
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const filtered = value.trim()
    ? options.filter((o) => o.toLowerCase().includes(value.toLowerCase()))
    : options
  const showList = open && filtered.length > 0

  useEffect(() => {
    if (!showList) return
    const onPointer = (e: PointerEvent) => {
      if (containerRef.current?.contains(e.target as Node)) return
      setOpen(false)
    }
    const t = setTimeout(() => {
      document.addEventListener('pointerdown', onPointer)
    }, 0)
    return () => {
      clearTimeout(t)
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [showList])

  const ariaExpandedValue = showList ? 'true' : 'false'

  return (
    <div ref={containerRef} className="relative">
      {/* aria-expanded 使用字符串 'true'|'false' 以符合 ARIA 规范，静态检查对变量误报 */}
      <input
        id={id}
        type="text"
        role="combobox"
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        title={placeholder}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
        aria-labelledby={labelId}
        aria-expanded={ariaExpandedValue}
        aria-autocomplete="list"
        aria-controls={showList ? `${id}-listbox` : undefined}
      />
      {showList && (
        <ul
          id={`${id}-listbox`}
          role="listbox"
          className="absolute left-0 right-0 top-full z-10 mt-0.5 min-w-[320px] max-h-48 overflow-y-auto rounded-md border border-border/40 bg-card py-1 scroll-thin"
        >
          {filtered.map((name) => {
            const isSelected = value === name
            const ariaSelectedValue = isSelected ? 'true' : 'false'
            return (
              <li
                key={name}
                role="option"
                aria-selected={ariaSelectedValue}
                onPointerDown={(e) => {
                  e.preventDefault()
                  onChange(name)
                  setOpen(false)
                }}
                className={cn(
                  'cursor-pointer px-3 py-2 font-mono text-sm text-foreground transition-colors hover:bg-accent/70',
                  isSelected && 'bg-accent/50'
                )}
              >
                {name}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export function MessageView() {
  const [clusterName, setClusterName] = useState('')
  const [topicOptions, setTopicOptions] = useState<string[]>([])
  const [topic, setTopic] = useState('')
  const [messageId, setMessageId] = useState('')
  const [messageKey, setMessageKey] = useState('')
  const [startTimeInput, setStartTimeInput] = useState('')
  const [endTimeInput, setEndTimeInput] = useState('')
  const [maxResults, setMaxResults] = useState(DEFAULT_MAX_RESULTS)
  const [loading, setLoading] = useState(false)
  const [list, setList] = useState<MessageItem[]>([])
  const [selectedMessage, setSelectedMessage] = useState<MessageItem | null>(null)
  const [bodyViewMode, setBodyViewMode] = useState<'raw' | 'hex' | 'json'>('raw')
  const [bodyFormatted, setBodyFormatted] = useState<string | null>(null)
  const [bodyFullscreenOpen, setBodyFullscreenOpen] = useState(false)

  useEffect(() => {
    if (selectedMessage) {
      setBodyViewMode('raw')
      setBodyFormatted(null)
    }
  }, [selectedMessage])

  // 默认拉取所有 Topic 供下拉选择；并拉取当前集群名用于展示
  useEffect(() => {
    let cancelled = false
    topicApi.getTopics().then((items) => {
      if (cancelled) return
      const names = (items ?? [])
        .filter((t): t is NonNullable<typeof t> => t != null && t.topic != null)
        .map((t) => t.topic)
        .filter((n) => n.length > 0)
      setTopicOptions([...new Set(names)].sort())
    }).catch(() => { })
    clusterApi.getClusterInfo().then((info) => {
      if (cancelled || !info?.clusterName) return
      setClusterName(info.clusterName)
    }).catch(() => { })
    return () => { cancelled = true }
  }, [])

  const runQuery = useCallback(async () => {
    const t = topic.trim()
    if (!t) {
      toast.error('请选择或输入 Topic')
      return
    }
    setLoading(true)
    setList([])
    setSelectedMessage(null)
    try {
      const msgIdTrim = messageId.trim()
      if (msgIdTrim) {
        const data = await messageApi.queryMessageByID(t, msgIdTrim)
        if (data) {
          setList([data])
          setSelectedMessage(data)
        } else {
          toast.info('未查询到消息')
        }
        return
      }
      const startMs = fromDatetimeLocalInput(startTimeInput)
      const endMs = fromDatetimeLocalInput(endTimeInput)
      const data = await messageApi.queryMessages(
        t,
        messageKey.trim(),
        maxResults > 0 ? maxResults : DEFAULT_MAX_RESULTS,
        startMs,
        endMs
      )
      const items = data.filter((m): m is MessageItem => m != null)
      setList(items)
      if (items.length === 0) toast.info('未查询到消息')
    } catch (e) {
      const msg = (() => {
        try {
          return formatErrorMessage(e)
        } catch {
          return '查询失败'
        }
      })()
      toast.error(msg.trim().startsWith('{') ? '查询失败' : msg)
    } finally {
      setLoading(false)
    }
  }, [topic, messageId, messageKey, maxResults, startTimeInput, endTimeInput])

  const copyMessageId = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    navigator.clipboard.writeText(id).then(() => toast.success('已复制 Message ID')).catch(() => toast.error('复制失败'))
  }, [])

  const copyBody = useCallback((text: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success('已复制 Body')).catch(() => toast.error('复制失败'))
  }, [])

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b border-border/40 px-4 py-3 -[--wails-draggable:drag]">
        <h1 className="text-sm font-medium text-foreground">消息</h1>
      </div>
      <div className="flex min-h-0 flex-1">
        <div className="flex flex-1 flex-col overflow-y-auto scroll-thin p-4">
          <div className="mx-auto max-w-4xl space-y-4">
            {/* 多维条件检索表单 */}
            <section className="rounded-md border border-border/40 bg-card p-4">
              <h2 className="mb-3 text-xs font-medium text-muted-foreground">多维条件检索</h2>
              <div className="space-y-3">
                <div className="flex flex-wrap items-end gap-3">
                  {clusterName && (
                    <div className="min-w-[100px]">
                      <span className="mb-1 block text-xs text-muted-foreground">集群</span>
                      <span className="block rounded-md border border-border/40 bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                        {clusterName}
                      </span>
                    </div>
                  )}
                  <div className="min-w-[160px] flex-1">
                    <label id="msg-topic-label" className="mb-1 block text-xs text-muted-foreground">Topic（必选）</label>
                    <TopicCombobox
                      id="msg-topic"
                      labelId="msg-topic-label"
                      value={topic}
                      onChange={setTopic}
                      options={topicOptions}
                    />
                  </div>
                  <div className="min-w-[140px] flex-1">
                    <label id="msg-msgid-label" className="mb-1 block text-xs text-muted-foreground">Message ID</label>
                    <input
                      id="msg-msgid"
                      type="text"
                      value={messageId}
                      onChange={(e) => setMessageId(e.target.value)}
                      placeholder="精确查询"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
                      aria-labelledby="msg-msgid-label"
                    />
                  </div>
                  <div className="min-w-[140px] flex-1">
                    <label id="msg-key-label" className="mb-1 block text-xs text-muted-foreground">Message Key</label>
                    <input
                      id="msg-key"
                      type="text"
                      value={messageKey}
                      onChange={(e) => setMessageKey(e.target.value)}
                      placeholder="如订单号"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
                      aria-labelledby="msg-key-label"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap items-end gap-3">
                  <div className="min-w-[180px]">
                    <label id="msg-start-label" className="mb-1 block text-xs text-muted-foreground">开始时间</label>
                    <DateTimePicker
                      id="msg-start"
                      labelId="msg-start-label"
                      value={startTimeInput}
                      onChange={setStartTimeInput}
                      placeholder="选择开始时间"
                    />
                  </div>
                  <div className="min-w-[180px]">
                    <label id="msg-end-label" className="mb-1 block text-xs text-muted-foreground">结束时间</label>
                    <DateTimePicker
                      id="msg-end"
                      labelId="msg-end-label"
                      value={endTimeInput}
                      onChange={setEndTimeInput}
                      placeholder="选择结束时间"
                    />
                  </div>
                  <div className="w-20 shrink-0">
                    <label id="msg-max-label" className="mb-1 block text-xs text-muted-foreground">条数</label>
                    <input
                      id="msg-max"
                      type="number"
                      min={1}
                      max={64}
                      value={maxResults}
                      onChange={(e) => setMaxResults(Number(e.target.value) || DEFAULT_MAX_RESULTS)}
                      className="w-full rounded-md border border-input bg-background px-2 py-2 text-sm"
                      aria-labelledby="msg-max-label"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={runQuery}
                    disabled={loading}
                    className="inline-flex shrink-0 items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    查询
                  </button>
                </div>
              </div>
            </section>

            {/* 消息列表：有数据时展示表格，无数据时展示占位 */}
            <section>
              <h2 className="mb-2 text-xs font-medium text-muted-foreground">
                {list.length > 0 ? `查询结果（共 ${list.length} 条）` : '消息列表'}
              </h2>
              <div className="rounded-md border border-border/40 bg-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/40 bg-muted/20">
                        <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Message ID</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Tag</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Keys</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Store Time</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Born Host</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">状态</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {list.length > 0 ? (
                        list.map((m) => (
                          <tr
                            key={m.messageId ?? m.id}
                            onClick={() => setSelectedMessage(m)}
                            className={cn(
                              'cursor-pointer transition-colors hover:bg-accent/50',
                              selectedMessage?.messageId === m.messageId && 'bg-accent/50'
                            )}
                          >
                            <td className="px-3 py-2 font-mono text-foreground">
                              <span className="flex items-center gap-1.5">
                                <span className="truncate max-w-[180px]" title={m.messageId ?? ''}>
                                  {m.messageId ?? '—'}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => copyMessageId(e, m.messageId ?? '')}
                                  className="shrink-0 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                                  title="复制 Message ID"
                                  aria-label="复制"
                                >
                                  <Copy className="h-3.5 w-3.5" />
                                </button>
                              </span>
                            </td>
                            <td className="px-3 py-2 font-mono text-muted-foreground truncate max-w-[100px]" title={m.tags ?? ''}>
                              {m.tags ?? '—'}
                            </td>
                            <td className="px-3 py-2 font-mono text-muted-foreground truncate max-w-[120px]" title={m.keys ?? ''}>
                              {m.keys ?? '—'}
                            </td>
                            <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">{m.storeTime ?? '—'}</td>
                            <td className="px-3 py-2 font-mono text-muted-foreground truncate max-w-[120px]" title={m.bornHost ?? ''}>
                              {m.bornHost ?? '—'}
                            </td>
                            <td className="px-3 py-2">
                              <MessageBadge type={getMessageBadgeType(m)} />
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-3 py-8 text-center text-sm text-muted-foreground">
                            {loading ? '查询中…' : '请选择 Topic 并点击「查询」获取消息列表'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              {list.length > 0 && (
                <p className="mt-1.5 text-xs text-muted-foreground">点击行查看详情 · 支持基于时间范围与条数分页拉取</p>
              )}
            </section>
          </div>
        </div>

        {/* 详情抽屉 */}
        {selectedMessage && (
          <div className="flex w-[400px] shrink-0 flex-col border-l border-border/40 bg-card">
            <div className="flex shrink-0 items-center justify-between border-b border-border/30 px-3 py-2.5">
              <span className="truncate text-sm font-medium text-foreground">消息详情</span>
              <button
                type="button"
                onClick={() => setSelectedMessage(null)}
                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                aria-label="关闭"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto scroll-thin p-3">
              <div className="space-y-4 text-sm">
                <div className="space-y-1.5">
                  <p>
                    <span className="text-muted-foreground">Topic：</span>
                    <span className="font-mono text-foreground">{selectedMessage.topic}</span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Message ID：</span>
                    <span className="break-all font-mono text-foreground">{selectedMessage.messageId}</span>
                  </p>
                  {selectedMessage.tags != null && selectedMessage.tags !== '' && (
                    <p>
                      <span className="text-muted-foreground">Tags：</span>
                      <span className="font-mono text-foreground">{selectedMessage.tags}</span>
                    </p>
                  )}
                  {selectedMessage.keys != null && selectedMessage.keys !== '' && (
                    <p>
                      <span className="text-muted-foreground">Keys：</span>
                      <span className="font-mono text-foreground">{selectedMessage.keys}</span>
                    </p>
                  )}
                  <p>
                    <span className="text-muted-foreground">存储时间：</span>
                    <span className="text-foreground">{selectedMessage.storeTime ?? '—'}</span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">队列：</span>
                    <span className="text-foreground">{selectedMessage.queueId} / offset {selectedMessage.queueOffset}</span>
                  </p>
                  {selectedMessage.storeHost && (
                    <p>
                      <span className="text-muted-foreground">存储节点：</span>
                      <span className="font-mono text-muted-foreground">{selectedMessage.storeHost}</span>
                    </p>
                  )}
                  {selectedMessage.bornHost && (
                    <p>
                      <span className="text-muted-foreground">生产节点：</span>
                      <span className="font-mono text-muted-foreground">{selectedMessage.bornHost}</span>
                    </p>
                  )}
                </div>
                {/* 智能 Payload 解析器：Raw / Hex / JSON 切换 + 格式化 + 复制 + 全屏 */}
                <div>
                  <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-xs font-medium text-muted-foreground">消息体</h3>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setBodyViewMode('raw')}
                        className={cn(
                          'rounded px-2 py-1 text-[10px] font-medium transition-colors',
                          bodyViewMode === 'raw' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-muted'
                        )}
                        title="原始文本"
                      >
                        <FileText className="mr-0.5 inline h-3 w-3" /> Raw
                      </button>
                      <button
                        type="button"
                        onClick={() => setBodyViewMode('hex')}
                        className={cn(
                          'rounded px-2 py-1 text-[10px] font-medium transition-colors',
                          bodyViewMode === 'hex' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-muted'
                        )}
                        title="十六进制"
                      >
                        <Binary className="mr-0.5 inline h-3 w-3" /> Hex
                      </button>
                      {tryParseJSON(selectedMessage.body ?? '') != null && (
                        <button
                          type="button"
                          onClick={() => setBodyViewMode('json')}
                          className={cn(
                            'rounded px-2 py-1 text-[10px] font-medium transition-colors',
                            bodyViewMode === 'json' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-muted'
                          )}
                          title="JSON"
                        >
                          <Code className="mr-0.5 inline h-3 w-3" /> JSON
                        </button>
                      )}
                      {bodyViewMode === 'json' && (
                        <button
                          type="button"
                          onClick={() => setBodyFormatted((prev) => (prev != null ? null : formatJSONString(selectedMessage.body ?? '')))}
                          className="rounded px-2 py-1 text-[10px] font-medium text-muted-foreground hover:bg-muted"
                          title={bodyFormatted != null ? '恢复压缩' : '格式化'}
                        >
                          {bodyFormatted != null ? '压缩' : 'Format'}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => copyBody(selectedMessage.body ?? '')}
                        className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                        title="复制 Body"
                        aria-label="复制 Body"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setBodyFullscreenOpen(true)}
                        className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                        title="全屏查看"
                        aria-label="全屏"
                      >
                        <Maximize2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <pre className="max-h-48 overflow-auto rounded-md border border-border/40 bg-muted/30 p-3 font-mono text-xs text-foreground whitespace-pre-wrap wrap-anywhere scroll-thin">
                    {bodyViewMode === 'hex'
                      ? toHexView(selectedMessage.body ?? '')
                      : bodyViewMode === 'json'
                        ? highlightJSON(
                            bodyFormatted ?? (tryParseJSON(selectedMessage.body ?? '') != null ? formatJSONString(selectedMessage.body ?? '') : selectedMessage.body ?? '（空）')
                          )
                        : (selectedMessage.body != null && selectedMessage.body !== '' ? selectedMessage.body : '（空）')}
                  </pre>
                </div>

                {/* 全屏 Body 弹层 */}
                {bodyFullscreenOpen && (
                  <div
                    className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur-sm"
                    role="dialog"
                    aria-modal="true"
                    aria-label="消息体全屏"
                  >
                    <div className="flex shrink-0 items-center justify-between border-b border-border/40 px-4 py-2">
                      <span className="text-sm font-medium text-foreground">消息体</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => copyBody(selectedMessage.body ?? '')}
                          className="rounded-md border border-border/40 px-2 py-1.5 text-xs hover:bg-accent"
                        >
                          复制
                        </button>
                        <button
                          type="button"
                          onClick={() => setBodyFullscreenOpen(false)}
                          className="rounded-md border border-border/40 px-2 py-1.5 text-xs hover:bg-accent"
                        >
                          关闭
                        </button>
                      </div>
                    </div>
                    <pre className="flex-1 overflow-auto p-4 font-mono text-xs text-foreground whitespace-pre-wrap wrap-anywhere scroll-thin">
                      {bodyViewMode === 'hex'
                        ? toHexView(selectedMessage.body ?? '')
                        : bodyViewMode === 'json'
                          ? highlightJSON(bodyFormatted ?? formatJSONString(selectedMessage.body ?? ''))
                          : (selectedMessage.body ?? '（空）')}
                    </pre>
                  </div>
                )}

                {/* 全景 Properties：系统属性 + 业务属性 */}
                {selectedMessage.properties != null && Object.keys(selectedMessage.properties).length > 0 && (() => {
                  const entries = Object.entries(selectedMessage.properties)
                  const systemEntries = entries.filter(([k]) => SYSTEM_PROP_KEYS.has(k))
                  const userEntries = entries.filter(([k]) => !SYSTEM_PROP_KEYS.has(k))
                  return (
                    <>
                      {systemEntries.length > 0 && (
                        <div>
                          <h3 className="mb-1.5 text-xs font-medium text-muted-foreground">系统属性 (System Properties)</h3>
                          <ul className="space-y-1.5 rounded-md border border-border/40 bg-muted/20 py-2">
                            {systemEntries.map(([k, v]) => (
                              <li key={k} className="flex justify-between gap-2 px-3 text-xs">
                                <span className="font-medium text-muted-foreground">{k}</span>
                                <span className="truncate font-mono text-foreground">{v ?? '—'}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {userEntries.length > 0 && (
                        <div>
                          <h3 className="mb-1.5 text-xs font-medium text-muted-foreground">业务属性 (User Properties)</h3>
                          <div className="overflow-hidden rounded-md border border-border/40">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="border-b border-border/40 bg-muted/20">
                                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Key</th>
                                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Value</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border/30">
                                {userEntries.map(([k, v]) => (
                                  <tr key={k}>
                                    <td className="px-3 py-2 font-mono text-muted-foreground">{k}</td>
                                    <td className="max-w-[200px] truncate px-3 py-2 font-mono text-foreground" title={String(v ?? '')}>{v ?? '—'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </>
                  )
                })()}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
