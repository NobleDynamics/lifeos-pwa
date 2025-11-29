/**
 * SandboxPane - Developer Tool for ViewEngine Testing
 * 
 * A simple pane that allows editing JSON and previewing the ViewEngine output.
 * NOT a user-facing feature - purely for development and testing.
 * 
 * @module panes/SandboxPane
 */

import { useState, useEffect } from 'react'
import { Code, Eye, RotateCcw, AlertCircle, CheckCircle2 } from 'lucide-react'
import { ViewShell } from '@/components/shared'
import { 
  ViewEngine, 
  parseNodeJson, 
  initializeEngine,
  DEFAULT_SANDBOX_JSON,
  type Node 
} from '@/engine'

// Initialize engine on module load
initializeEngine()

/**
 * SandboxPane - Dev tool for testing ViewEngine
 * 
 * Features:
 * - Toggle between JSON editor and preview
 * - Real-time Zod validation
 * - Default example JSON
 * - Reset button
 */
export default function SandboxPane() {
  // UI state
  const [isEditing, setIsEditing] = useState(true)
  
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
          {/* Status Indicator */}
          {error ? (
            <AlertCircle size={16} className="text-red-500" />
          ) : (
            <CheckCircle2 size={16} className="text-green-500" />
          )}
          
          {/* Reset Button */}
          <button
            onClick={handleReset}
            className="p-2 rounded-lg hover:bg-dark-200 transition-colors text-dark-400 hover:text-white"
            title="Reset to default"
          >
            <RotateCcw size={18} />
          </button>
          
          {/* Toggle Button */}
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-colors text-sm font-medium"
          >
            {isEditing ? (
              <>
                <Eye size={16} />
                Preview
              </>
            ) : (
              <>
                <Code size={16} />
                Edit
              </>
            )}
          </button>
        </div>
      }
    >
      <div className="h-full flex flex-col">
        {isEditing ? (
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
        ) : (
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
      </div>
    </ViewShell>
  )
}
