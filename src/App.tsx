import { useAppStore, type PaneType } from '@/store/useAppStore'
import Layout from '@/components/Layout'
import SwipeDeck from '@/components/SwipeDeck'
import { useAppLauncher } from '@/hooks/useAppLauncher'

// Pane components
import DashboardPane from '@/panes/DashboardPane'
import HealthPane from '@/panes/HealthPane'
import FinancePane from '@/panes/FinancePane'
import HouseholdPane from '@/panes/HouseholdPane'
import AgendaPane from '@/panes/AgendaPane'
import CloudPane from '@/panes/CloudPane'
import ChatPane from '@/panes/ChatPane'
// Map pane types to components
const SYSTEM_PANE_COMPONENTS: Record<string, React.ComponentType> = {
  dashboard: DashboardPane,
  health: HealthPane,
  finance: FinancePane,
  agenda: AgendaPane,
  cloud: CloudPane,
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
