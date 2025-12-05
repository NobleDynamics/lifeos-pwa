/**
 * CardNoteLarge Variant Component
 * 
 * A large/full-width card for displaying markdown notes with extended preview.
 * Designed for full-width layouts (col_span: 6 in 6-column grid).
 * 
 * Features:
 * - Larger plain text preview with more lines
 * - Relative timestamp display
 * - Long-press/right-click context menu for version history
 * - Optional neon glow effect
 * 
 * @module engine/components/variants/cards/card_note_large
 */

import { useState } from 'react'
import { FileText, Clock, History, RotateCcw } from 'lucide-react'
import type { VariantComponentProps } from '../../../registry'
import { useNode } from '../../../context/NodeContext'
import { useEngineActions } from '../../../context/EngineActionsContext'
import { useSlot } from '../../../hooks/useSlot'
import { useLongPress, type LongPressEvent } from '@/hooks/useLongPress'
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
    top: Math.min(position.y, window.innerHeight - 300),
    zIndex: 100,
  }

  return (
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
        className="z-50 w-64 bg-dark-100 border border-dark-200 rounded-lg shadow-xl overflow-hidden"
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
          <div className="max-h-72 overflow-y-auto">
            {history.map((version, index) => (
              <button
                key={index}
                onClick={() => {
                  onRestoreVersion(version)
                  onClose()
                }}
                className="w-full px-3 py-2.5 text-left hover:bg-dark-200/50 transition-colors border-b border-dark-200/30 last:border-0"
              >
                <div className="flex items-center gap-2 text-[10px] text-dark-400 mb-1">
                  <Clock size={10} />
                  {formatTimestamp(version.savedAt)}
                </div>
                <p className="text-xs text-dark-300 line-clamp-2">
                  {stripMarkdown(version.content).substring(0, 80)}...
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
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * CardNoteLarge - Full-width markdown note card with extended preview
 * 
 * Structure:
 * ┌────────────────────────────────────────────────────────┐
 * │ 📝 Note Title                                          │
 * │                                                        │
 * │ Plain text preview with more lines visible for the     │
 * │ larger card format. This allows users to see more      │
 * │ content at a glance without opening the full editor... │
 * │ ────────────────────────────────────────────────────── │
 * │ Updated 2h ago                           3 versions    │
 * └────────────────────────────────────────────────────────┘
 * 
 * Slots:
 * - headline: Title (default: node.title)
 * - content: Markdown content
 * - updated_at: Last modified timestamp
 * - accent_color: Border/glow color (default: #8b5cf6)
 * - neon_glow: Enable neon glow effect (default: false)
 * - history: Version history array
 */
export function CardNoteLarge({ node }: VariantComponentProps) {
  const { depth } = useNode()
  const actions = useEngineActions()
  
  // Slot-based data access
  const headline = useSlot<string>('headline') ?? node.title
  const content = useSlot<string>('content', '')
  const updatedAt = useSlot<string>('updated_at')
  const accentColor = useSlot<string>('accent_color', '#8b5cf6')
  const neonGlow = useSlot<boolean>('neon_glow', false)
  const history = useSlot<VersionEntry[]>('history', [])
  
  // Context menu state
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null)
  
  // Get plain text preview
  const plainTextPreview = stripMarkdown(content)
  
  // Long press handler
  const longPressHandlers = useLongPress({
    onLongPress: (e: LongPressEvent) => {
      setMenuPosition({ x: e.clientX, y: e.clientY })
    },
    onClick: () => {
      // Regular click - could open viewer modal in the future
      // For now, do nothing in sandbox mode
    },
    disabled: false,
  })
  
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
  
  // Neon glow style
  const glowStyle = neonGlow && accentColor ? {
    boxShadow: `0 0 15px ${accentColor}33, 0 0 30px ${accentColor}11`,
  } : {}
  
  return (
    <>
      <div
        {...longPressHandlers}
        className={cn(
          "rounded-xl overflow-hidden",
          "bg-dark-100/80 backdrop-blur-sm",
          "border transition-all duration-200",
          "hover:shadow-lg hover:shadow-purple-500/10",
          "cursor-pointer select-none"
        )}
        style={{ 
          borderColor: neonGlow ? accentColor : 'rgb(26, 26, 36)',
          ...glowStyle,
        }}
        data-variant="card_note_large"
        data-node-id={node.id}
      >
        {/* Accent Bar */}
        <div 
          className="h-1.5"
          style={{ backgroundColor: accentColor }}
        />
        
        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Title Row */}
          <div className="flex items-start gap-3">
            <div 
              className="p-2 rounded-lg"
              style={{ backgroundColor: `${accentColor}20` }}
            >
              <FileText size={18} style={{ color: accentColor }} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base leading-tight line-clamp-2 text-white">
                {headline}
              </h3>
              {updatedAt && (
                <div className="flex items-center gap-1.5 text-xs text-dark-500 mt-1">
                  <Clock size={12} />
                  Last edited {formatTimestamp(updatedAt)}
                </div>
              )}
            </div>
          </div>
          
          {/* Preview Text - More lines for large card */}
          {plainTextPreview && (
            <p className="text-sm text-dark-400 line-clamp-5 leading-relaxed">
              {plainTextPreview}
            </p>
          )}
          
          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-dark-200/50">
            <div className="text-xs text-dark-500">
              {content.length} characters
            </div>
            
            <div className="flex items-center gap-3">
              {history.length > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-dark-500">
                  <History size={12} />
                  {history.length} version{history.length > 1 ? 's' : ''} saved
                </div>
              )}
            </div>
          </div>
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

export default CardNoteLarge
