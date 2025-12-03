/**
 * ViewDashboardMasonry Variant Component
 * 
 * A CSS Grid-based masonry layout for dashboard cards.
 * Supports variable column spans for child items.
 * 
 * @module engine/components/variants/layouts/view_dashboard_masonry
 */

import type { VariantComponentProps } from '../../../registry'
import { resolveVariant } from '../../../registry'
import { useNode, NodeProvider } from '../../../context/NodeContext'
import { useSlot } from '../../../hooks/useSlot'
import { cn } from '@/lib/utils'

/**
 * ViewDashboardMasonry - Grid container for dashboard cards
 * 
 * Structure:
 * ┌─────────────────────────────────────────────────────────┐
 * │ [optional title]                                        │
 * ├────────────┬────────────┬────────────┬────────────────┤
 * │  Card 1    │  Card 2    │  Card 3 (span: 2)           │
 * │  (span 1)  │  (span 1)  │                              │
 * ├────────────┴────────────┼────────────────────────────────┤
 * │  Card 4 (span: full)                                    │
 * └─────────────────────────────────────────────────────────┘
 * 
 * Children can specify col_span in metadata:
 * - undefined/1 (default): Single column
 * - 2: Two columns (only applies on md+ screens)
 * - 'full': Full width across all columns
 * 
 * Responsive Behavior:
 * - Mobile (default): 1 column - everything stacks
 * - Tablet (md): 2 columns
 * - Desktop (lg+): 3 columns
 * 
 * Slots:
 * - title: Optional section title
 * - subtitle: Optional section subtitle
 * - show_title: Whether to show section header (default: true if title exists)
 */
export function ViewDashboardMasonry({ node }: VariantComponentProps) {
  const { depth, rootId } = useNode()
  
  // Slot-based configuration
  const title = useSlot<string>('title') ?? (depth === 0 ? node.title : undefined)
  const subtitle = useSlot<string>('subtitle')
  const showTitle = useSlot<boolean>('show_title', !!title)
  
  const hasChildren = node.children && node.children.length > 0
  
  return (
    <div
      className={cn(
        "w-full",
        depth > 0 && "mt-4"
      )}
      data-variant="view_dashboard_masonry"
      data-node-id={node.id}
    >
      {/* Section Header */}
      {showTitle && title && (
        <div className="mb-4">
          <h2 className={cn(
            "font-semibold text-white",
            depth === 0 ? "text-lg" : "text-base"
          )}>
            {title}
          </h2>
          {subtitle && (
            <p className="text-sm text-dark-400 mt-1">
              {subtitle}
            </p>
          )}
        </div>
      )}
      
      {/* Grid Container - Responsive: 1col mobile, 2col tablet, 3col desktop */}
      {hasChildren ? (
        <div className="grid w-full gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {node.children!.map((child) => {
            // Get col_span from child metadata (defaults to 1 if missing)
            const colSpan = child.metadata.col_span as number | 'full' | undefined
            
            // Resolve and render the child
            const ChildComponent = resolveVariant(child)
            
            return (
              <div
                key={child.id}
                className={cn(
                  "min-w-0", // Prevent overflow
                  // col_span: 'full' - spans all columns at every breakpoint
                  colSpan === 'full' && "col-span-full",
                  // col_span: 2 - spans 2 columns on md+, 1 on mobile
                  typeof colSpan === 'number' && colSpan >= 2 && "md:col-span-2"
                )}
              >
                <NodeProvider
                  node={child}
                  depth={depth + 1}
                  rootId={rootId}
                  parentId={node.id}
                >
                  <ChildComponent node={child} />
                </NodeProvider>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="p-8 text-center text-dark-500 bg-dark-100/50 rounded-xl border border-dashed border-dark-300">
          <p className="text-sm">No dashboard cards yet</p>
          <p className="text-xs mt-1">Add children with chart or progress variants</p>
        </div>
      )}
    </div>
  )
}

/**
 * Responsive wrapper that auto-adjusts columns based on container width
 * Use this for truly responsive dashboards
 */
export function ViewDashboardResponsive({ node }: VariantComponentProps) {
  const { depth, rootId } = useNode()
  
  const title = useSlot<string>('title') ?? (depth === 0 ? node.title : undefined)
  const subtitle = useSlot<string>('subtitle')
  const minCardWidth = useSlot<number>('min_card_width', 280)
  const gap = useSlot<number>('gap', 16)
  
  const hasChildren = node.children && node.children.length > 0
  
  return (
    <div
      className="w-full"
      data-variant="view_dashboard_responsive"
      data-node-id={node.id}
    >
      {/* Section Header */}
      {title && (
        <div className="mb-4">
          <h2 className={cn(
            "font-semibold text-white",
            depth === 0 ? "text-lg" : "text-base"
          )}>
            {title}
          </h2>
          {subtitle && (
            <p className="text-sm text-dark-400 mt-1">
              {subtitle}
            </p>
          )}
        </div>
      )}
      
      {/* Auto-fit Grid */}
      {hasChildren ? (
        <div
          className="grid w-full"
          style={{
            gridTemplateColumns: `repeat(auto-fit, minmax(${minCardWidth}px, 1fr))`,
            gap: `${gap}px`,
          }}
        >
          {node.children!.map((child) => {
            const colSpan = child.metadata.col_span as number | undefined
            const ChildComponent = resolveVariant(child)
            
            return (
              <div
                key={child.id}
                style={{
                  gridColumn: colSpan && colSpan > 1 ? `span ${colSpan}` : undefined,
                }}
                className="min-w-0"
              >
                <NodeProvider
                  node={child}
                  depth={depth + 1}
                  rootId={rootId}
                  parentId={node.id}
                >
                  <ChildComponent node={child} />
                </NodeProvider>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="p-8 text-center text-dark-500 bg-dark-100/50 rounded-xl border border-dashed border-dark-300">
          <p className="text-sm">No dashboard cards yet</p>
        </div>
      )}
    </div>
  )
}

export default ViewDashboardMasonry
