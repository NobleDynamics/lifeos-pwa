import { useState, useMemo, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
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
            {/* Segmented Control Bar (Pill Toggle Style) */}
            <div className="px-4 py-3 bg-dark-950 z-10">
                <div className="flex p-1 bg-dark-800/50 rounded-lg mb-4">
                    {/* Visible Tabs */}
                    {visibleTabs.map(child => {
                        const isActive = child.id === activeTabId
                        return (
                            <button
                                key={child.id}
                                onClick={() => setActiveTabId(child.id)}
                                className={cn(
                                    "flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-all whitespace-nowrap",
                                    isActive
                                        ? "bg-[var(--color-primary,theme(colors.cyan.500))] text-white shadow-sm"
                                        : "text-dark-400 hover:text-white"
                                )}
                            >
                                {child.title}
                            </button>
                        )
                    })}

                    {/* "More" Dropdown Trigger */}
                    {hasOverflow && (
                        <div className="relative">
                            <button
                                onClick={() => setShowMoreDropdown(!showMoreDropdown)}
                                className={cn(
                                    "flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md transition-all whitespace-nowrap",
                                    activeInOverflow
                                        ? "bg-[var(--color-primary,theme(colors.cyan.500))] text-white shadow-sm"
                                        : "text-dark-400 hover:text-white"
                                )}
                            >
                                More
                                <ChevronDown size={14} className={cn(
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
                                        "min-w-[140px] py-1 rounded-lg shadow-lg",
                                        "bg-dark-100 border border-dark-300"
                                    )}>
                                        {overflowTabs.map(child => {
                                            const isActive = child.id === activeTabId
                                            return (
                                                <button
                                                    key={child.id}
                                                    onClick={() => {
                                                        setActiveTabId(child.id)
                                                        setShowMoreDropdown(false)
                                                    }}
                                                    className={cn(
                                                        "w-full px-4 py-2 text-left text-sm",
                                                        "transition-colors",
                                                        isActive
                                                            ? "bg-[var(--color-primary,theme(colors.cyan.500))]/20 text-white"
                                                            : "text-dark-400 hover:bg-dark-200 hover:text-white"
                                                    )}
                                                >
                                                    {child.title}
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
