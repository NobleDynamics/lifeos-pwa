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
 * HEADER LAYOUT (Fixed Order):
 * Row 1: Back Button (conditional) + App Icon + Title + Action Button
 * Row 2: Breadcrumbs (always visible: "My Home > Shopping > ...")
 * Row 3: Search/Content (rendered by child views like view_directory)
 * 
 * Config (node.metadata):
 * - title: App Title (Header)
 * - default_tab_id: UUID of the child to show first
 */

import { useState, useMemo, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, LayoutGrid, Plus, Folder, CheckSquare, Home } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import type { VariantComponentProps } from '../../../registry'
import { useNodeMeta } from '../../../context/NodeContext'
import { ViewEngine } from '../../ViewEngine'
import { useShellNavigation, findContainingChild, findNodeInTree } from '../../../context/ShellNavigationContext'
import { ShellActionProvider, useShellAction, type CreateOption } from '../../../context/ShellActionContext'
import { useEngineActions } from '../../../context/EngineActionsContext'
import { useBackButton } from '@/hooks/useBackButton'
import { useAppStore } from '@/store/useAppStore'
import { cn } from '@/lib/utils'
import { DRAWER_HANDLE_HEIGHT } from '@/components/Layout'

function LayoutAppShellContent({ node }: VariantComponentProps) {
    const { title } = node
    const defaultTabId = useNodeMeta<string>('default_tab_id')

    // Get navigation context
    const { targetNodeId, navigateBack, canNavigateBack, targetPath, navigateToNode, navigateToLevel, rootNode } = useShellNavigation()
    
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

    // =========================================================================
    // NAVIGATION STATE HELPERS
    // =========================================================================

    // Determine if we're showing a deep view (deeper than tab level)
    // Deep view = target is NOT null, NOT the shell itself, and NOT a direct child (tab)
    const isDeepView = targetNodeId && 
        targetNodeId !== node.id && 
        !node.children?.find(c => c.id === targetNodeId)

    // Determine if we're at Tab Root (viewing a direct child/tab of the shell)
    // At Tab Root = targetNodeId is null OR targetNodeId is a direct child of the shell
    const isAtTabRoot = !targetNodeId || 
        targetNodeId === node.id || 
        node.children?.some(c => c.id === targetNodeId)

    // Get the active tab node (for title and breadcrumb purposes)
    const activeTabNode = useMemo(() => {
        const activeTabChild = node.children?.find(c => c.id === activeTabId)
        return activeTabChild || null
    }, [node.children, activeTabId])

    // Get the title to display
    // Priority: Deep view folder title > Active tab title > App title
    const displayTitle = useMemo(() => {
        // If we're in a deep view, show the current folder's title
        if (isDeepView && viewportContent) {
            return viewportContent.title
        }
        // If we're at tab root and have an active tab, show the tab's title
        if (activeTabNode) {
            return activeTabNode.title
        }
        // Fallback to app title
        return title
    }, [isDeepView, viewportContent, activeTabNode, title])

    // Determine if we should show the back button
    // Show back button ONLY when we're deeper than tab level (not at tab root)
    const showBackButton = !isAtTabRoot && canNavigateBack

    // =========================================================================
    // BACK BUTTON HANDLING (Priority 15 - Tab switching via Zustand)
    // =========================================================================
    
    // Determine the effective default tab ID
    const effectiveDefaultTabId = useMemo(() => {
        if (defaultTabId) return defaultTabId
        return node.children?.[0]?.id || null
    }, [defaultTabId, node.children])
    
    // Get paneId from root node metadata (set by ViewEnginePane)
    // This allows the shell to register its default tab with the global store
    const paneId = (rootNode?.metadata?.context as string) || node.id
    
    // Register default tab with Zustand store on mount
    // This enables the store's backFromTab action to work correctly
    useEffect(() => {
        if (effectiveDefaultTabId) {
            useAppStore.getState().setDefaultTab(paneId, effectiveDefaultTabId)
        }
    }, [paneId, effectiveDefaultTabId])
    
    // Sync active tab to store when it changes
    useEffect(() => {
        if (activeTabId) {
            useAppStore.getState().setActiveTab(paneId, activeTabId)
        }
    }, [paneId, activeTabId])
    
    /**
     * Back button handler for the App Shell
     * 
     * Priority: 15 (called AFTER ViewEnginePane at 20, BEFORE app-level at 0)
     * 
     * STATE-FIRST STRATEGY:
     * - Uses Zustand store's backFromTab action for tab switching
     * - Store knows the default tab and current tab per pane
     * - Returns true if switched tabs, false if already at default
     * 
     * Handles:
     * 1. At non-default tab root → go to default tab (via store)
     * 2. At default tab root → return false (let app-level handle exit)
     */
    
    // Register back button handler at priority 15 using store action
    useBackButton({
        id: `shell:${paneId}`,
        priority: 15,
        handler: () => {
            // Use store's backFromTab which handles tab switching logic
            const switched = useAppStore.getState().backFromTab(paneId)
            if (switched) {
                // Also update local navigation context to sync UI
                const defaultTab = useAppStore.getState().defaultTabByPane[paneId]
                if (defaultTab) {
                    navigateToNode(defaultTab)
                }
            }
            return switched
        }
    })

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
    // BREADCRUMB GENERATION
    // =========================================================================

    // Build breadcrumb items - always include from Tab level
    // Format: "My Home > Shopping > Lists > ..."
    const breadcrumbItems = useMemo(() => {
        // Start with the root (App title)
        const items: Array<{ id: string; title: string; pathIndex: number; isRoot?: boolean }> = []
        
        // Add root (App Shell) as first item - always present
        items.push({
            id: node.id,
            title: title, // App title (e.g., "My Home")
            pathIndex: 0,
            isRoot: true,
        })

        // If we have a targetPath with items beyond root, add them
        if (rootNode && targetPath.length > 1) {
            // Add all items from the path (starting at index 1, skipping root)
            targetPath.slice(1).forEach((nodeId, index) => {
                const foundNode = findNodeInTree(rootNode, nodeId)
                items.push({
                    id: nodeId,
                    title: foundNode?.title || 'Unknown',
                    pathIndex: index + 1,
                })
            })
        } else if (activeTabNode) {
            // If no targetPath but we have an active tab, add it
            // This handles the initial load case where targetNodeId is null
            items.push({
                id: activeTabNode.id,
                title: activeTabNode.title,
                pathIndex: 1,
            })
        }

        return items
    }, [node.id, title, rootNode, targetPath, activeTabNode])

    // Always show breadcrumbs (at minimum: "My Home > [Tab Name]")
    const showBreadcrumbs = breadcrumbItems.length >= 2

    // Check if this shell has bottom tabs (used for dynamic spacer height)
    const hasBottomTabs = node.children && node.children.length > 0

    // =========================================================================
    // RENDER
    // =========================================================================

    // Get app icon from root metadata
    const appIconName = (node.metadata?.icon as string) || 'LayoutGrid'
    // @ts-ignore - Dynamic icon lookup
    const AppIcon = LucideIcons[appIconName] || LayoutGrid

    return (
        <div className="flex flex-col h-[100dvh] bg-dark text-white overflow-hidden relative">
            {/* Header Section - Fixed Order: Title Row → Breadcrumbs */}
            <div className="px-4 pt-4 pb-2 safe-top flex-shrink-0 z-50">
                {/* Row 1: Title Row */}
                <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                        {/* Back Button - Only show when deeper than tab level */}
                        {showBackButton && (
                            <button
                                onClick={navigateBack}
                                className="p-1 -ml-1 rounded-lg hover:bg-dark-200 transition-colors"
                                aria-label="Go back"
                            >
                                <ChevronLeft size={24} className="text-dark-400" />
                            </button>
                        )}

                        {/* App Icon */}
                        <AppIcon size={24} className="text-primary flex-shrink-0" />

                        {/* Title - Shows tab title at root, folder title when deep */}
                        <h1 className="text-xl font-bold truncate">{displayTitle}</h1>
                    </div>

                    {/* Dynamic Action Button - controlled by child views */}
                    {actionConfig && (
                        <div className="relative flex-shrink-0">
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

                {/* Row 2: Breadcrumbs - Always visible (e.g., "My Home > Shopping") */}
                {showBreadcrumbs && (
                    <nav 
                        className="flex items-center space-x-1 text-sm overflow-x-auto scrollbar-hide py-1"
                        aria-label="Breadcrumb"
                    >
                        {/* Render all breadcrumb items except the last (current) */}
                        {breadcrumbItems.slice(0, -1).map((item, index) => (
                            <span key={item.id} className="flex items-center">
                                {/* Show separator before all items except the first */}
                                {index > 0 && (
                                    <ChevronRight className="w-4 h-4 text-dark-500 flex-shrink-0" />
                                )}
                                <button
                                    onClick={() => navigateToLevel(item.pathIndex)}
                                    className={cn(
                                        "flex items-center space-x-1 px-2 py-1 rounded-md",
                                        "text-dark-400 hover:text-white hover:bg-dark-200/50",
                                        "transition-colors whitespace-nowrap flex-shrink-0",
                                        "max-w-[150px] truncate"
                                    )}
                                    title={item.title}
                                    aria-label={item.isRoot ? `Go to ${item.title}` : item.title}
                                >
                                    {item.isRoot && <Home className="w-3.5 h-3.5 mr-1" />}
                                    <span>{item.title}</span>
                                </button>
                            </span>
                        ))}

                        {/* Current item (last in breadcrumbs) - not clickable, cyan highlight */}
                        {breadcrumbItems.length > 0 && (
                            <span className="flex items-center">
                                <ChevronRight className="w-4 h-4 text-dark-500 flex-shrink-0" />
                                <span
                                    className={cn(
                                        "px-2 py-1 rounded-md whitespace-nowrap",
                                        "max-w-[150px] truncate",
                                        "text-primary font-medium cursor-default"
                                    )}
                                    title={breadcrumbItems[breadcrumbItems.length - 1]?.title}
                                >
                                    {breadcrumbItems[breadcrumbItems.length - 1]?.title}
                                </span>
                            </span>
                        )}
                    </nav>
                )}
            </div>

            {/* Viewport (Content) - SCROLLABLE area */}
            <div className="flex-1 min-h-0 overflow-y-auto">
                {viewportContent ? (
                    <ViewEngine root={viewportContent} className="w-full" />
                ) : (
                    <div className="flex items-center justify-center h-64 text-dark-500">
                        No content available
                    </div>
                )}
                {/* Bottom buffer spacer - ensures content scrolls above floating tab bar + drawer handle */}
                <div 
                    className={cn(
                        "flex-shrink-0",
                        hasBottomTabs ? "h-[140px]" : `h-[${DRAWER_HANDLE_HEIGHT}px]`
                    )} 
                    aria-hidden="true" 
                />
            </div>

            {/* Tab Bar - Matches legacy CategoryPane styling */}
            {node.children && node.children.length > 0 && (
                <div 
                    className="absolute left-0 right-0 bottom-0 px-3 pb-2 z-20"
                    style={{ paddingBottom: `${DRAWER_HANDLE_HEIGHT + 8}px` }}
                >
                    <div className="flex p-1 bg-dark-100/80 backdrop-blur rounded-xl">
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
                                        // Base styles - horizontal layout with icon + label inline
                                        "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg",
                                        "text-xs font-medium transition-all duration-200",
                                        // Conditional styles matching legacy CategoryPane
                                        isActive 
                                            ? "bg-primary/20 text-primary shadow-sm"
                                            : "text-dark-500 hover:text-white hover:bg-dark-200/50"
                                    )}
                                >
                                    <IconComponent size={16} />
                                    {/* Label hidden on inactive tabs (mobile), always shown when active */}
                                    <span className={isActive ? "" : "hidden sm:inline"}>
                                        {child.title}
                                    </span>
                                </button>
                            )
                        })}
                    </div>
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
