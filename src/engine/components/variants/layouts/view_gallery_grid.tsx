/**
 * ViewGalleryGrid Variant Component
 * 
 * A tight CSS Grid optimized for displaying many thumbnail images.
 * Uses minimal gap (gap-1) to differentiate from dashboard layouts.
 * 
 * Registers dynamic header action from `create_options` metadata (if present).
 * This follows the "Generic Engine" philosophy - behavior is driven by metadata.
 * 
 * @module engine/components/variants/layouts/view_gallery_grid
 */

import { useEffect } from 'react'
import type { VariantComponentProps } from '../../../registry'
import { useNode } from '../../../context/NodeContext'
import { renderChildren } from '../../ViewEngine'
import { useSlot } from '../../../hooks/useSlot'
import { useShellAction, type CreateOption } from '../../../context/ShellActionContext'
import { cn } from '@/lib/utils'

/**
 * ViewGalleryGrid - Tight photo gallery grid layout.
 * 
 * Structure:
 * ┌──────────────────────────────────┐
 * │ [Optional Header]               │
 * ├──┬──┬──┬──┬──────────────────────┤
 * │▓▓│▓▓│▓▓│▓▓│▓▓│  ← 3 cols mobile  │
 * │▓▓│▓▓│▓▓│▓▓│▓▓│  ← 4 cols tablet  │
 * │▓▓│▓▓│▓▓│▓▓│▓▓│  ← 5 cols desktop │
 * └──┴──┴──┴──┴──────────────────────┘
 * 
 * Slots:
 * - headline: Section title (optional)
 * - subtext: Section description (optional)
 * 
 * Designed for: card_media_thumbnail children
 */
export function ViewGalleryGrid({ node }: VariantComponentProps) {
  const { depth, rootId, rootNode } = useNode()
  const { setActionConfig, clearActionConfig } = useShellAction()

  // Slots
  const headline = useSlot<string>('headline') ?? node.title
  const subtext = useSlot<string>('subtext')
  const showHeader = useSlot<boolean>('show_header', true)

  // Check if we have children to render
  const hasChildren = node.children && node.children.length > 0

  // ==========================================================================
  // SHELL ACTION CONFIG (Dynamic Header Action)
  // ==========================================================================
  
  // Register action from metadata - if no create_options, don't show action
  useEffect(() => {
    // Read from metadata - generic, not hardcoded
    const customOptions = node.metadata?.create_options as CreateOption[] | undefined
    
    if (!customOptions || customOptions.length === 0) {
      clearActionConfig()
      return
    }

    const actionLabel = (node.metadata?.action_label as string) || 'Add'
    
    setActionConfig({
      label: actionLabel,
      options: customOptions,
      parentId: node.id
    })

    // Cleanup on unmount
    return () => {
      clearActionConfig()
    }
  }, [node.id, node.metadata, setActionConfig, clearActionConfig])

  return (
    <div
      className="flex flex-col"
      data-variant="view_gallery_grid"
      data-node-id={node.id}
    >
      {/* Header (Optional) */}
      {showHeader && (headline || subtext) && (
        <div className="px-2 pb-2">
          {headline && (
            <h2 className="text-sm font-semibold text-white">{headline}</h2>
          )}
          {subtext && (
            <p className="text-xs text-dark-400 mt-0.5">{subtext}</p>
          )}
        </div>
      )}

      {/* Tight Grid Container */}
      {hasChildren ? (
        <div 
          className={cn(
            "grid gap-1",
            "grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
          )}
        >
          {renderChildren(node, depth, rootId, rootNode)}
        </div>
      ) : (
        <div className="text-center py-8 text-dark-400 text-sm italic border border-dashed border-dark-300 rounded-lg mx-2">
          No items
        </div>
      )}
    </div>
  )
}
