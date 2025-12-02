import { useAppStore, type PaneType } from '@/store/useAppStore'
import Layout from '@/components/Layout'
import SwipeDeck from '@/components/SwipeDeck'
import { useAppLauncher } from '@/hooks/useAppLauncher'

// Pane components
import DashboardPane from '@/panes/DashboardPane'
import HealthPane from '@/panes/HealthPane'
import FinancePane from '@/panes/FinancePane'
import AgendaPane from '@/panes/AgendaPane'
import CloudPane from '@/panes/CloudPane'
import ChatPane from '@/panes/ChatPane'
import FeedPane from '@/panes/FeedPane'
import SettingsPane from '@/panes/SettingsPane'
import SandboxPane from '@/panes/SandboxPane'
import ViewEnginePane from '@/panes/ViewEnginePane'

// Map pane types to components
const SYSTEM_PANE_COMPONENTS: Record<string, React.ComponentType> = {
  dashboard: DashboardPane,
  health: HealthPane,
  finance: FinancePane,
  agenda: AgendaPane,
  cloud: CloudPane,
  chat: ChatPane,
  feed: FeedPane,
  settings: SettingsPane,
  sandbox: SandboxPane,
}

function App() {
  const { paneOrder, currentPaneIndex, setCurrentPaneIndex } = useAppStore()
  const { apps, isLoading } = useAppLauncher()

  // Create array of pane components based on current order
  const paneElements = paneOrder.map((paneId) => {
    // 1. Check if it's a system app
    if (SYSTEM_PANE_COMPONENTS[paneId]) {
      const Component = SYSTEM_PANE_COMPONENTS[paneId]
      return <Component key={paneId} />
    }

    // 2. Check if it's a dynamic user app
    const appConfig = apps.get(paneId)
    if (appConfig && !appConfig.isSystem && appConfig.context) {
      return (
        <ViewEnginePane
          key={paneId}
          context={appConfig.context}
          title={appConfig.label}
        />
      )
    }

    // 3. Fallback (shouldn't happen if logic is correct)
    return <div key={paneId} className="flex items-center justify-center h-full text-dark-500">App not found: {paneId}</div>
  })

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-dark flex items-center justify-center">
        <div className="animate-pulse text-cyan-400">Loading LifeOS...</div>
      </div>
    )
  }

  return (
    <Layout>
      <SwipeDeck
        currentIndex={currentPaneIndex}
        onIndexChange={setCurrentPaneIndex}
        className="h-full w-full"
      >
        {paneElements}
      </SwipeDeck>
    </Layout>
  )
}

export default App
