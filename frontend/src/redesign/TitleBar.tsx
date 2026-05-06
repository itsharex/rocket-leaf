import { useMemo, useState, useCallback, useEffect } from 'react'
import { Minus, Square, SquareMinus, X, Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Window } from '@wailsio/runtime'
import logoUrl from '@/assets/logo.png'

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
  const { t } = useTranslation()
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
        <img src={logoUrl} alt="" className="logo-img" aria-hidden />
        <div className="title">{t('app.name')}</div>
        <div className="rl-muted" style={{ fontSize: 11 }}>— {t('app.tagline')}</div>
        <div className="rl-titlebar-spacer" />
        {aiEnabled && (
          <button
            className="rl-ai-pill [--wails-draggable:no-drag]"
            type="button"
          >
            <span className="ai-spark"><Sparkles size={11} /></span>
            <span>{t('titlebar.aiAssistant')}</span>
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
            <button type="button" onClick={handleMinimise} className={winBtnClass} title={t('common.minimize')} aria-label={t('common.minimize')}>
              <Minus className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleToggleMaximise}
              className={winBtnClass}
              title={isMaximised ? t('common.restore') : t('common.maximize')}
              aria-label={isMaximised ? t('common.restore') : t('common.maximize')}
            >
              {isMaximised ? <SquareMinus className="h-4 w-4" /> : <Square className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={() => setShowCloseConfirm(true)}
              className={closeBtnClass}
              title={t('common.close')}
              aria-label={t('common.close')}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </header>

      <ConfirmDialog
        open={showCloseConfirm}
        title={t('common.exitApp')}
        description={t('common.exitAppConfirm')}
        confirmText={t('common.exit')}
        cancelText={t('common.cancel')}
        variant="destructive"
        onConfirm={() => Window.Close().catch(() => { })}
        onCancel={() => setShowCloseConfirm(false)}
      />
    </>
  )
}
