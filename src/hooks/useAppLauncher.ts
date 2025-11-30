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
    household: { id: 'household', label: 'Household', icon: Home, color: 'text-purple-400', isSystem: true },
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
}

/**
 * Helper to resolve icon string to Lucide Component
 * e.g. "icon:leaf" -> Leaf component
 */
function resolveIcon(iconName?: string): LucideIcon {
    if (!iconName) return AppWindow

    // Remove "icon:" prefix if present
    const cleanName = iconName.replace(/^icon:/, '')

    // Convert kebab-case to PascalCase (e.g. "layout-dashboard" -> "LayoutDashboard")
    // Or just try to find it in the icons object if keys are PascalCase
    // Lucide exports are PascalCase.

    // Simple PascalCase converter
    const pascalName = cleanName
        .split('-')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join('') as keyof typeof icons

    const IconComponent = icons[pascalName] as LucideIcon | undefined

    return IconComponent || AppWindow
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

            // If it's a known system app, use its ID
            // Otherwise use the root ID as the pane ID
            const id = isSystem && SYSTEM_APPS[meta.system_id] ? meta.system_id : root.id

            return {
                id,
                title: root.title,
                icon: meta.icon, // Keep raw string here
                context: meta.context,
                isSystem
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

        // B. Merge/Add Dynamic Apps
        dynamicPanes.forEach(pane => {
            // If it matches a system app, it might override metadata (future proofing)
            // For now, we just ensure it exists.

            if (SYSTEM_APPS[pane.id]) {
                // It's a system app we already know about
                return
            }

            // It's a user app
            appMap.set(pane.id, {
                id: pane.id,
                label: pane.title,
                icon: resolveIcon(pane.icon), // Resolve string to component
                color: 'text-cyan-400', // Default color
                isSystem: false,
                context: pane.context
            })
        })

        return appMap
    }, [dynamicPanes])

    // 4. Ensure Pane Order includes all apps
    useEffect(() => {
        if (isLoading) return

        const currentSet = new Set(paneOrder)
        const newApps = Array.from(apps.keys()).filter(id => !currentSet.has(id))

        if (newApps.length > 0) {
            // Insert new apps before Settings
            const settingsIndex = paneOrder.indexOf('settings')
            const newOrder = [...paneOrder]

            if (settingsIndex !== -1) {
                newOrder.splice(settingsIndex, 0, ...newApps)
            } else {
                newOrder.push(...newApps)
            }

            updatePaneOrder(newOrder)
        }
    }, [apps, paneOrder, updatePaneOrder, isLoading])

    return {
        apps,
        isLoading
    }
}
