import { useMemo, useState, useCallback, useEffect } from 'react'
import { Minus, Square, SquareMinus, X, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Window } from '@wailsio/runtime'

function isMac(): boolean {
  if (typeof navigator === 'undefined') return false
  return navigator.platform === 'MacIntel' || /Mac|Darwin/.test(navigator.userAgent)
}

export function TitleBar({
  connected = 'prod-cluster-01',
  aiEnabled = true,
}: {
  connected?: string | null
  aiEnabled?: boolean
}) {
  const mac = useMemo(isMac, [])
  const [isMaximised, setIsMaximised] = useState(false)
  const [showCloseConfirm, setShowCloseConfirm] = useState(false)

  const refreshMaximised = useCallback(async () => {
    try {
      const max = await Window.IsMaximised()
      setIsMaximised(max)
    } catch {
      setIsMaximised(false)
    }
  }, [])

  useEffect(() => {
    refreshMaximised()
  }, [refreshMaximised])

  const handleMinimise = useCallback(() => {
    Window.Minimise().catch(() => { })
  }, [])
  const handleToggleMaximise = useCallback(() => {
    Window.ToggleMaximise().then(refreshMaximised).catch(() => { })
  }, [refreshMaximised])

  const winBtnClass =
    'flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground [--wails-draggable:no-drag]'
  const closeBtnClass =
    'flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/15 hover:text-destructive [--wails-draggable:no-drag]'

  return (
    <>
      <header
        className={cn(
          'rl-title-bar [--wails-draggable:drag]',
          mac ? '' : '!pl-3'
        )}
        style={mac ? undefined : { paddingLeft: 12 }}
      >
        {mac && (
          <div className="traffic">
            <span className="c1" />
            <span className="c2" />
            <span className="c3" />
          </div>
        )}
        <div className="logo">RL</div>
        <div className="title">Rocket-Leaf</div>
        <div className="rl-muted" style={{ fontSize: 11 }}>— RocketMQ 桌面客户端</div>
        <div className="rl-titlebar-spacer" />
        {aiEnabled && (
          <button
            className="rl-ai-pill [--wails-draggable:no-drag]"
            type="button"
          >
            <span className="ai-spark"><Sparkles size={11} /></span>
            <span>AI 助手</span>
            <span className="kbd-mini">⌘K</span>
          </button>
        )}
        {connected && (
          <div className="conn-pill">
            <span className="dot" />
            <span className="font-mono-design" style={{ fontSize: 11 }}>{connected}</span>
          </div>
        )}
        {!mac && (
          <div className="flex shrink-0 items-center gap-0.5" style={{ marginLeft: 8 }}>
            <button type="button" onClick={handleMinimise} className={winBtnClass} title="最小化" aria-label="最小化">
              <Minus className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleToggleMaximise}
              className={winBtnClass}
              title={isMaximised ? '还原' : '最大化'}
              aria-label={isMaximised ? '还原' : '最大化'}
            >
              {isMaximised ? <SquareMinus className="h-4 w-4" /> : <Square className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={() => setShowCloseConfirm(true)}
              className={closeBtnClass}
              title="关闭"
              aria-label="关闭"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </header>

      <ConfirmDialog
        open={showCloseConfirm}
        title="退出应用"
        description="确定要关闭 Rocket-Leaf 吗？"
        confirmText="退出"
        cancelText="取消"
        variant="destructive"
        onConfirm={() => Window.Close().catch(() => { })}
        onCancel={() => setShowCloseConfirm(false)}
      />
    </>
  )
}
