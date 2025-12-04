/**
 * RowTransactionHistory Variant Component
 * 
 * A read-only transaction row with icon, title, date, and formatted amount.
 * Designed for displaying transaction history without edit capabilities.
 * 
 * @module engine/components/variants/rows/row_transaction_history
 */

import { 
  ShoppingCart, 
  Coffee, 
  Car, 
  Zap, 
  Tv, 
  Utensils,
  CreditCard,
  type LucideIcon
} from 'lucide-react'
import type { VariantComponentProps } from '../../../registry'
import { useNode } from '../../../context/NodeContext'
import { useSlot } from '../../../hooks/useSlot'
import { cn } from '@/lib/utils'

/**
 * Category to icon mapping
 */
const categoryIcons: Record<string, LucideIcon> = {
  food: ShoppingCart,
  groceries: ShoppingCart,
  dining: Utensils,
  restaurant: Utensils,
  coffee: Coffee,
  transport: Car,
  gas: Car,
  utilities: Zap,
  electric: Zap,
  entertainment: Tv,
  subscription: Tv,
  default: CreditCard,
}

/**
 * Category to color mapping
 */
const categoryColors: Record<string, string> = {
  food: '#22c55e',      // green
  groceries: '#22c55e', // green
  dining: '#f97316',    // orange
  restaurant: '#f97316',// orange
  coffee: '#a855f7',    // purple
  transport: '#3b82f6', // blue
  gas: '#3b82f6',       // blue
  utilities: '#eab308', // yellow
  electric: '#eab308',  // yellow
  entertainment: '#ec4899', // pink
  subscription: '#ec4899',  // pink
  default: '#06b6d4',   // cyan
}

/**
 * Format a number as currency
 */
function formatCurrency(value: number, symbol = '$'): string {
  return `${symbol}${Math.abs(value).toLocaleString('en-US', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })}`
}

/**
 * Format date string for display
 */
function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return ''
  
  try {
    const date = new Date(dateStr)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    
    // Show relative date for recent transactions
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    
    // Otherwise show formatted date
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })
  } catch {
    return dateStr
  }
}

/**
 * Get icon for a category
 */
function getCategoryIcon(category: string | undefined): LucideIcon {
  if (!category) return categoryIcons.default
  const key = category.toLowerCase()
  return categoryIcons[key] || categoryIcons.default
}

/**
 * Get color for a category
 */
function getCategoryColor(category: string | undefined): string {
  if (!category) return categoryColors.default
  const key = category.toLowerCase()
  return categoryColors[key] || categoryColors.default
}

/**
 * RowTransactionHistory - Read-only transaction display
 * 
 * Structure:
 * ┌────────────────────────────────────────────────────────────────┐
 * │ [Icon]  Merchant Name                              -$125.50   │
 * │         Dec 1 • Food                                          │
 * └────────────────────────────────────────────────────────────────┘
 * 
 * Slots:
 * - headline: Primary text (default: node.title)
 * - amount: Transaction amount (number)
 * - date: Transaction date (string, ISO format)
 * - category: Category for icon/color (e.g., 'Food', 'Transport')
 * - description: Optional description text
 * - currency_symbol: Currency symbol (default: '$')
 * - is_income: Whether this is income (positive, green) or expense (default: false)
 */
export function RowTransactionHistory({ node }: VariantComponentProps) {
  const { depth } = useNode()
  
  // Slot-based data access
  const headline = useSlot<string>('headline') ?? node.title
  const amount = useSlot<number>('amount', 0)
  const date = useSlot<string>('date')
  const category = useSlot<string>('category')
  const currencySymbol = useSlot<string>('currency_symbol', '$')
  const isIncome = useSlot<boolean>('is_income', false)
  
  // Get icon and color based on category
  const Icon = getCategoryIcon(category)
  const accentColor = getCategoryColor(category)
  
  // Format display values
  const formattedAmount = formatCurrency(amount, currencySymbol)
  const formattedDate = formatDate(date)
  
  // Build subtext: "Dec 1 • Food" or just "Dec 1" or just "Food"
  const subtextParts: string[] = []
  if (formattedDate) subtextParts.push(formattedDate)
  if (category) subtextParts.push(category)
  const subtext = subtextParts.join(' • ')
  
  return (
    <div
      className={cn(
        "flex items-center gap-3 px-3 py-3 rounded-lg",
        "bg-dark-100/50 hover:bg-dark-100/80 transition-colors",
        "border border-dark-200/50"
      )}
      style={{ marginLeft: depth > 0 ? Math.min(depth * 8, 24) : 0 }}
      data-variant="row_transaction_history"
      data-node-id={node.id}
    >
      {/* Category Icon */}
      <div 
        className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
        style={{ 
          backgroundColor: `${accentColor}20`,
        }}
      >
        <Icon 
          size={18} 
          style={{ color: accentColor }}
        />
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Headline */}
        <div className="font-medium text-sm text-white truncate">
          {headline}
        </div>
        
        {/* Subtext */}
        {subtext && (
          <div className="text-xs text-dark-400 mt-0.5 truncate">
            {subtext}
          </div>
        )}
      </div>
      
      {/* Amount */}
      <div 
        className={cn(
          "flex-shrink-0 text-sm font-semibold tabular-nums",
          isIncome ? "text-green-400" : "text-white"
        )}
      >
        {isIncome ? '+' : '-'}{formattedAmount}
      </div>
    </div>
  )
}

export default RowTransactionHistory
