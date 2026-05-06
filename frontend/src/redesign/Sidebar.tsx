import { Fragment } from 'react'
import {
  Home,
  LayoutGrid,
  Users,
  Mail,
  Send,
  BarChart3,
  Bell,
  Shield,
  Server,
  Github,
  Settings,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Browser } from '@wailsio/runtime'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

const GITHUB_URL = 'https://github.com/amigoer/rocket-leaf'

export type NavId =
  | 'home'
  | 'topics'
  | 'consumers'
  | 'messages'
  | 'producer'
  | 'cluster'
  | 'alerts'
  | 'acl'
  | 'connections'
  | 'github'
  | 'settings'

type NavItem = { id: NavId; icon: LucideIcon; labelKey: string; href?: string }

const GROUPS: NavItem[][] = [
  [{ id: 'home', icon: Home, labelKey: 'nav.home' }],
  [
    { id: 'topics', icon: LayoutGrid, labelKey: 'nav.topics' },
    { id: 'consumers', icon: Users, labelKey: 'nav.consumers' },
    { id: 'messages', icon: Mail, labelKey: 'nav.messages' },
    { id: 'producer', icon: Send, labelKey: 'nav.producer' },
  ],
  [
    { id: 'cluster', icon: BarChart3, labelKey: 'nav.cluster' },
    { id: 'alerts', icon: Bell, labelKey: 'nav.alerts' },
    { id: 'acl', icon: Shield, labelKey: 'nav.acl' },
  ],
  [{ id: 'connections', icon: Server, labelKey: 'nav.connections' }],
]

const BOTTOM: NavItem[] = [
  { id: 'github', icon: Github, labelKey: 'nav.github', href: GITHUB_URL },
  { id: 'settings', icon: Settings, labelKey: 'nav.settings' },
]

export function Sidebar({
  active,
  onSelect,
  disabledIds = [],
}: {
  active: NavId
  onSelect: (id: NavId) => void
  disabledIds?: NavId[]
}) {
  const { t } = useTranslation()
  const renderItem = (item: NavItem, isBottom = false) => {
    const { id, icon: Icon, labelKey, href } = item
    const label = t(labelKey)
    const disabled = !isBottom && disabledIds.includes(id)
    const isActive = active === id

    if (href) {
      return (
        <button
          key={id}
          type="button"
          className={cn('item', isActive && 'active')}
          title={label}
          onClick={() =>
            Browser.OpenURL(href).catch(() => window.open(href, '_blank', 'noopener,noreferrer'))
          }
        >
          <Icon size={18} />
        </button>
      )
    }
    return (
      <button
        key={id}
        type="button"
        className={cn('item', isActive && 'active', disabled && 'disabled')}
        title={disabled ? t('common.connectFirst') : label}
        aria-disabled={disabled || undefined}
        onClick={() => !disabled && onSelect(id)}
      >
        <Icon size={18} />
      </button>
    )
  }

  return (
    <aside className="rl-sidebar">
      {GROUPS.map((group, gi) => (
        <Fragment key={gi}>
          {gi > 0 && <div className="sb-divider" />}
          {group.map((item) => renderItem(item))}
        </Fragment>
      ))}
      <div className="spacer" />
      <div className="divider" />
      {BOTTOM.map((item) => renderItem(item, true))}
    </aside>
  )
}
