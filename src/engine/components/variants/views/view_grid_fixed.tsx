/**
 * ViewGridFixed Variant Component
 * 
 * A responsive grid container that renders children as cards.
 * 2 columns on mobile, 3 on tablet, 4 on desktop.
 * 
 * @module engine/components/variants/views/view_grid_fixed
 */

import type { VariantComponentProps } from '../../../registry'
import { useNode } from '../../../context/NodeContext'
import { renderChildren } from '../../ViewEngine'
import { useSlot } from '../../../hooks/useSlot'
import { cn } from '@/lib/utils'

export function ViewGridFixed({ node }: VariantComponentProps) {
    const { depth, rootId } = useNode()

    // Slots
    const headline = useSlot<string>('headline') ?? node.title
    const subtext = useSlot<string>('subtext')

    // Check if we have children to render
    const hasChildren = node.children && node.children.length > 0

    return (
        <div
            className="flex flex-col gap-4 p-4"
            data-variant="view_grid_fixed"
            data-node-id={node.id}
        >
            {/* Header (Optional) */}
            {(headline || subtext) && (
                <div className="mb-2">
                    {headline && (
                        <h2 className="text-lg font-semibold text-dark-100">{headline}</h2>
                    )}
                    {subtext && (
                        <p className="text-sm text-dark-400">{subtext}</p>
                    )}
                </div>
            )}

            {/* Grid Container */}
            {hasChildren ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {renderChildren(node, depth, rootId)}
                </div>
            ) : (
                <div className="text-center py-8 text-dark-400 text-sm italic border border-dashed border-dark-300 rounded-lg">
                    No items found
                </div>
            )}
        </div>
    )
}
