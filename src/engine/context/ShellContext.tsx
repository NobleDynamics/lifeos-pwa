import { createContext, useContext, useState, ReactNode } from 'react'

interface ShellContextValue {
    searchQuery: string
    setSearchQuery: (query: string) => void
    isSearchEnabled: boolean
}

const ShellContext = createContext<ShellContextValue | null>(null)

export function ShellProvider({
    children,
    isSearchEnabled
}: {
    children: ReactNode
    isSearchEnabled: boolean
}) {
    const [searchQuery, setSearchQuery] = useState('')

    return (
        <ShellContext.Provider value={{ searchQuery, setSearchQuery, isSearchEnabled }}>
            {children}
        </ShellContext.Provider>
    )
}

export function useShell() {
    const context = useContext(ShellContext)
    if (!context) {
        return {
            searchQuery: '',
            setSearchQuery: () => { },
            isSearchEnabled: false
        }
    }
    return context
}
