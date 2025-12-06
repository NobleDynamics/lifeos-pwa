import { useMemo, useEffect } from 'react'
import { useAllContextRoots } from './useContextRoot'
import { useAppStore, DynamicPane, PaneType } from '@/store/useAppStore'
import {
    Home,
    HeartPulse,
    Calendar,
    MessageSquare,
    LayoutDashboard,
    Rss,
    Cloud,
    Wallet,
    Settings,
    Code,
    AppWindow,
    LucideIcon,
    // Import * as icons to allow dynamic lookup
    icons
} from 'lucide-react'

// System App Configuration
interface SystemAppConfig {
    id: string
    label: string
    icon: LucideIcon
    color: string
    isSystem: true
}

const SYSTEM_APPS: Record<string, SystemAppConfig> = {
    health: { id: 'health', label: 'Health', icon: HeartPulse, color: 'text-red-400', isSystem: true },
    agenda: { id: 'agenda', label: 'Agenda', icon: Calendar, color: 'text-blue-400', isSystem: true },
    chat: { id: 'chat', label: 'Chat', icon: MessageSquare, color: 'text-green-400', isSystem: true },
    dashboard: { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'text-primary', isSystem: true },
    feed: { id: 'feed', label: 'Feed', icon: Rss, color: 'text-yellow-400', isSystem: true },
    cloud: { id: 'cloud', label: 'Cloud', icon: Cloud, color: 'text-cyan-400', isSystem: true },
    finance: { id: 'finance', label: 'Finance', icon: Wallet, color: 'text-emerald-400', isSystem: true },
    settings: { id: 'settings', label: 'Settings', icon: Settings, color: 'text-gray-400', isSystem: true },
    sandbox: { id: 'sandbox', label: 'Sandbox', icon: Code, color: 'text-orange-400', isSystem: true },
}

export interface AppConfig {
    id: string
    label: string
    icon: LucideIcon
    color: string
    isSystem: boolean
    context?: string
    isImmersive?: boolean  // Apps with horizontal swipe that conflict with global nav
}

/**
 * Helper to resolve icon string to Lucide Component and Color
 * e.g. "icon:leaf" -> { Icon: Leaf, color: undefined }
 * e.g. "icon:shopping-cart:#10B981" -> { Icon: ShoppingCart, color: "#10B981" }
 */
function resolveIcon(iconString?: string): { Icon: LucideIcon, color?: string } {
    if (!iconString) return { Icon: AppWindow }

    // Remove "icon:" prefix
    const raw = iconString.replace(/^icon:/, '')

    // Split by colon to get name and optional color
    const parts = raw.split(':')
    const name = parts[0]
    const color = parts[1] // Might be undefined

    // Convert kebab-case to PascalCase
    const pascalName = name
        .split('-')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join('') as keyof typeof icons

    const IconComponent = icons[pascalName] as LucideIcon | undefined

    return {
        Icon: IconComponent || AppWindow,
        color: color
    }
}

export function useAppLauncher() {
    const { data: contextRoots, isLoading } = useAllContextRoots()
    const { registerDynamicPanes, paneOrder, updatePaneOrder } = useAppStore()

    // 1. Convert Context Roots to Dynamic Panes
    const dynamicPanes = useMemo(() => {
        if (!contextRoots) return []

        return contextRoots.map(root => {
            const meta = root.meta_data as Record<string, any> || {}
            const isSystem = meta.is_system_app === true
            const context = meta.context as string

            // Determine ID:
            // 1. If explicitly a system app with a system_id, use that.
            // 2. If the context matches a known system context, map it to the system ID.
            // 3. Otherwise, use the resource UUID.
            let id = root.id

            if (isSystem && meta.system_id && SYSTEM_APPS[meta.system_id]) {
                id = meta.system_id
            } else if (context === 'cloud.files') {
                id = 'cloud'
            } else if (context === 'health.dashboard') {
                id = 'health'
            } else if (context === 'finance.dashboard') {
                id = 'finance'
            }

            return {
                id,
                title: root.title,
                icon: meta.icon, // Keep raw string here
                context: meta.context,
                isSystem: isSystem || !!SYSTEM_APPS[id] // Treat as system if it maps to one
            } as DynamicPane
        })
    }, [contextRoots])

    // 2. Register with Store
    useEffect(() => {
        if (dynamicPanes.length > 0) {
            registerDynamicPanes(dynamicPanes)
        }
    }, [dynamicPanes, registerDynamicPanes])

    // 3. Generate Full App List (Merged)
    const apps = useMemo(() => {
        const appMap = new Map<string, AppConfig>()

        // A. Add Hardcoded System Apps first (defaults)
        Object.values(SYSTEM_APPS).forEach(app => {
            appMap.set(app.id, {
                ...app,
                isSystem: true
            })
        })

        // B. Merge/Add Dynamic Apps (including detecting immersive mode)
        contextRoots?.forEach(root => {
            const meta = root.meta_data as Record<string, any> || {}
            const context = meta.context as string
            
            // Skip if it's a system app we already know about
            if (SYSTEM_APPS[root.id]) return
            
            // Check for known system context mappings
            if (context === 'cloud.files' || context === 'health.dashboard' || context === 'finance.dashboard') {
                return // These map to system apps
            }

            // Resolve icon and color
            const { Icon, color } = resolveIcon(meta.icon)
            
            // Check if this is an immersive app (horizontal swipe conflicts with global nav)
            const isImmersive = meta.presentation_mode === 'immersive'

            // It's a user app
            appMap.set(root.id, {
                id: root.id,
                label: root.title,
                icon: Icon,
                // Use parsed color, or default to cyan if not provided
                color: color ? `text-[${color}]` : 'text-cyan-400',
                isSystem: false,
                context: context,
                isImmersive: isImmersive
            })
        })

        return appMap
    }, [contextRoots])

    // 4. Ensure Pane Order includes all NON-IMMERSIVE apps
    // Immersive apps (like Kanban boards) open as modal overlays, not swipeable panes
    useEffect(() => {
        if (isLoading) return

        const currentSet = new Set(paneOrder)
        
        // Filter out immersive apps - they should NOT be in paneOrder
        const newApps = Array.from(apps.entries())
            .filter(([id, config]) => {
                // Must not already be in paneOrder
                if (currentSet.has(id)) return false
                // Must not be an immersive app
                if (config.isImmersive) return false
                return true
            })
            .map(([id]) => id)

        console.log('useAppLauncher: Current paneOrder:', paneOrder)
        console.log('useAppLauncher: Discovered apps:', Array.from(apps.keys()))
        console.log('useAppLauncher: Immersive apps (excluded from panes):', 
            Array.from(apps.entries()).filter(([, c]) => c.isImmersive).map(([id]) => id))
        console.log('useAppLauncher: New pane apps to add:', newApps)

        if (newApps.length > 0) {
            // Insert new apps before Settings
            const settingsIndex = paneOrder.indexOf('settings')
            const newOrder = [...paneOrder]

            if (settingsIndex !== -1) {
                newOrder.splice(settingsIndex, 0, ...newApps)
            } else {
                newOrder.push(...newApps)
            }

            console.log('useAppLauncher: Updating paneOrder to:', newOrder)
            updatePaneOrder(newOrder)
        }
    }, [apps, paneOrder, updatePaneOrder, isLoading])

    return {
        apps,
        isLoading
    }
}
