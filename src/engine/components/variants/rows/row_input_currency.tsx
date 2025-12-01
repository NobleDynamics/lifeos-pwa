/**
 * RowInputCurrency Variant Component
 * 
 * A row with a checkbox and a currency input.
 * Uses local state for the input to prevent DB spam, updating only on blur/enter.
 * 
 * @module engine/components/variants/rows/row_input_currency
 */

import { useState, useEffect } from 'react'
import { Circle, CheckCircle2 } from 'lucide-react'
import type { VariantComponentProps } from '../../../registry'
import { useNode } from '../../../context/NodeContext'
import { useEngineActions, type BehaviorConfig } from '../../../context/EngineActionsContext'
import { useSlot } from '../../../hooks/useSlot'
import { cn } from '@/lib/utils'

export function RowInputCurrency({ node }: VariantComponentProps) {
    const { depth } = useNode()
    const actions = useEngineActions()

    // Slots
    const headline = useSlot<string>('headline') ?? node.title
    const subtext = useSlot<string>('subtext')
    const value = useSlot<number>('value', 0)
    const status = useSlot<string>('status', 'active')
    const currencySymbol = useSlot<string>('currency_symbol', '$')

    // Local state for input to prevent DB spam
    const [localValue, setLocalValue] = useState<string>(value.toString())
    const [isFocused, setIsFocused] = useState(false)

    // Sync local state when prop changes (only if not focused)
    useEffect(() => {
        if (!isFocused) {
            setLocalValue(value.toString())
        }
    }, [value, isFocused])

    const isCompleted = status === 'completed' || status === 'done'

    // Handle input commit (Blur or Enter)
    const handleCommit = () => {
        if (!actions) return

        const numValue = parseFloat(localValue)
        if (isNaN(numValue)) {
            // Revert to original value if invalid
            setLocalValue(value.toString())
            return
        }

        // Only update if changed
        if (numValue !== value) {
            actions.onTriggerBehavior(node, {
                action: 'update_field',
                target: 'value', // Assumes 'value' is the metadata key
                payload: numValue
            })
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            (e.currentTarget as HTMLInputElement).blur() // Triggers onBlur which calls handleCommit
        }
    }

    // Handle Checkbox Click
    const handleCheckboxClick = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (!actions) return

        // Check for custom behavior in metadata
        const behavior = node.metadata.behavior as BehaviorConfig | undefined

        if (behavior) {
            actions.onTriggerBehavior(node, behavior)
        } else {
            // Fallback to default status cycling
            actions.onTriggerBehavior(node, {
                action: 'toggle_status'
            })
        }
    }

    return (
        <div
            className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-lg",
                "bg-dark-100/50 border border-dark-200",
                isCompleted && "opacity-60"
            )}
            style={{ marginLeft: depth > 0 ? depth * 8 : 0 }}
            data-variant="row_input_currency"
            data-node-id={node.id}
        >
            {/* Left: Checkbox */}
            <div
                className="flex-shrink-0 pt-0.5 cursor-pointer hover:scale-110 transition-transform"
                onClick={handleCheckboxClick}
                role="button"
            >
                {isCompleted ? (
                    <CheckCircle2 size={20} className="text-green-500" />
                ) : (
                    <Circle size={20} className="text-dark-400" />
                )}
            </div>

            {/* Middle: Info */}
            <div className="flex-1 min-w-0">
                <div className={cn(
                    "text-sm font-medium truncate",
                    isCompleted && "line-through text-dark-500"
                )}>
                    {headline}
                </div>
                {subtext && (
                    <div className="text-xs text-dark-400 mt-0.5 truncate">
                        {subtext}
                    </div>
                )}
            </div>

            {/* Right: Currency Input */}
            <div className="flex items-center gap-1 bg-dark-200/50 rounded-md px-2 py-1 border border-transparent focus-within:border-primary/50 transition-colors">
                <span className="text-dark-400 text-sm font-medium">{currencySymbol}</span>
                <input
                    type="number"
                    value={localValue}
                    onChange={(e) => setLocalValue(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => {
                        setIsFocused(false)
                        handleCommit()
                    }}
                    onKeyDown={handleKeyDown}
                    className="w-20 bg-transparent text-right text-sm font-mono outline-none text-dark-100 placeholder-dark-500"
                    placeholder="0.00"
                    step="0.01"
                />
            </div>
        </div>
    )
}
