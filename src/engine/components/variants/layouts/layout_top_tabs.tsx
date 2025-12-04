import { useState, useMemo, useEffect } from 'react'
import { ChevronDown, LayoutGrid } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import type { VariantComponentProps } from '../../../registry'
import { useNodeMeta } from '../../../context/NodeContext'
import { ViewEngine } from '../../ViewEngine'
import { cn } from '@/lib/utils'

/**
 * LayoutTopTabs - Sub-Navigation Container
 * 
 * Renders children as a segmented control (pills) at the top.
 * Designed to be nested inside LayoutAppShell.
 */
export function LayoutTopTabs({ node }: VariantComponentProps) {
    const defaultTabId = useNodeMeta<string>('default_tab_id')

    // Initialize active tab
    const [activeTabId, setActiveTabId] = useState<string | null>(() => {
        if (defaultTabId) return defaultTabId
        if (node.children && node.children.length > 0) return node.children[0].id
        return null
    })

    // Ensure activeTabId is valid if children change
    useEffect(() => {
        if (node.children && node.children.length > 0) {
            if (!activeTabId || !node.children.find(c => c.id === activeTabId)) {
                setActiveTabId(node.children[0].id)
            }
        } else {
            setActiveTabId(null)
        }
    }, [node.children, activeTabId])

    // Find active child node
    const activeChild = useMemo(() => {
        return node.children?.find(c => c.id === activeTabId) || null
    }, [node.children, activeTabId])

    if (!node.children || node.children.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-dark-500">
                No tabs available
            </div>
        )
    }

    // Overflow logic: show max 3 tabs, rest in "More" dropdown
    const MAX_VISIBLE_TABS = 3
    const visibleTabs = node.children.slice(0, MAX_VISIBLE_TABS)
    const overflowTabs = node.children.slice(MAX_VISIBLE_TABS)
    const hasOverflow = overflowTabs.length > 0

    // Dropdown state
    const [showMoreDropdown, setShowMoreDropdown] = useState(false)

    // Check if active tab is in overflow
    const activeInOverflow = overflowTabs.some(c => c.id === activeTabId)

    return (
        <div className="flex flex-col h-full bg-dark-950">
            {/* Segmented Control Bar - Matches legacy Health > Brain styling */}
            <div className="px-4 py-3 bg-dark-950 z-10">
                <div className="flex gap-1 p-1 bg-dark-100 rounded-xl">
                    {/* Visible Tabs */}
                    {visibleTabs.map(child => {
                        const isActive = child.id === activeTabId
                        const iconName = (child.metadata?.icon as string) || null
                        // @ts-ignore - Dynamic icon lookup
                        const IconComponent = iconName ? (LucideIcons[iconName] || LayoutGrid) : null

                        return (
                            <button
                                key={child.id}
                                onClick={() => setActiveTabId(child.id)}
                                className={cn(
                                    // Base styles - horizontal layout with icon + label
                                    "flex-1 flex items-center justify-center gap-1 py-2 px-2 rounded-lg",
                                    "text-xs font-medium transition-all",
                                    // Conditional styles matching legacy CategoryPane
                                    isActive
                                        ? "bg-primary/20 text-primary"
                                        : "text-dark-500 hover:text-white"
                                )}
                            >
                                {IconComponent && <IconComponent size={12} />}
                                <span>{child.title}</span>
                            </button>
                        )
                    })}

                    {/* "More" Dropdown Trigger */}
                    {hasOverflow && (
                        <div className="relative">
                            <button
                                onClick={() => setShowMoreDropdown(!showMoreDropdown)}
                                className={cn(
                                    "flex items-center justify-center gap-1 py-2 px-2 rounded-lg",
                                    "text-xs font-medium transition-all",
                                    activeInOverflow
                                        ? "bg-primary/20 text-primary"
                                        : "text-dark-500 hover:text-white"
                                )}
                            >
                                More
                                <ChevronDown size={12} className={cn(
                                    "transition-transform",
                                    showMoreDropdown && "rotate-180"
                                )} />
                            </button>

                            {/* Dropdown Menu */}
                            {showMoreDropdown && (
                                <>
                                    {/* Backdrop */}
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setShowMoreDropdown(false)}
                                    />

                                    {/* Menu */}
                                    <div className={cn(
                                        "absolute right-0 top-full mt-2 z-50",
                                        "min-w-[140px] py-1 rounded-xl shadow-lg",
                                        "bg-dark-100 border border-dark-300"
                                    )}>
                                        {overflowTabs.map(child => {
                                            const isActive = child.id === activeTabId
                                            const iconName = (child.metadata?.icon as string) || null
                                            // @ts-ignore - Dynamic icon lookup
                                            const IconComponent = iconName ? (LucideIcons[iconName] || LayoutGrid) : null

                                            return (
                                                <button
                                                    key={child.id}
                                                    onClick={() => {
                                                        setActiveTabId(child.id)
                                                        setShowMoreDropdown(false)
                                                    }}
                                                    className={cn(
                                                        "w-full px-4 py-2 text-left text-xs",
                                                        "flex items-center gap-2",
                                                        "transition-colors",
                                                        isActive
                                                            ? "bg-primary/20 text-primary"
                                                            : "text-dark-500 hover:bg-dark-200 hover:text-white"
                                                    )}
                                                >
                                                    {IconComponent && <IconComponent size={12} />}
                                                    <span>{child.title}</span>
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

            {/* Viewport */}
            <div className="flex-1 overflow-hidden relative">
                {activeChild ? (
                    <ViewEngine root={activeChild} className="h-full w-full" />
                ) : (
                    <div className="flex items-center justify-center h-full text-dark-500">
                        Select a tab
                    </div>
                )}
            </div>
        </div>
    )
}
