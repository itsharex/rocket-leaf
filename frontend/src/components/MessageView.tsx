import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { Search, X, Loader2, FileText } from 'lucide-react'
import { cn, formatErrorMessage } from '@/lib/utils'
import type { MessageItem } from '../../bindings/rocket-leaf/internal/model/models.js'
import * as messageApi from '@/api/message'

const DEFAULT_MAX_RESULTS = 32

export function MessageView() {
  const [topic, setTopic] = useState('')
  const [key, setKey] = useState('')
  const [maxResults, setMaxResults] = useState(DEFAULT_MAX_RESULTS)
  const [msgIdTopic, setMsgIdTopic] = useState('')
  const [msgId, setMsgId] = useState('')
  const [loading, setLoading] = useState(false)
  const [list, setList] = useState<MessageItem[]>([])
  const [selectedMessage, setSelectedMessage] = useState<MessageItem | null>(null)

  const handleQuery = useCallback(async () => {
    const t = topic.trim()
    if (!t) {
      toast.error('请输入 Topic')
      return
    }
    setLoading(true)
    setList([])
    setSelectedMessage(null)
    try {
      const data = await messageApi.queryMessages(t, key.trim(), maxResults > 0 ? maxResults : DEFAULT_MAX_RESULTS)
      const items = data.filter((m): m is MessageItem => m != null)
      setList(items)
      if (items.length === 0) toast.info('未查询到消息')
    } catch (e) {
      let msg: string
      try {
        msg = formatErrorMessage(e)
      } catch {
        msg = '查询失败'
      }
      if (msg.trim().startsWith('{')) msg = '查询失败'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }, [topic, key, maxResults])

  const handleQueryByMsgId = useCallback(async () => {
    const t = msgIdTopic.trim()
    const id = msgId.trim()
    if (!t || !id) {
      toast.error('请输入 Topic 和 Message ID')
      return
    }
    setLoading(true)
    setList([])
    setSelectedMessage(null)
    try {
      const data = await messageApi.queryMessageByID(t, id)
      if (data) {
        setList([data])
        setSelectedMessage(data)
      } else {
        setList([])
        toast.info('未查询到消息')
      }
    } catch (e) {
      let msg: string
      try {
        msg = formatErrorMessage(e)
      } catch {
        msg = '查询失败'
      }
      if (msg.trim().startsWith('{')) msg = '查询失败'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }, [msgIdTopic, msgId])

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b border-border/40 px-4 py-3">
        <h1 className="text-sm font-medium text-foreground">消息</h1>
      </div>
      <div className="flex min-h-0 flex-1">
        <div className="flex flex-1 flex-col overflow-y-auto scroll-thin p-4">
          <div className="mx-auto max-w-2xl space-y-4">
            {/* 按条件查询 */}
            <section className="rounded-md border border-border/40 bg-card p-4">
              <h2 className="mb-3 text-xs font-medium text-muted-foreground">按 Topic / Key 查询</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label id="msg-topic-label" className="mb-1 block text-xs text-muted-foreground">Topic</label>
                  <input
                    id="msg-topic"
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="必填"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
                    aria-labelledby="msg-topic-label"
                  />
                </div>
                <div>
                  <label id="msg-key-label" className="mb-1 block text-xs text-muted-foreground">Key（可选）</label>
                  <input
                    id="msg-key"
                    type="text"
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    placeholder="消息 Key"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
                    aria-labelledby="msg-key-label"
                  />
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <label id="msg-max-label" className="text-xs text-muted-foreground">最大条数</label>
                  <input
                    id="msg-max"
                    type="number"
                    min={1}
                    max={64}
                    value={maxResults}
                    onChange={(e) => setMaxResults(Number(e.target.value) || DEFAULT_MAX_RESULTS)}
                    className="w-20 rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                    aria-labelledby="msg-max-label"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleQuery}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  查询
                </button>
              </div>
            </section>

            {/* 按 Message ID 查询 */}
            <section className="rounded-md border border-border/40 bg-card p-4">
              <h2 className="mb-3 text-xs font-medium text-muted-foreground">按 Message ID 查询</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label id="msgid-topic-label" className="mb-1 block text-xs text-muted-foreground">Topic</label>
                  <input
                    id="msgid-topic"
                    type="text"
                    value={msgIdTopic}
                    onChange={(e) => setMsgIdTopic(e.target.value)}
                    placeholder="必填"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
                    aria-labelledby="msgid-topic-label"
                  />
                </div>
                <div>
                  <label id="msgid-id-label" className="mb-1 block text-xs text-muted-foreground">Message ID</label>
                  <input
                    id="msgid-id"
                    type="text"
                    value={msgId}
                    onChange={(e) => setMsgId(e.target.value)}
                    placeholder="必填"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
                    aria-labelledby="msgid-id-label"
                  />
                </div>
              </div>
              <div className="mt-3">
                <button
                  type="button"
                  onClick={handleQueryByMsgId}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-md border border-border/40 bg-background px-3 py-1.5 text-sm hover:bg-accent disabled:opacity-50"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  查询
                </button>
              </div>
            </section>

            {/* 结果列表 */}
            {list.length > 0 && (
              <section>
                <h2 className="mb-2 text-xs font-medium text-muted-foreground">查询结果（{list.length} 条）</h2>
                <div className="rounded-md border border-border/40 bg-card">
                  <ul className="divide-y divide-border/30">
                    {list.map((m) => (
                      <li
                        key={m.messageId ?? m.id}
                        onClick={() => setSelectedMessage(m)}
                        className={cn(
                          'flex cursor-pointer items-center justify-between gap-2 px-3 py-2 transition-colors hover:bg-accent/50',
                          selectedMessage?.messageId === m.messageId && 'bg-accent/50'
                        )}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-mono text-sm text-foreground">{m.messageId}</p>
                          <div className="mt-0.5 flex flex-wrap gap-2 text-xs text-muted-foreground">
                            <span>{m.topic}</span>
                            {m.tags && <span>Tag: {m.tags}</span>}
                            {m.keys && <span>Key: {m.keys}</span>}
                            {m.storeTime && <span>{m.storeTime}</span>}
                          </div>
                        </div>
                        <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            )}
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
                <div>
                  <h3 className="mb-1.5 text-xs font-medium text-muted-foreground">消息体</h3>
                  <pre className="max-h-48 overflow-auto rounded-md border border-border/40 bg-muted/30 p-3 font-mono text-xs text-foreground whitespace-pre-wrap wrap-anywhere">
                    {selectedMessage.body != null && selectedMessage.body !== ''
                      ? selectedMessage.body
                      : '（空）'}
                  </pre>
                </div>
                {selectedMessage.properties != null && Object.keys(selectedMessage.properties).length > 0 && (
                  <div>
                    <h3 className="mb-1.5 text-xs font-medium text-muted-foreground">属性</h3>
                    <ul className="space-y-1 rounded-md border border-border/40 py-2">
                      {Object.entries(selectedMessage.properties).map(([k, v]) => (
                        <li key={k} className="flex justify-between gap-2 px-3 text-xs">
                          <span className="text-muted-foreground">{k}</span>
                          <span className="truncate font-mono text-foreground">{v ?? ''}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
