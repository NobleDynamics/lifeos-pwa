/**
 * LayoutAppShell - The Persistent Shell Container
 * 
 * PERSISTENT SHELL ARCHITECTURE:
 * This component renders the App's chrome (header, bottom tabs) permanently.
 * Only the viewport content changes based on navigation.
 * 
 * It uses ShellNavigationContext to:
 * 1. Know which node the user has drilled into (targetNodeId)
 * 2. Determine which bottom tab should be active (even when deep in subtree)
 * 3. Render the appropriate content in the viewport
 * 
 * Config (node.metadata):
 * - title: App Title (Header)
 * - action_label: Label for the top-right button (removed - now per-directory)
 * - default_tab_id: UUID of the child to show first
 */

import { useState, useMemo, useEffect } from 'react'
import { ChevronLeft, LayoutGrid, Plus, Folder, CheckSquare } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import type { VariantComponentProps } from '../../../registry'
import { useNodeMeta } from '../../../context/NodeContext'
import { ViewEngine } from '../../ViewEngine'
import { useShellNavigation, findContainingChild, findNodeInTree } from '../../../context/ShellNavigationContext'
import { ShellActionProvider, useShellAction, type CreateOption } from '../../../context/ShellActionContext'
import { useEngineActions } from '../../../context/EngineActionsContext'
import { cn } from '@/lib/utils'

function LayoutAppShellContent({ node }: VariantComponentProps) {
    const { title } = node
    const defaultTabId = useNodeMeta<string>('default_tab_id')

    // Get navigation context
    const { targetNodeId, navigateBack, canNavigateBack, targetPath, navigateToNode } = useShellNavigation()
    
    // Get action context for header button
    const { actionConfig } = useShellAction()
    const actions = useEngineActions()
    
    // Dropdown state for action button
    const [showActionDropdown, setShowActionDropdown] = useState(false)

    // =========================================================================
    // TAB STATE MANAGEMENT
    // =========================================================================

    // Determine which tab is "active" based on targetNodeId
    // If the user has drilled into a subtree, we need to find which root-level
    // child (tab) contains the target node
    const activeTabId = useMemo(() => {
        // If no target, use default or first child
        if (!targetNodeId || targetNodeId === node.id) {
            if (defaultTabId) return defaultTabId
            return node.children?.[0]?.id || null
        }

        // Check if targetNodeId is a direct child (tab)
        const directChild = node.children?.find(c => c.id === targetNodeId)
        if (directChild) {
            return directChild.id
        }

        // Otherwise, find which tab contains the target
        const containingChildId = findContainingChild(node, targetNodeId)
        if (containingChildId) {
            return containingChildId
        }

        // Fallback to default/first
        if (defaultTabId) return defaultTabId
        return node.children?.[0]?.id || null
    }, [node, targetNodeId, defaultTabId])

    // Track locally selected tab (for when user clicks tabs directly)
    const [selectedTabId, setSelectedTabId] = useState<string | null>(() => {
        return activeTabId
    })

    // Sync selectedTabId when activeTabId changes due to navigation
    useEffect(() => {
        if (activeTabId && activeTabId !== selectedTabId) {
            // Only update if the active tab changed due to deep navigation
            const isDeepNavigation = targetNodeId && targetNodeId !== activeTabId
            if (!isDeepNavigation) {
                setSelectedTabId(activeTabId)
            }
        }
    }, [activeTabId, targetNodeId, selectedTabId])

    // Ensure selectedTabId is valid
    useEffect(() => {
        if (node.children && node.children.length > 0) {
            if (!selectedTabId || !node.children.find(c => c.id === selectedTabId)) {
                setSelectedTabId(node.children[0].id)
            }
        }
    }, [node.children, selectedTabId])

    // =========================================================================
    // VIEWPORT CONTENT DETERMINATION
    // =========================================================================

    // What to render in the viewport:
    // 1. If targetNodeId is set and is NOT a direct child (tab), render that node
    // 2. Otherwise, render the selected tab's content
    const viewportContent = useMemo(() => {
        // If we have a target that's deeper than tabs, render it
        if (targetNodeId && targetNodeId !== node.id) {
            // Check if it's a direct child (tab) - if so, render that tab
            const directChild = node.children?.find(c => c.id === targetNodeId)
            if (directChild) {
                return directChild
            }

            // It's a deeper node - find it in the tree and render it
            const targetNode = findNodeInTree(node, targetNodeId)
            if (targetNode) {
                // Override variant to view_directory for folder navigation
                // This ensures the folder renders as a container, not a clickable row
                return {
                    ...targetNode,
                    variant: targetNode.type === 'container' || targetNode.children?.length 
                        ? 'view_directory' 
                        : targetNode.variant
                }
            }
        }

        // Default: render the selected tab
        return node.children?.find(c => c.id === selectedTabId) || null
    }, [node, targetNodeId, selectedTabId])

    // Determine if we're showing a deep view (not at tab level)
    const isDeepView = targetNodeId && 
        targetNodeId !== node.id && 
        !node.children?.find(c => c.id === targetNodeId)

    // Get the title to display (current location or app title)
    const displayTitle = useMemo(() => {
        if (isDeepView && viewportContent) {
            return viewportContent.title
        }
        return title
    }, [isDeepView, viewportContent, title])

    // Handle tab click - navigate to the tab AND clear deep navigation
    const handleTabClick = (tabId: string) => {
        setSelectedTabId(tabId)
        // Navigate to the tab, which will clear targetNodeId
        navigateToNode(tabId)
    }

    // Handle action button click
    const handleActionClick = () => {
        if (actionConfig) {
            setShowActionDropdown(true)
        }
    }

    // Handle option selection from dropdown
    const handleOptionSelect = (option: CreateOption) => {
        setShowActionDropdown(false)
        if (actions && actionConfig) {
            actions.onOpenCreateForm(option.type, actionConfig.parentId)
        }
    }

    // =========================================================================
    // RENDER
    // =========================================================================

    return (
        <div className="flex flex-col h-[100dvh] bg-dark-950 text-white overflow-hidden">
            {/* Header Section - FIXED at top, z-50 ensures dropdowns float above tab content */}
            <div className="flex-none border-b border-dark-800 bg-dark-900/50 backdrop-blur-sm z-50">
                {/* Title Bar */}
                <div className="flex items-center gap-3 px-4 py-3">
                    {/* Back Button (when deep) */}
                    {canNavigateBack && (
                        <button
                            onClick={navigateBack}
                            className="flex items-center justify-center w-8 h-8 -ml-2 rounded-full hover:bg-dark-800 transition-colors"
                            aria-label="Go back"
                        >
                            <ChevronLeft size={20} className="text-cyan-400" />
                        </button>
                    )}

                    <h1 className={cn(
                        "text-lg font-bold tracking-tight text-white flex-1",
                        canNavigateBack && "text-base" // Slightly smaller when back button is showing
                    )}>
                        {displayTitle}
                    </h1>

                    {/* Dynamic Action Button - controlled by child views */}
                    {actionConfig && (
                        <div className="relative">
                            <button
                                onClick={handleActionClick}
                                className={cn(
                                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg",
                                    "text-sm font-medium text-white",
                                    "bg-gradient-to-r from-cyan-600 to-cyan-500",
                                    "hover:from-cyan-500 hover:to-cyan-400",
                                    "active:scale-95 transition-all duration-150",
                                    "shadow-lg shadow-cyan-500/20"
                                )}
                                type="button"
                            >
                                <Plus size={16} />
                                {actionConfig.label}
                            </button>

                            {/* Action Dropdown */}
                            {showActionDropdown && (
                                <>
                                    {/* Backdrop */}
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setShowActionDropdown(false)}
                                    />

                                    {/* Dropdown Menu */}
                                    <div
                                        className={cn(
                                            "absolute right-0 top-full mt-2 z-50",
                                            "min-w-[160px] py-2 rounded-lg shadow-lg",
                                            "bg-dark-100 border border-dark-300"
                                        )}
                                    >
                                        {actionConfig.options.map((option, idx) => {
                                            const iconName = option.icon || (option.type === 'folder' ? 'Folder' : 'CheckSquare')
                                            // @ts-ignore - Dynamic icon lookup
                                            const IconComponent = LucideIcons[iconName] || (option.type === 'folder' ? Folder : CheckSquare)
                                            
                                            return (
                                                <button
                                                    key={idx}
                                                    onClick={() => handleOptionSelect(option)}
                                                    className={cn(
                                                        "w-full px-4 py-2.5 text-left text-sm",
                                                        "flex items-center gap-3",
                                                        "text-white hover:bg-dark-200 transition-colors"
                                                    )}
                                                >
                                                    <IconComponent size={16} className={option.type === 'folder' ? "text-cyan-400" : "text-green-400"} />
                                                    {option.label}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Removed: Search Zone - now handled per-directory */}
            </div>

            {/* Viewport (Content) - SCROLLABLE area */}
            <div className="flex-1 min-h-0 overflow-y-auto">
                {viewportContent ? (
                    <ViewEngine root={viewportContent} className="h-full w-full" />
                ) : (
                    <div className="flex items-center justify-center h-full text-dark-500">
                        No content available
                    </div>
                )}
            </div>

            {/* Tab Bar - FIXED at bottom, pb-24 clears the global App Drawer handle */}
            {node.children && node.children.length > 0 && (
                <div className="flex-none flex items-center justify-around border-t border-dark-800 bg-dark-900/90 backdrop-blur-md pb-24 z-10">
                    {node.children.map(child => {
                        // A tab is active if:
                        // 1. It's the selected tab AND we're not in deep view
                        // 2. OR the deep view target is within this tab's subtree
                        const isActive = child.id === activeTabId
                        const iconName = (child.metadata?.icon as string) || 'LayoutGrid'
                        // @ts-ignore - Dynamic icon lookup
                        const IconComponent = LucideIcons[iconName] || LayoutGrid

                        return (
                            <button
                                key={child.id}
                                onClick={() => handleTabClick(child.id)}
                                className={cn(
                                    "flex flex-col items-center justify-center flex-1 py-3 gap-1 transition-colors",
                                    isActive ? "text-cyan-400" : "text-dark-400 hover:text-dark-200"
                                )}
                            >
                                <IconComponent size={20} strokeWidth={isActive ? 2.5 : 2} />
                                <span className="text-[10px] font-medium">{child.title}</span>
                            </button>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

// =============================================================================
// WRAPPER WITH PROVIDER
// =============================================================================

export function LayoutAppShell({ node }: VariantComponentProps) {
    return (
        <ShellActionProvider>
            <LayoutAppShellContent node={node} />
        </ShellActionProvider>
    )
}
