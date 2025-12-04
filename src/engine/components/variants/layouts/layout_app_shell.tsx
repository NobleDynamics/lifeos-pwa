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
import { ChevronLeft, ChevronRight, LayoutGrid, Plus, Folder, CheckSquare, Home } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import type { VariantComponentProps } from '../../../registry'
import { useNodeMeta } from '../../../context/NodeContext'
import { ViewEngine } from '../../ViewEngine'
import { useShellNavigation, findContainingChild, findNodeInTree } from '../../../context/ShellNavigationContext'
import { ShellActionProvider, useShellAction, type CreateOption } from '../../../context/ShellActionContext'
import { useEngineActions } from '../../../context/EngineActionsContext'
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
    // BREADCRUMB GENERATION
    // =========================================================================

    // Build breadcrumb items from targetPath - skip first item (root) as we show it with Home icon
    const breadcrumbItems = useMemo(() => {
        if (!rootNode || targetPath.length <= 1) return []
        
        // Skip the first item (root/app shell) - we show that as Home
        // Start from index 1 (first tab level)
        return targetPath.slice(1).map((nodeId, index) => {
            const foundNode = findNodeInTree(rootNode, nodeId)
            return {
                id: nodeId,
                title: foundNode?.title || 'Unknown',
                pathIndex: index + 1, // +1 because we sliced from index 1
            }
        })
    }, [rootNode, targetPath])

    // Show breadcrumbs only when we're deeper than Tab level (more than 2 items in path)
    const showBreadcrumbs = targetPath.length > 2

    // =========================================================================
    // RENDER
    // =========================================================================

    // Get app icon from root metadata
    const appIconName = (node.metadata?.icon as string) || 'LayoutGrid'
    // @ts-ignore - Dynamic icon lookup
    const AppIcon = LucideIcons[appIconName] || LayoutGrid

    return (
        <div className="flex flex-col h-[100dvh] bg-dark text-white overflow-hidden relative">
            {/* Header Section - Matches legacy ViewShell styling */}
            <div className="px-4 pt-4 pb-2 safe-top flex-shrink-0 z-50">
                {/* Breadcrumbs - Above title, shown when deep in hierarchy */}
                {showBreadcrumbs && (
                    <nav 
                        className="flex items-center space-x-1 text-sm overflow-x-auto scrollbar-hide py-1 mb-2"
                        aria-label="Breadcrumb"
                    >
                        {/* Home/Root button */}
                        <button
                            onClick={() => navigateToLevel(0)}
                            className={cn(
                                "flex items-center space-x-1 px-2 py-1 rounded-md",
                                "text-dark-400 hover:text-white hover:bg-dark-200/50",
                                "transition-colors whitespace-nowrap flex-shrink-0"
                            )}
                            aria-label={`Go to ${title}`}
                        >
                            <Home className="w-3.5 h-3.5" />
                            <span>{title}</span>
                        </button>

                        {/* Path items - all except the last one (current) */}
                        {breadcrumbItems.slice(0, -1).map((item, index) => (
                            <span key={item.id} className="flex items-center">
                                <ChevronRight className="w-4 h-4 text-dark-500 flex-shrink-0" />
                                <button
                                    onClick={() => navigateToLevel(item.pathIndex)}
                                    className={cn(
                                        "px-2 py-1 rounded-md transition-colors whitespace-nowrap",
                                        "max-w-[150px] truncate",
                                        "text-dark-400 hover:text-white hover:bg-dark-200/50"
                                    )}
                                    title={item.title}
                                >
                                    {item.title}
                                </button>
                            </span>
                        ))}

                        {/* Current item (last in breadcrumbs) - not clickable, cyan color */}
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

                {/* Title Row */}
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                        {/* Back Button (when deep) */}
                        {canNavigateBack && (
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

                        {/* Title */}
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
            </div>

            {/* Viewport (Content) - SCROLLABLE area with bottom padding for tab bar + drawer handle */}
            <div 
                className="flex-1 min-h-0 overflow-y-auto"
                style={{ paddingBottom: `${DRAWER_HANDLE_HEIGHT + 70}px` }}
            >
                {viewportContent ? (
                    <ViewEngine root={viewportContent} className="h-full w-full" />
                ) : (
                    <div className="flex items-center justify-center h-full text-dark-500">
                        No content available
                    </div>
                )}
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
