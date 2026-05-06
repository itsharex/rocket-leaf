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

type NavItem = { id: NavId; icon: LucideIcon; label: string; href?: string }

const GROUPS: NavItem[][] = [
  [{ id: 'home', icon: Home, label: '概览' }],
  [
    { id: 'topics', icon: LayoutGrid, label: '主题' },
    { id: 'consumers', icon: Users, label: '消费者组' },
    { id: 'messages', icon: Mail, label: '消息' },
    { id: 'producer', icon: Send, label: '发送测试' },
  ],
  [
    { id: 'cluster', icon: BarChart3, label: '集群' },
    { id: 'alerts', icon: Bell, label: '告警' },
    { id: 'acl', icon: Shield, label: '权限与审计' },
  ],
  [{ id: 'connections', icon: Server, label: '连接' }],
]

const BOTTOM: NavItem[] = [
  { id: 'github', icon: Github, label: 'GitHub', href: GITHUB_URL },
  { id: 'settings', icon: Settings, label: '设置' },
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
  const renderItem = (item: NavItem, isBottom = false) => {
    const { id, icon: Icon, label, href } = item
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
        title={disabled ? '请先连接集群' : label}
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
