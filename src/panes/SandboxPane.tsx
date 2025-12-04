/**
 * SandboxPane - Developer Tool for ViewEngine Testing
 * 
 * A powerful dev pane with three modes:
 * - Editor: Edit JSON and preview nodes
 * - Preview: See the rendered ViewEngine output
 * - Gallery: Browse all registered variants with mock data
 * 
 * @module panes/SandboxPane
 */

import { useState, useEffect, useMemo } from 'react'
import { Code, Eye, RotateCcw, AlertCircle, CheckCircle2, LayoutGrid } from 'lucide-react'
import { ViewShell } from '@/components/shared'
import { 
  ViewEngine, 
  parseNodeJson, 
  initializeEngine,
  DEFAULT_SANDBOX_JSON,
  getRegisteredVariants,
  NodeProvider,
  resolveVariant,
  type Node 
} from '@/engine'

// Initialize engine on module load
initializeEngine()

// =============================================================================
// GALLERY MOCK DATA
// =============================================================================

/**
 * Mock data for each variant in the gallery.
 * Each entry demonstrates the variant with realistic sample data.
 */
const GALLERY_MOCKS: Record<string, { node: Node; description: string; category: string }> = {
  // === LAYOUTS ===
  view_list_stack: {
    category: 'Layout',
    description: 'Vertical stack container for list items',
    node: {
      id: 'mock-list-stack',
      type: 'container',
      variant: 'view_list_stack',
      title: 'Task List',
      metadata: {},
      children: [
        { id: 'child-1', type: 'item', variant: 'row_simple', title: 'First Item', metadata: {} },
        { id: 'child-2', type: 'item', variant: 'row_simple', title: 'Second Item', metadata: {} },
      ],
    },
  },
  view_directory: {
    category: 'Layout',
    description: 'Directory-style file browser view',
    node: {
      id: 'mock-directory',
      type: 'container',
      variant: 'view_directory',
      title: 'Documents',
      metadata: {},
      children: [
        { id: 'folder-1', type: 'container', variant: 'row_neon_group', title: 'Projects', metadata: { color: '#06b6d4' } },
        { id: 'file-1', type: 'item', variant: 'row_simple', title: 'notes.txt', metadata: {} },
      ],
    },
  },
  view_dashboard_masonry: {
    category: 'Layout',
    description: 'CSS Grid masonry layout for dashboard cards',
    node: {
      id: 'mock-dashboard',
      type: 'container',
      variant: 'view_dashboard_masonry',
      title: 'Finance Dashboard',
      metadata: { columns: 2 },
      children: [
        { id: 'card-1', type: 'item', variant: 'card_progress_simple', title: 'Budget', metadata: { value: 750, max: 1000, format: 'currency' } },
        { id: 'card-2', type: 'item', variant: 'card_progress_simple', title: 'Savings', metadata: { value: 45, max: 100, format: 'percent' } },
      ],
    },
  },
  
  // === ROWS ===
  row_simple: {
    category: 'Row',
    description: 'Simple text row for lists',
    node: {
      id: 'mock-row-simple',
      type: 'item',
      variant: 'row_simple',
      title: 'Buy groceries',
      metadata: { subtitle: 'Don\'t forget milk' },
    },
  },
  row_detail_check: {
    category: 'Row',
    description: 'Task row with checkbox and details',
    node: {
      id: 'mock-row-check',
      type: 'item',
      variant: 'row_detail_check',
      title: 'Complete project proposal',
      metadata: { status: 'active', priority: 'high', due_date: '2024-12-15' },
    },
  },
  row_neon_group: {
    category: 'Row',
    description: 'Folder/group row with neon accent',
    node: {
      id: 'mock-row-neon',
      type: 'container',
      variant: 'row_neon_group',
      title: 'Work Projects',
      metadata: { color: '#ec4899', item_count: 12 },
    },
  },
  row_input_stepper: {
    category: 'Row',
    description: 'Row with +/- stepper controls',
    node: {
      id: 'mock-row-stepper',
      type: 'item',
      variant: 'row_input_stepper',
      title: 'Quantity',
      metadata: { value: 3, min: 0, max: 10 },
    },
  },
  row_input_currency: {
    category: 'Row',
    description: 'Row for currency input',
    node: {
      id: 'mock-row-currency',
      type: 'item',
      variant: 'row_input_currency',
      title: 'Budget Amount',
      metadata: { value: 250.00, currency: 'USD' },
    },
  },
  row_transaction_history: {
    category: 'Row',
    description: 'Read-only transaction row with category icon and amount',
    node: {
      id: 'mock-row-transaction',
      type: 'item',
      variant: 'row_transaction_history',
      title: 'Whole Foods',
      metadata: { 
        amount: 125.50, 
        category: 'Food', 
        date: '2024-12-01' 
      },
    },
  },
  
  // === CARDS ===
  card_media_top: {
    category: 'Card',
    description: 'Card with image/media at top',
    node: {
      id: 'mock-card-media',
      type: 'item',
      variant: 'card_media_top',
      title: 'Pasta Carbonara',
      metadata: { 
        description: 'Classic Italian comfort food',
        accent_color: '#f59e0b',
        badge_1: '30 min',
        badge_1_icon: 'clock',
        badge_2: '4 servings',
      },
    },
  },
  
  // === PROGRESS CARDS ===
  card_progress_simple: {
    category: 'Progress',
    description: 'Single progress bar card',
    node: {
      id: 'mock-progress-simple',
      type: 'item',
      variant: 'card_progress_simple',
      title: 'Monthly Budget',
      metadata: { 
        value: 2450, 
        max: 3000, 
        format: 'currency',
        color: '#06b6d4',
      },
    },
  },
  card_progress_stacked: {
    category: 'Progress',
    description: 'Stacked segment progress bar',
    node: {
      id: 'mock-progress-stacked',
      type: 'item',
      variant: 'card_progress_stacked',
      title: 'Spending Breakdown',
      metadata: { 
        max: 3000,
        format: 'currency',
        segments: [
          { label: 'Groceries', value: 800, color: '#06b6d4' },
          { label: 'Dining', value: 450, color: '#ec4899' },
          { label: 'Gas', value: 200, color: '#a855f7' },
          { label: 'Other', value: 350, color: '#22c55e' },
        ],
      },
    },
  },
  card_progress_multi: {
    category: 'Progress',
    description: 'Multiple individual progress bars',
    node: {
      id: 'mock-progress-multi',
      type: 'item',
      variant: 'card_progress_multi',
      title: 'Budget Categories',
      metadata: { 
        format: 'currency',
        items: [
          { label: 'Groceries', value: 320, max: 400, color: '#06b6d4' },
          { label: 'Dining Out', value: 180, max: 200, color: '#ec4899' },
          { label: 'Entertainment', value: 75, max: 150, color: '#a855f7' },
          { label: 'Gas', value: 90, max: 100, color: '#22c55e' },
        ],
      },
    },
  },
  
  // === CHART CARDS ===
  card_chart_bar: {
    category: 'Chart',
    description: 'Bar chart visualization',
    node: {
      id: 'mock-chart-bar',
      type: 'item',
      variant: 'card_chart_bar',
      title: 'Monthly Spending',
      metadata: { 
        format: 'currency',
        height: 180,
        data: [
          { name: 'Jan', value: 2400 },
          { name: 'Feb', value: 1398 },
          { name: 'Mar', value: 3200 },
          { name: 'Apr', value: 2780 },
          { name: 'May', value: 1890 },
          { name: 'Jun', value: 2390 },
        ],
      },
    },
  },
  card_chart_line: {
    category: 'Chart',
    description: 'Line/area chart for trends',
    node: {
      id: 'mock-chart-line',
      type: 'item',
      variant: 'card_chart_line',
      title: 'Weight Trend',
      metadata: { 
        format: 'number',
        height: 180,
        subtitle: 'Last 6 months',
        data: [
          { name: 'Jan', value: 185 },
          { name: 'Feb', value: 182 },
          { name: 'Mar', value: 180 },
          { name: 'Apr', value: 178 },
          { name: 'May', value: 175 },
          { name: 'Jun', value: 172 },
        ],
      },
    },
  },
  card_chart_pie: {
    category: 'Chart',
    description: 'Pie/donut chart for proportions',
    node: {
      id: 'mock-chart-pie',
      type: 'item',
      variant: 'card_chart_pie',
      title: 'Expense Categories',
      metadata: { 
        format: 'currency',
        height: 200,
        data: [
          { name: 'Housing', value: 1500 },
          { name: 'Food', value: 600 },
          { name: 'Transport', value: 400 },
          { name: 'Utilities', value: 200 },
          { name: 'Other', value: 300 },
        ],
      },
    },
  },
  card_chart_radar: {
    category: 'Chart',
    description: 'Radar chart for multi-dimensional data',
    node: {
      id: 'mock-chart-radar',
      type: 'item',
      variant: 'card_chart_radar',
      title: 'Fitness Stats',
      metadata: { 
        format: 'number',
        height: 220,
        max: 100,
        data: [
          { name: 'Strength', value: 75 },
          { name: 'Cardio', value: 85 },
          { name: 'Flexibility', value: 60 },
          { name: 'Balance', value: 70 },
          { name: 'Endurance', value: 80 },
        ],
      },
    },
  },
}

// =============================================================================
// GALLERY COMPONENT
// =============================================================================

interface GalleryItemProps {
  variantName: string
  mock: { node: Node; description: string; category: string }
}

function GalleryItem({ variantName, mock }: GalleryItemProps) {
  const Component = resolveVariant(mock.node)
  
  return (
    <div className="border border-dark-200 rounded-xl overflow-hidden bg-dark-50/50">
      {/* Header */}
      <div className="px-4 py-3 border-b border-dark-200 bg-dark-100/50">
        <div className="flex items-center justify-between">
          <code className="text-xs font-mono text-primary">{variantName}</code>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-dark-300/50 text-dark-500">
            {mock.category}
          </span>
        </div>
        <p className="text-xs text-dark-400 mt-1">{mock.description}</p>
      </div>
      
      {/* Preview */}
      <div className="p-4">
        <NodeProvider
          node={mock.node}
          depth={0}
          rootId={mock.node.id}
          rootNode={mock.node}
          parentId={null}
        >
          <Component node={mock.node} />
        </NodeProvider>
      </div>
    </div>
  )
}

function ComponentGallery() {
  const registeredVariants = getRegisteredVariants()
  
  // Group by category
  const grouped = useMemo(() => {
    const groups: Record<string, string[]> = {}
    
    for (const variant of registeredVariants) {
      const mock = GALLERY_MOCKS[variant]
      if (!mock) continue
      
      const category = mock.category
      if (!groups[category]) {
        groups[category] = []
      }
      groups[category].push(variant)
    }
    
    return groups
  }, [registeredVariants])
  
  const categories = Object.keys(grouped).sort()
  
  return (
    <div className="p-4 space-y-8 overflow-y-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-lg font-semibold text-white">Component Gallery</h2>
        <p className="text-sm text-dark-400 mt-1">
          {Object.keys(GALLERY_MOCKS).length} variants with mock data
        </p>
      </div>
      
      {/* Categories */}
      {categories.map((category) => (
        <div key={category}>
          <h3 className="text-sm font-semibold text-dark-300 mb-3 flex items-center gap-2">
            <span className="w-8 h-px bg-dark-300/50" />
            {category}
            <span className="w-full h-px bg-dark-300/50" />
          </h3>
          
          <div className="grid gap-4 sm:grid-cols-2">
            {grouped[category].map((variant) => (
              <GalleryItem
                key={variant}
                variantName={variant}
                mock={GALLERY_MOCKS[variant]}
              />
            ))}
          </div>
        </div>
      ))}
      
      {/* Unmocked variants notice */}
      {registeredVariants.length > Object.keys(GALLERY_MOCKS).length && (
        <div className="text-center py-4 text-xs text-dark-500">
          {registeredVariants.length - Object.keys(GALLERY_MOCKS).length} additional variants 
          registered (no gallery mock)
        </div>
      )}
    </div>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

type ViewMode = 'editor' | 'preview' | 'gallery'

/**
 * SandboxPane - Dev tool for testing ViewEngine
 * 
 * Features:
 * - Toggle between JSON editor, preview, and component gallery
 * - Real-time Zod validation
 * - Default example JSON
 * - Reset button
 */
export default function SandboxPane() {
  // UI state
  const [mode, setMode] = useState<ViewMode>('gallery')
  
  // Data state
  const [jsonText, setJsonText] = useState(DEFAULT_SANDBOX_JSON)
  const [parsedNode, setParsedNode] = useState<Node | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Parse JSON on change
  useEffect(() => {
    const result = parseNodeJson(jsonText)
    
    if (result.success && result.data) {
      setParsedNode(result.data)
      setError(null)
    } else {
      setError(result.error || 'Unknown error')
      // Keep last valid node for preview
    }
  }, [jsonText])
  
  // Reset to default
  const handleReset = () => {
    setJsonText(DEFAULT_SANDBOX_JSON)
  }
  
  return (
    <ViewShell
      title="Sandbox"
      icon={Code}
      subtitle="ViewEngine Dev Tool"
      headerActions={
        <div className="flex items-center gap-2">
          {/* Status Indicator (only in editor mode) */}
          {mode === 'editor' && (
            error ? (
              <AlertCircle size={16} className="text-red-500" />
            ) : (
              <CheckCircle2 size={16} className="text-green-500" />
            )
          )}
          
          {/* Reset Button (only in editor mode) */}
          {mode === 'editor' && (
            <button
              onClick={handleReset}
              className="p-2 rounded-lg hover:bg-dark-200 transition-colors text-dark-400 hover:text-white"
              title="Reset to default"
            >
              <RotateCcw size={18} />
            </button>
          )}
          
          {/* Mode Toggle Buttons */}
          <div className="flex rounded-lg overflow-hidden border border-dark-300">
            <button
              onClick={() => setMode('editor')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                mode === 'editor' 
                  ? 'bg-primary/20 text-primary' 
                  : 'text-dark-400 hover:text-white hover:bg-dark-200'
              }`}
            >
              <Code size={14} />
              Edit
            </button>
            <button
              onClick={() => setMode('preview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors border-l border-dark-300 ${
                mode === 'preview' 
                  ? 'bg-primary/20 text-primary' 
                  : 'text-dark-400 hover:text-white hover:bg-dark-200'
              }`}
            >
              <Eye size={14} />
              Preview
            </button>
            <button
              onClick={() => setMode('gallery')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors border-l border-dark-300 ${
                mode === 'gallery' 
                  ? 'bg-primary/20 text-primary' 
                  : 'text-dark-400 hover:text-white hover:bg-dark-200'
              }`}
            >
              <LayoutGrid size={14} />
              Gallery
            </button>
          </div>
        </div>
      }
    >
      <div className="h-full flex flex-col">
        {mode === 'editor' && (
          /* Editor Mode */
          <div className="flex-1 flex flex-col p-4 gap-4">
            {/* Error Display */}
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono whitespace-pre-wrap">
                {error}
              </div>
            )}
            
            {/* JSON Textarea */}
            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              className="flex-1 w-full p-4 rounded-lg bg-dark-100 border border-dark-200 text-sm font-mono text-dark-300 resize-none focus:outline-none focus:border-cyan-500/50"
              placeholder="Enter Node JSON..."
              spellCheck={false}
            />
            
            {/* Helper Text */}
            <div className="text-xs text-dark-500">
              Edit the JSON above. Changes are validated in real-time with Zod.
              Click "Preview" to see the ViewEngine render.
            </div>
          </div>
        )}
        
        {mode === 'preview' && (
          /* Preview Mode */
          <div className="flex-1 overflow-y-auto p-4">
            {parsedNode ? (
              <ViewEngine root={parsedNode} className="space-y-2" />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-dark-500">
                <AlertCircle size={48} className="mb-4 text-red-500/50" />
                <p className="text-sm">Invalid JSON - cannot render</p>
                {error && (
                  <p className="text-xs text-red-400 mt-2 max-w-md text-center">
                    {error}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
        
        {mode === 'gallery' && (
          /* Gallery Mode */
          <div className="flex-1 overflow-y-auto">
            <ComponentGallery />
          </div>
        )}
      </div>
    </ViewShell>
  )
}
