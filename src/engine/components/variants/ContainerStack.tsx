/**
 * ContainerStack Variant Component
 * 
 * Renders a node as a collapsible container with stacked children.
 * Typically used for containers and spaces (folders, sections).
 * Features the cyberpunk neon glow border style.
 * 
 * @module engine/components/variants/ContainerStack
 */

import { useState } from 'react'
import { Folder, ChevronDown, ChevronRight } from 'lucide-react'
import type { VariantComponentProps } from '../../registry'
import { useNode, useNodeMeta, useChildCount, useIsRoot } from '../../context/NodeContext'
import { renderChildren } from '../ViewEngine'
import { cn } from '@/lib/utils'

/**
 * ContainerStack - Renders a container with nested children.
 * 
 * Features:
 * - Collapsible children section
 * - Cyberpunk neon glow border
 * - Folder icon with custom color
 * - Child count badge
 * - Recursive rendering of children
 */
export function ContainerStack({ node }: VariantComponentProps) {
  const { depth, rootId } = useNode()
  const childCount = useChildCount()
  const isRoot = useIsRoot()
  
  // Collapsible state - root starts expanded, others can be collapsed
  const [isExpanded, setIsExpanded] = useState(true)
  
  // Extract metadata
  const color = useNodeMeta<string>('color', '#06b6d4') // Default cyan
  const icon = useNodeMeta<string>('icon', 'folder')
  const description = useNodeMeta<string>('description')
  
  const hasChildren = childCount > 0
  
  return (
    <div
      className={cn(
        "rounded-lg overflow-hidden",
        "transition-all duration-200",
        !isRoot && "my-2"
      )}
      style={{ 
        marginLeft: depth > 0 ? 8 : 0,
      }}
      data-variant="container_stack"
      data-node-id={node.id}
    >
      {/* Header with Neon Glow */}
      <div 
        className={cn(
          "flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer",
          "bg-dark-100/80 hover:bg-dark-100",
          "border transition-all duration-200",
          "hover:shadow-lg"
        )}
        style={{
          borderColor: `${color}66`,
          boxShadow: `0 0 12px ${color}22, inset 0 0 8px ${color}11`,
        }}
        onClick={() => hasChildren && setIsExpanded(!isExpanded)}
      >
        {/* Expand/Collapse Toggle */}
        {hasChildren && (
          <span className="flex-shrink-0 text-dark-400">
            {isExpanded ? (
              <ChevronDown size={16} />
            ) : (
              <ChevronRight size={16} />
            )}
          </span>
        )}
        
        {/* Folder Icon */}
        <Folder 
          size={18} 
          className="flex-shrink-0"
          style={{ color }}
          fill={`${color}33`}
        />
        
        {/* Title */}
        <span className="flex-1 font-medium text-sm truncate">
          {node.title}
        </span>
        
        {/* Child Count Badge */}
        {hasChildren && (
          <span 
            className="text-xs px-2 py-0.5 rounded-full bg-dark-200/80"
            style={{ color }}
          >
            {childCount}
          </span>
        )}
      </div>
      
      {/* Description (if provided and expanded) */}
      {description && isExpanded && (
        <div className="px-3 py-2 text-xs text-dark-400" style={{ marginLeft: hasChildren ? 24 : 0 }}>
          {description}
        </div>
      )}
      
      {/* Children */}
      {hasChildren && isExpanded && (
        <div 
          className="pl-2 pt-1 pb-1 border-l-2 ml-4"
          style={{ borderColor: `${color}33` }}
        >
          {renderChildren(node, depth, rootId)}
        </div>
      )}
      
      {/* Empty State */}
      {!hasChildren && isExpanded && (
        <div className="px-3 py-4 text-center text-xs text-dark-500 italic">
          Empty container
        </div>
      )}
    </div>
  )
}
