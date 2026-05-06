import { useState } from 'react'
import type React from 'react'
import { Toaster } from 'sonner'
import { TitleBar } from '@/redesign/TitleBar'
import { Sidebar, type NavId } from '@/redesign/Sidebar'
import { OverviewScreen } from '@/redesign/screens/OverviewScreen'
import { TopicsScreen } from '@/redesign/screens/TopicsScreen'
import { ConsumersScreen } from '@/redesign/screens/ConsumersScreen'
import { MessagesScreen } from '@/redesign/screens/MessagesScreen'
import { ProducerScreen } from '@/redesign/screens/ProducerScreen'
import { ClusterScreen } from '@/redesign/screens/ClusterScreen'
import { AlertsScreen } from '@/redesign/screens/AlertsScreen'
import { AclScreen } from '@/redesign/screens/AclScreen'
import { ConnectionsScreen } from '@/redesign/screens/ConnectionsScreen'
import { SettingsScreen } from '@/redesign/screens/SettingsScreen'
import { EmptyStateScreen } from '@/redesign/screens/EmptyStateScreen'

function App(): React.ReactElement {
  const [activeNav, setActiveNav] = useState<NavId>('home')
  // Demo: assume connected for the redesign preview. Wire real status later.
  const hasConnected = true

  const renderContent = () => {
    if (!hasConnected && activeNav !== 'connections' && activeNav !== 'settings') {
      return <EmptyStateScreen onAddConnection={() => setActiveNav('connections')} />
    }
    switch (activeNav) {
      case 'home':
        return <OverviewScreen />
      case 'topics':
        return <TopicsScreen />
      case 'consumers':
        return <ConsumersScreen />
      case 'messages':
        return <MessagesScreen />
      case 'producer':
        return <ProducerScreen />
      case 'cluster':
        return <ClusterScreen />
      case 'alerts':
        return <AlertsScreen />
      case 'acl':
        return <AclScreen />
      case 'connections':
        return <ConnectionsScreen />
      case 'settings':
        return <SettingsScreen />
      default:
        return <OverviewScreen />
    }
  }

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <TitleBar connected={hasConnected ? 'prod-cluster-01' : null} />
      <div className="flex min-h-0 flex-1">
        <Sidebar
          active={activeNav}
          onSelect={setActiveNav}
          disabledIds={
            !hasConnected
              ? ['topics', 'consumers', 'messages', 'producer', 'cluster', 'alerts', 'acl']
              : []
          }
        />
        <main className="rl-app-bg min-w-0 flex-1 overflow-hidden">
          {renderContent()}
        </main>
      </div>
      <Toaster
        position="top-center"
        closeButton
        style={{ '--width': '360px' } as React.CSSProperties}
      />
    </div>
  )
}

export default App
