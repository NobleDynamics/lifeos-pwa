import { useState, useMemo, useEffect } from 'react'
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

    return (
        <div className="flex flex-col h-full bg-dark-950">
            {/* Segmented Control Bar */}
            <div className="px-4 py-3 bg-dark-950 z-10">
                <div className="flex p-1 bg-dark-900 rounded-lg overflow-x-auto no-scrollbar">
                    {node.children.map(child => {
                        const isActive = child.id === activeTabId
                        return (
                            <button
                                key={child.id}
                                onClick={() => setActiveTabId(child.id)}
                                className={cn(
                                    "flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-all whitespace-nowrap",
                                    isActive
                                        ? "bg-dark-800 text-white shadow-sm"
                                        : "text-dark-400 hover:text-dark-200 hover:bg-dark-800/50"
                                )}
                            >
                                {child.title}
                            </button>
                        )
                    })}
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
