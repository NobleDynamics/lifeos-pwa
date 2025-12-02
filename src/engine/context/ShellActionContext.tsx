/**
 * ShellActionContext - Dynamic Header Action Control
 * 
 * This context allows child components (like view_directory) to control
 * the action button in the App Shell header.
 * 
 * Flow:
 * 1. Child mounts → calls setActionConfig with its create_options
 * 2. Shell header reads actionConfig and renders the button
 * 3. Child unmounts → calls clearActionConfig
 * 
 * @module engine/context/ShellActionContext
 */

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

// =============================================================================
// TYPES
// =============================================================================

export interface CreateOption {
  label: string
  type: 'folder' | 'task'
  icon?: string
  variant?: string
}

export interface ActionConfig {
  label: string
  options: CreateOption[]
  parentId: string
}

interface ShellActionContextValue {
  /** Current action configuration from the active view */
  actionConfig: ActionConfig | null
  
  /** Set the action configuration (called by child views on mount) */
  setActionConfig: (config: ActionConfig) => void
  
  /** Clear the action configuration (called by child views on unmount) */
  clearActionConfig: () => void
}

// =============================================================================
// CONTEXT
// =============================================================================

const ShellActionContext = createContext<ShellActionContextValue | null>(null)

// =============================================================================
// PROVIDER
// =============================================================================

interface ShellActionProviderProps {
  children: ReactNode
}

export function ShellActionProvider({ children }: ShellActionProviderProps) {
  const [actionConfig, setActionConfigState] = useState<ActionConfig | null>(null)

  const setActionConfig = useCallback((config: ActionConfig) => {
    setActionConfigState(config)
  }, [])

  const clearActionConfig = useCallback(() => {
    setActionConfigState(null)
  }, [])

  const value: ShellActionContextValue = {
    actionConfig,
    setActionConfig,
    clearActionConfig,
  }

  return (
    <ShellActionContext.Provider value={value}>
      {children}
    </ShellActionContext.Provider>
  )
}

// =============================================================================
// HOOK
// =============================================================================

export function useShellAction() {
  const context = useContext(ShellActionContext)
  if (!context) {
    // Return a no-op default for components outside the shell
    return {
      actionConfig: null,
      setActionConfig: () => {},
      clearActionConfig: () => {},
    }
  }
  return context
}
