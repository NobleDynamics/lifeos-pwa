import { useAppStore, type PaneType } from '@/store/useAppStore'
import Layout from '@/components/Layout'
import SwipeDeck from '@/components/SwipeDeck'

// Pane components
import DashboardPane from '@/panes/DashboardPane'
import HealthPane from '@/panes/HealthPane'
import FinancePane from '@/panes/FinancePane'
import HouseholdPane from '@/panes/HouseholdPane'
import AgendaPane from '@/panes/AgendaPane'
import CloudPane from '@/panes/CloudPane'
import ChatPane from '@/panes/ChatPane'
import FeedPane from '@/panes/FeedPane'
import SettingsPane from '@/panes/SettingsPane'
import SandboxPane from '@/panes/SandboxPane'

// Map pane types to components
const paneComponents: Record<PaneType, React.ComponentType> = {
  dashboard: DashboardPane,
  health: HealthPane,
  finance: FinancePane,
  household: HouseholdPane,
  agenda: AgendaPane,
  cloud: CloudPane,
  chat: ChatPane,
  feed: FeedPane,
  settings: SettingsPane,
  sandbox: SandboxPane,
}

function App() {
  const { paneOrder, currentPaneIndex, setCurrentPaneIndex } = useAppStore()
  
  // Create array of pane components based on current order
  const paneElements = paneOrder.map((paneType) => {
    const PaneComponent = paneComponents[paneType]
    return <PaneComponent key={paneType} />
  })
  
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
