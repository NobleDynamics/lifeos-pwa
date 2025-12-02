import { useState, useMemo, useEffect } from 'react'
import { Search, Plus, LayoutGrid } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import type { VariantComponentProps } from '../../../registry'
import { useNode, useNodeMeta } from '../../../context/NodeContext'
import { ViewEngine } from '../../ViewEngine'
import { ShellProvider, useShell } from '../../../context/ShellContext'
import { cn } from '@/lib/utils'

/**
 * LayoutAppShell - The Data-Driven App Container
 * 
 * Acts as a Controller, rendering its children as Tabs.
 * 
 * Config (node.metadata):
 * - title: App Title (Header)
 * - action_label: Label for the top-right button
 * - search_enabled: Boolean to show/hide search bar
 * - default_tab_id: UUID of the child to show first
 */
export function LayoutAppShell({ node }: VariantComponentProps) {
    const { title } = node
    const actionLabel = useNodeMeta<string>('action_label')
    const searchEnabled = useNodeMeta<boolean>('search_enabled', false)
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

    return (
        <ShellProvider isSearchEnabled={!!searchEnabled}>
            <div className="flex flex-col h-full bg-dark-950 text-white overflow-hidden">
                {/* Header Section */}
                <div className="flex flex-col border-b border-dark-800 bg-dark-900/50 backdrop-blur-sm z-10">
                    {/* Title Bar */}
                    <div className="flex items-center justify-between px-4 py-3">
                        <h1 className="text-lg font-bold tracking-tight text-white">
                            {title}
                        </h1>

                        {actionLabel && (
                            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-medium hover:bg-cyan-500/20 transition-colors">
                                <Plus size={14} />
                                {actionLabel}
                            </button>
                        )}
                    </div>

                    {/* Search Zone */}
                    {searchEnabled && <ShellSearchBar />}
                </div>

                {/* Viewport (Content) */}
                <div className="flex-1 overflow-y-auto relative">
                    {activeChild ? (
                        <ViewEngine root={activeChild} className="h-full w-full" />
                    ) : (
                        <div className="flex items-center justify-center h-full text-dark-500">
                            No content available
                        </div>
                    )}
                </div>

                {/* Tab Bar (Sticky Bottom) */}
                {node.children && node.children.length > 0 && (
                    <div className="flex items-center justify-around border-t border-dark-800 bg-dark-900/90 backdrop-blur-md pb-safe">
                        {node.children.map(child => {
                            const isActive = child.id === activeTabId
                            const iconName = (child.metadata?.icon as string) || 'LayoutGrid'
                            // @ts-ignore - Dynamic icon lookup
                            const IconComponent = LucideIcons[iconName] || LayoutGrid

                            return (
                                <button
                                    key={child.id}
                                    onClick={() => setActiveTabId(child.id)}
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
        </ShellProvider>
    )
}

function ShellSearchBar() {
    const { searchQuery, setSearchQuery } = useShell()

    return (
        <div className="px-4 pb-3">
            <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search..."
                    className="w-full bg-dark-800/50 border border-dark-700 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder:text-dark-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                />
            </div>
        </div>
    )
}
