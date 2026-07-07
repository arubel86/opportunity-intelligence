import { HeaderBar } from './components/header/HeaderBar'
import { FilterSidebar } from './components/filters/FilterSidebar'
import { MapContainer } from './components/map/MapContainer'
import { DetailPanel } from './components/detail-panel/DetailPanel'
import { OpportunityTable } from './components/table/OpportunityTable'
import { AdminPanel } from './components/admin/AdminPanel'
import { MarketDashboard } from './components/shared/MarketDashboard'
import { ErrorBoundary } from './components/shared/ErrorBoundary'
import { useUIStore } from './stores/uiStore'
import { useKeyboardNav } from './hooks/useKeyboardNav'
import './styles/global.css'

export default function App() {
  const { adminMode } = useUIStore()
  useKeyboardNav()

  return (
    <ErrorBoundary>
      <div className="app-grid">
        <HeaderBar />
        <FilterSidebar />
        {adminMode ? (
          <main className="map-area">
            <AdminPanel />
          </main>
        ) : (
          <MapContainer />
        )}
        <DetailPanel />
        <section className="table-area">
          <MarketDashboard />
          <OpportunityTable />
        </section>
      </div>
    </ErrorBoundary>
  )
}
