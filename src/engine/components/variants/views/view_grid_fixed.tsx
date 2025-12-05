/**
 * ViewGridFixed Variant Component
 * 
 * A responsive 6-column grid container that renders children as cards.
 * Uses a 6-column base on mobile for maximum flexibility:
 * - col_span: 2 = 3 per row (default, like thumbnails)
 * - col_span: 3 = 2 per row (half-width cards)
 * - col_span: 6 = full width
 * 
 * Desktop scales up to 12 columns for more flexibility.
 * 
 * @module engine/components/variants/views/view_grid_fixed
 */

import type { VariantComponentProps } from '../../../registry'
import { useNode, NodeProvider } from '../../../context/NodeContext'
import { resolveVariant } from '../../../registry'
import { useSlot } from '../../../hooks/useSlot'
import { cn } from '@/lib/utils'

/**
 * Get col-span class based on col_span value
 */
function getColSpanClass(colSpan: number | undefined): string {
  switch (colSpan) {
    case 1: return 'col-span-1'
    case 2: return 'col-span-2'
    case 3: return 'col-span-3'
    case 4: return 'col-span-4'
    case 5: return 'col-span-5'
    case 6: return 'col-span-6'
    default: return 'col-span-2' // Default: 3 per row on mobile
  }
}

export function ViewGridFixed({ node }: VariantComponentProps) {
    const { depth, rootId, rootNode, parentId } = useNode()

    // Slots
    const headline = useSlot<string>('headline')
    const subtext = useSlot<string>('subtext')
    const gap = useSlot<number>('gap', 4) // gap in tailwind units (4 = 1rem)
    const showHeader = useSlot<boolean>('show_header', true)

    // Check if we have children to render
    const hasChildren = node.children && node.children.length > 0

    // Gap class
    const gapClass = gap === 2 ? 'gap-2' : gap === 3 ? 'gap-3' : gap === 4 ? 'gap-4' : gap === 6 ? 'gap-6' : 'gap-4'

    return (
        <div
            className="flex flex-col gap-4 p-4"
            data-variant="view_grid_fixed"
            data-node-id={node.id}
        >
            {/* Header (Optional) */}
            {showHeader && (headline || subtext) && (
                <div className="mb-2">
                    {headline && (
                        <h2 className="text-lg font-semibold text-white">{headline}</h2>
                    )}
                    {subtext && (
                        <p className="text-sm text-dark-400">{subtext}</p>
                    )}
                </div>
            )}

            {/* 6-Column Grid Container */}
            {hasChildren ? (
                <div className={cn("grid grid-cols-6 md:grid-cols-6 lg:grid-cols-12", gapClass)}>
                    {node.children?.map((child) => {
                        const ChildComponent = resolveVariant(child)
                        const childColSpan = (child.metadata?.col_span as number) ?? 2
                        
                        return (
                            <div 
                                key={child.id} 
                                className={cn(
                                    getColSpanClass(childColSpan),
                                    // Scale up on desktop (double the span for 12-col grid)
                                    childColSpan === 2 && 'lg:col-span-3',
                                    childColSpan === 3 && 'lg:col-span-4',
                                    childColSpan === 6 && 'lg:col-span-6'
                                )}
                            >
                                <NodeProvider
                                    node={child}
                                    depth={depth + 1}
                                    rootId={rootId}
                                    rootNode={rootNode}
                                    parentId={node.id}
                                >
                                    <ChildComponent node={child} />
                                </NodeProvider>
                            </div>
                        )
                    })}
                </div>
            ) : (
                <div className="text-center py-8 text-dark-400 text-sm italic border border-dashed border-dark-300 rounded-lg">
                    No items found
                </div>
            )}
        </div>
    )
}
