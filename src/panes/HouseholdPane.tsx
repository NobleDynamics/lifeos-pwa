import { Home, ClipboardList, ShoppingCart, BarChart3, ChefHat, List, Barcode } from 'lucide-react'
import CategoryPane from '@/components/CategoryPane'
import { useAppStore } from '@/store/useAppStore'
import { ViewEnginePane } from '@/panes/ViewEnginePane'

const tabs = [
  { id: 'todo', label: 'To-Do', icon: ClipboardList },
  { id: 'shopping', label: 'Shopping', icon: ShoppingCart },
  { id: 'stock', label: 'Stock', icon: BarChart3 },
  { id: 'recipes', label: 'Recipes', icon: ChefHat },
]

const mockShoppingItems = [
  { id: 1, name: 'Milk', qty: 2, vendor: 'Costco', purchased: false },
  { id: 2, name: 'Bread', qty: 1, vendor: 'Safeway', purchased: true },
  { id: 3, name: 'Eggs', qty: 1, vendor: 'Costco', purchased: false },
]

const mockStock = [
  { id: 1, name: 'Milk', qty: 1, min: 2, location: 'Fridge', status: 'low' },
  { id: 2, name: 'Eggs', qty: 12, min: 6, location: 'Fridge', status: 'ok' },
  { id: 3, name: 'Batteries', qty: 0, min: 4, location: 'Pantry', status: 'out' },
]

const mockRecipes = [
  { id: 1, name: 'Lasagna', time: 90, cuisine: 'Italian' },
  { id: 2, name: 'Chicken Stir Fry', time: 30, cuisine: 'Asian' },
  { id: 3, name: 'Caesar Salad', time: 15, cuisine: 'American' },
]

function TodoTab() {
  return <ViewEnginePane context="household.todos" title="To-Do" />
}

function ShoppingTab() {
  const { subViews, setSubView } = useAppStore()
  const activeView = subViews.shopping
  
  return (
    <div className="p-4 space-y-4">
      {/* View toggle */}
      <div className="flex gap-1 p-1 bg-dark-100 rounded-xl">
        <button
          onClick={() => setSubView('shopping', 'list')}
          className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-medium ${
            activeView === 'list' ? 'bg-primary/20 text-primary' : 'text-dark-500'
          }`}
        >
          <List size={14} />
          <span>Lists</span>
        </button>
        <button
          onClick={() => setSubView('shopping', 'items')}
          className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-medium ${
            activeView === 'items' ? 'bg-primary/20 text-primary' : 'text-dark-500'
          }`}
        >
          <Barcode size={14} />
          <span>Items</span>
        </button>
      </div>
      
      {activeView === 'list' && (
        <div className="space-y-2">
          {mockShoppingItems.map((item) => (
            <div key={item.id} className={`glass-card p-3 flex items-center gap-3 ${item.purchased ? 'opacity-50' : ''}`}>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                item.purchased ? 'border-accent-green bg-accent-green/20' : 'border-dark-400'
              }`}>
                {item.purchased && <div className="w-2 h-2 rounded-full bg-accent-green" />}
              </div>
              <div className="flex-1">
                <p className={`text-sm ${item.purchased ? 'line-through' : ''}`}>{item.name}</p>
                <p className="text-xs text-dark-500">{item.vendor}</p>
              </div>
              <span className="text-xs text-dark-500">×{item.qty}</span>
            </div>
          ))}
        </div>
      )}
      
      {activeView === 'items' && (
        <div className="glass-card p-4 text-center">
          <Barcode size={32} className="mx-auto text-dark-400 mb-2" />
          <p className="text-sm">Scan or search items</p>
          <input 
            type="text" 
            placeholder="Search items..."
            className="mt-3 w-full p-2 bg-dark-200 rounded-lg text-sm"
          />
        </div>
      )}
      
      <button className="w-full glass-card p-3 text-sm text-primary hover:bg-primary/10 transition-colors">
        📸 Upload Receipt
      </button>
    </div>
  )
}

function StockTab() {
  const stockColors = { ok: 'bg-accent-green', low: 'bg-accent-yellow', out: 'bg-accent-red' }
  
  return (
    <div className="p-4 space-y-4">
      {/* Location filters */}
      <div className="flex gap-2">
        {['All', 'Fridge', 'Pantry', 'Freezer'].map((loc) => (
          <button 
            key={loc}
            className={`px-3 py-1 text-xs rounded-lg ${loc === 'All' ? 'bg-primary/20 text-primary' : 'bg-dark-200 text-dark-500'}`}
          >
            {loc}
          </button>
        ))}
      </div>
      
      {/* Stock list */}
      <div className="space-y-2">
        {mockStock.map((item) => (
          <div key={item.id} className="glass-card p-3 flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${stockColors[item.status as keyof typeof stockColors]}`} />
            <div className="flex-1">
              <p className="text-sm">{item.name}</p>
              <p className="text-xs text-dark-500">{item.location}</p>
            </div>
            <div className="text-right">
              <p className="text-sm">{item.qty}</p>
              <p className="text-xs text-dark-500">min: {item.min}</p>
            </div>
          </div>
        ))}
      </div>
      
      <button className="w-full glass-card p-3 text-sm text-primary hover:bg-primary/10 transition-colors">
        🎤 Voice Update
      </button>
    </div>
  )
}

function RecipesTab() {
  return (
    <div className="p-4 space-y-4">
      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {['All', 'Quick (<30m)', 'Italian', 'Asian'].map((filter) => (
          <button 
            key={filter}
            className={`px-3 py-1 text-xs rounded-lg whitespace-nowrap ${filter === 'All' ? 'bg-primary/20 text-primary' : 'bg-dark-200 text-dark-500'}`}
          >
            {filter}
          </button>
        ))}
      </div>
      
      {/* Recipe cards */}
      <div className="grid grid-cols-2 gap-3">
        {mockRecipes.map((recipe) => (
          <div key={recipe.id} className="glass-card p-3">
            <div className="w-full aspect-video bg-dark-200 rounded-lg mb-2" />
            <p className="font-medium text-sm">{recipe.name}</p>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-dark-500">{recipe.time} min</span>
              <span className="text-xs px-2 py-0.5 bg-dark-200 rounded">{recipe.cuisine}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function HouseholdPane() {
  return (
    <CategoryPane
      title="Household"
      icon={Home}
      tabs={tabs}
      tabKey="household"
    >
      {(activeTab) => (
        <>
          {activeTab === 'todo' && <TodoTab />}
          {activeTab === 'shopping' && <ShoppingTab />}
          {activeTab === 'stock' && <StockTab />}
          {activeTab === 'recipes' && <RecipesTab />}
        </>
      )}
    </CategoryPane>
  )
}
