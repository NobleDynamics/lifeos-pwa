/**
 * RowNote Variant Component
 * 
 * A simple row variant for displaying notes in list views.
 * Shows icon, title, and timestamp in a compact horizontal layout.
 * 
 * Features:
 * - Compact horizontal layout
 * - Relative timestamp display
 * - Long-press/right-click context menu for version history
 * - Optional accent color indicator
 * 
 * @module engine/components/variants/rows/row_note
 */

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { FileText, Clock, History, RotateCcw } from 'lucide-react'
import type { VariantComponentProps } from '../../../registry'
import { useNode } from '../../../context/NodeContext'
import { useEngineActions } from '../../../context/EngineActionsContext'
import { useSlot } from '../../../hooks/useSlot'
import { useLongPress } from '@/hooks/useLongPress'
import { cn } from '@/lib/utils'
import type { VersionEntry } from '../../shared/NoteViewerModal'

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Strip markdown formatting to get plain text preview
 */
function stripMarkdown(markdown: string): string {
  return markdown
    .replace(/#{1,6}\s?/g, '')           // Remove headers
    .replace(/\*\*([^*]+)\*\*/g, '$1')   // Bold
    .replace(/__([^_]+)__/g, '$1')       // Bold alt
    .replace(/\*([^*]+)\*/g, '$1')       // Italic
    .replace(/_([^_]+)_/g, '$1')         // Italic alt
    .replace(/`{1,3}[^`]*`{1,3}/g, '')   // Code blocks/inline
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')  // Links
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '') // Images
    .replace(/>\s?/g, '')                // Blockquotes
    .replace(/[-*+]\s/g, '')             // List markers
    .replace(/\d+\.\s/g, '')             // Numbered lists
    .replace(/\n+/g, ' ')                // Newlines to spaces
    .replace(/\s+/g, ' ')                // Multiple spaces
    .trim()
}

/**
 * Format a timestamp for display
 */
function formatTimestamp(isoString: string): string {
  const date = new Date(isoString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

// =============================================================================
// CONTEXT MENU COMPONENT
// =============================================================================

interface ContextMenuProps {
  position: { x: number; y: number }
  history: VersionEntry[]
  onClose: () => void
  onRestoreVersion: (version: VersionEntry) => void
}

function VersionHistoryMenu({ position, history, onClose, onRestoreVersion }: ContextMenuProps) {
  // Adjust position to keep menu in viewport
  const menuStyle: React.CSSProperties = {
    position: 'fixed',
    left: Math.min(position.x, window.innerWidth - 220),
    top: Math.min(position.y, window.innerHeight - 250),
    zIndex: 100,
  }

  // Use portal to render outside SwipeDeck transform context
  const menuContent = (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-50" 
        onClick={onClose}
        onContextMenu={(e) => { e.preventDefault(); onClose() }}
      />
      
      {/* Menu */}
      <div 
        style={menuStyle}
        className="z-50 w-52 bg-dark-100 border border-dark-200 rounded-lg shadow-xl overflow-hidden"
      >
        <div className="px-3 py-2 border-b border-dark-200 flex items-center gap-2">
          <History size={14} className="text-primary" />
          <span className="text-xs font-medium text-white">Version History</span>
        </div>
        
        {history.length === 0 ? (
          <div className="px-3 py-4 text-xs text-dark-500 text-center">
            No previous versions
          </div>
        ) : (
          <div className="max-h-48 overflow-y-auto">
            {history.map((version, index) => (
              <button
                key={index}
                onClick={() => {
                  onRestoreVersion(version)
                  onClose()
                }}
                className="w-full px-3 py-2 text-left hover:bg-dark-200/50 transition-colors border-b border-dark-200/30 last:border-0"
              >
                <div className="flex items-center gap-2 text-[10px] text-dark-400 mb-0.5">
                  <Clock size={10} />
                  {formatTimestamp(version.savedAt)}
                </div>
                <p className="text-xs text-dark-300 line-clamp-1">
                  {stripMarkdown(version.content).substring(0, 40)}...
                </p>
              </button>
            ))}
          </div>
        )}
        
        <div className="px-3 py-2 border-t border-dark-200 bg-dark-200/30">
          <div className="flex items-center gap-1.5 text-[10px] text-dark-500">
            <RotateCcw size={10} />
            <span>Click to restore version</span>
          </div>
        </div>
      </div>
    </>
  )

  // Portal to document.body to escape SwipeDeck's transform containing block
  return createPortal(menuContent, document.body)
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * RowNote - Simple row for notes in list views
 * 
 * Structure:
 * ┌────────────────────────────────────────────────────────────┐
 * │ 📄  Note Title                              Updated 2h ago │
 * └────────────────────────────────────────────────────────────┘
 * 
 * Slots:
 * - headline: Title (default: node.title)
 * - content: Markdown content (for version history)
 * - updated_at: Last modified timestamp
 * - accent_color: Left border indicator color (default: #8b5cf6)
 * - history: Version history array
 */
export function RowNote({ node }: VariantComponentProps) {
  const { depth } = useNode()
  const actions = useEngineActions()
  
  // Slot-based data access
  const headline = useSlot<string>('headline') ?? node.title
  const content = useSlot<string>('content', '')
  const updatedAt = useSlot<string>('updated_at')
  const accentColor = useSlot<string>('accent_color', '#8b5cf6')
  const history = useSlot<VersionEntry[]>('history', [])
  
  // Context menu state
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null)
  
  // Handle row click - open note viewer
  const handleClick = () => {
    if (actions) {
      actions.onOpenNote(node)
    }
  }

  // Handle context menu / long press - open version history
  const handleContextMenu = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Get coordinates based on event type
    let x: number, y: number
    if ('touches' in e) {
      const touch = e.touches[0] || e.changedTouches[0]
      x = touch?.clientX ?? 0
      y = touch?.clientY ?? 0
    } else {
      x = e.clientX
      y = e.clientY
    }
    
    setMenuPosition({ x, y })
  }

  // Legacy signature - for context menu only
  const longPressHandlers = useLongPress(
    handleContextMenu,
    { threshold: 500 }
  )
  
  // Handle version restore
  const handleRestoreVersion = (version: VersionEntry) => {
    if (actions) {
      actions.onTriggerBehavior(node, {
        action: 'update_field',
        target: 'meta_data',
        payload: {
          content: version.content,
          updated_at: new Date().toISOString(),
          history: history, // Keep history as-is
        },
      })
    }
  }
  
  return (
    <>
      <div
        className={cn(
          "flex items-center gap-3 px-3 py-2.5",
          "bg-dark-100/60 backdrop-blur-sm",
          "border-l-2 border-y border-r border-dark-200/50",
          "rounded-lg transition-all duration-200",
          "hover:bg-dark-100/80",
          "cursor-pointer select-none",
          "active:scale-[0.98]" // Touch feedback
        )}
        style={{ 
          borderLeftColor: accentColor,
        }}
        data-variant="row_note"
        data-node-id={node.id}
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        onMouseDown={(e) => longPressHandlers.onMouseDown(e, node)}
        onMouseUp={longPressHandlers.onMouseUp}
        onMouseLeave={longPressHandlers.onMouseLeave}
        onTouchStart={(e) => longPressHandlers.onTouchStart(e, node)}
        onTouchEnd={longPressHandlers.onTouchEnd}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleClick()
          }
        }}
      >
        {/* Icon */}
        <div 
          className="p-1.5 rounded-md flex-shrink-0"
          style={{ backgroundColor: `${accentColor}15` }}
        >
          <FileText size={14} style={{ color: accentColor }} />
        </div>
        
        {/* Title */}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-white truncate">
            {headline}
          </h4>
        </div>
        
        {/* Right side info */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {history.length > 0 && (
            <div className="flex items-center gap-1 text-[10px] text-dark-500">
              <History size={10} />
              {history.length}
            </div>
          )}
          
          {updatedAt && (
            <div className="flex items-center gap-1 text-[10px] text-dark-500">
              <Clock size={10} />
              {formatTimestamp(updatedAt)}
            </div>
          )}
        </div>
      </div>
      
      {/* Context Menu */}
      {menuPosition && (
        <VersionHistoryMenu
          position={menuPosition}
          history={history}
          onClose={() => setMenuPosition(null)}
          onRestoreVersion={handleRestoreVersion}
        />
      )}
    </>
  )
}
