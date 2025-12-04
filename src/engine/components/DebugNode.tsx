/**
 * DebugNode - Self-Healing Fallback Component
 * 
 * Renders when a node's variant is not found in the registry.
 * Displays diagnostic information about the node to help identify issues.
 * Still renders children to prevent the tree from breaking.
 * 
 * @module engine/components/DebugNode
 */

import { useState } from 'react'
import { ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react'
import type { VariantComponentProps } from '../registry'
import { useNode } from '../context/NodeContext'
import { renderChildren } from './ViewEngine'

/**
 * DebugNode - Fallback component for unknown variants.
 * 
 * Features:
 * - Shows node ID, type, variant, and metadata
 * - Collapsible metadata viewer
 * - Renders children so the tree doesn't break
 * - Cyberpunk-styled diagnostic card
 */
export function DebugNode({ node }: VariantComponentProps) {
  const { depth, rootId, rootNode, parentId } = useNode()
  const [isExpanded, setIsExpanded] = useState(true)
  const [showMeta, setShowMeta] = useState(false)
  
  const hasChildren = node.children && node.children.length > 0
  const hasRelationships = node.relationships && node.relationships.length > 0
  
  return (
    <div 
      className="my-2 rounded-lg border border-yellow-500/50 bg-yellow-500/10 overflow-hidden"
      style={{ marginLeft: depth > 0 ? 12 : 0 }}
      data-debug-node={node.id}
    >
      {/* Header */}
      <div className="px-3 py-2 bg-yellow-500/20 flex items-center gap-2">
        <AlertTriangle size={16} className="text-yellow-500 flex-shrink-0" />
        <span className="text-xs font-mono text-yellow-500">
          Unknown Variant: "{node.variant}"
        </span>
      </div>
      
      {/* Node Info */}
      <div className="p-3 space-y-2 text-sm">
        {/* Title & Type */}
        <div className="flex items-center gap-2">
          {hasChildren && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-0.5 hover:bg-dark-200 rounded"
            >
              {isExpanded ? (
                <ChevronDown size={14} className="text-dark-400" />
              ) : (
                <ChevronRight size={14} className="text-dark-400" />
              )}
            </button>
          )}
          <span className="font-medium text-white">{node.title}</span>
          <span className="text-xs px-1.5 py-0.5 rounded bg-dark-200 text-dark-400">
            {node.type}
          </span>
        </div>
        
        {/* ID */}
        <div className="text-xs text-dark-500 font-mono">
          ID: {node.id}
        </div>
        
        {/* Context Info */}
        <div className="text-xs text-dark-500">
          Depth: {depth} | Root: {rootId.slice(0, 8)}...
          {parentId && ` | Parent: ${parentId.slice(0, 8)}...`}
        </div>
        
        {/* Metadata Toggle */}
        <button
          onClick={() => setShowMeta(!showMeta)}
          className="text-xs text-cyan-500 hover:text-cyan-400 transition-colors"
        >
          {showMeta ? 'Hide' : 'Show'} Metadata ({Object.keys(node.metadata).length} keys)
        </button>
        
        {/* Metadata Display */}
        {showMeta && (
          <pre className="text-xs bg-dark-200 rounded p-2 overflow-x-auto text-dark-400 font-mono">
            {JSON.stringify(node.metadata, null, 2)}
          </pre>
        )}
        
        {/* Relationships */}
        {hasRelationships && (
          <div className="text-xs text-dark-500">
            Relationships: {node.relationships!.length}
          </div>
        )}
      </div>
      
      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="border-t border-yellow-500/20 px-2 py-2">
          {renderChildren(node, depth, rootId, rootNode)}
        </div>
      )}
    </div>
  )
}
