import React from 'react'
import { Search, X } from 'lucide-react'
import { useTodoSearch } from '@/store/useTodoStore'
import { cn } from '@/lib/utils'

export function TodoSearchFilter() {
  const { searchQuery, setSearchQuery } = useTodoSearch()

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400 w-4 h-4" />
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search..."
        className={cn(
          "w-full pl-10 pr-10 py-2 rounded-lg",
          "bg-dark-100 border border-dark-300",
          "text-white placeholder:text-dark-500",
          "focus:ring-2 focus:ring-primary/50 focus:border-primary",
          "transition-colors"
        )}
      />
      {searchQuery && (
        <button
          onClick={() => setSearchQuery('')}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-dark-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
