/**
 * RowInputStepper Variant Component
 * 
 * A row with an interactive stepper for numeric values (stock, quantity, etc.).
 * Features min/max thresholds and visual alerts.
 * Uses optimistic UI for responsive feel.
 * 
 * @module engine/components/variants/rows/row_input_stepper
 */

import { useState, useEffect, useCallback } from 'react'
import { Minus, Plus, AlertCircle } from 'lucide-react'
import type { VariantComponentProps } from '../../../registry'
import { useNode } from '../../../context/NodeContext'
import { useEngineActions } from '../../../context/EngineActionsContext'
import { useSlot } from '../../../hooks/useSlot'
import { cn } from '@/lib/utils'

export function RowInputStepper({ node }: VariantComponentProps) {
    const { depth } = useNode()
    const actions = useEngineActions()

    // Slots
    const headline = useSlot<string>('headline') ?? node.title
    const subtext = useSlot<string>('subtext')
    const value = useSlot<number>('value', 0)
    const minThreshold = useSlot<number>('min_threshold', 0)
    const maxThreshold = useSlot<number>('max_threshold', 999)
    const step = useSlot<number>('step', 1)
    const unit = useSlot<string>('unit', '')

    // ==========================================================================
    // OPTIMISTIC UI: Local state for immediate feedback
    // ==========================================================================
    const [localValue, setLocalValue] = useState(value)
    
    // Sync local value when prop changes (e.g., from DB update)
    useEffect(() => {
        setLocalValue(value)
    }, [value])

    // Logic based on LOCAL value for instant feedback
    const isLowStock = localValue <= minThreshold
    const isOverStock = localValue >= maxThreshold

    const handleUpdate = useCallback((newValue: number) => {
        if (!actions) return

        // Prevent going below 0
        if (newValue < 0) return

        // Optimistic update: Set local value immediately
        setLocalValue(newValue)

        // Then persist to DB
        actions.onTriggerBehavior(node, {
            action: 'update_field',
            target: 'value',
            payload: newValue
        })
    }, [actions, node])

    return (
        <div
            className={cn(
                "flex items-center justify-between gap-3 px-3 py-3 rounded-lg",
                "bg-dark-100/50 border border-dark-200",
                isLowStock && "border-red-500/30 bg-red-500/5"
            )}
            style={{ marginLeft: depth > 0 ? depth * 8 : 0 }}
            data-variant="row_input_stepper"
            data-node-id={node.id}
        >
            {/* Left: Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <div className="text-sm font-medium truncate">{headline}</div>
                    {isLowStock && (
                        <AlertCircle size={14} className="text-red-400 animate-pulse" />
                    )}
                </div>
                {subtext && (
                    <div className="text-xs text-dark-400 mt-0.5 truncate">
                        {subtext}
                    </div>
                )}
            </div>

            {/* Right: Stepper Control */}
            <div className="flex items-center gap-3 bg-dark-200/50 rounded-lg p-1">
                <button
                    onPointerDown={(e) => {
                        // Prevent event from bubbling to parent row handlers
                        e.preventDefault()
                        e.stopPropagation()
                    }}
                    onClick={(e) => {
                        e.stopPropagation()
                        handleUpdate(localValue - step)
                    }}
                    className={cn(
                        "w-8 h-8 flex items-center justify-center rounded-md transition-colors",
                        "hover:bg-dark-300 active:bg-dark-400",
                        "text-dark-400 hover:text-white",
                        localValue <= 0 && "opacity-30 cursor-not-allowed"
                    )}
                    disabled={localValue <= 0}
                    aria-label="Decrease quantity"
                >
                    <Minus size={16} />
                </button>

                <div className={cn(
                    "min-w-[2rem] text-center font-mono text-sm font-medium",
                    isLowStock ? "text-red-400" : "text-white"
                )}>
                    {localValue}
                    {unit && <span className="text-xs text-dark-500 ml-1">{unit}</span>}
                </div>

                <button
                    onPointerDown={(e) => {
                        // Prevent event from bubbling to parent row handlers
                        e.preventDefault()
                        e.stopPropagation()
                    }}
                    onClick={(e) => {
                        e.stopPropagation()
                        handleUpdate(localValue + step)
                    }}
                    className={cn(
                        "w-8 h-8 flex items-center justify-center rounded-md transition-colors",
                        "hover:bg-dark-300 active:bg-dark-400",
                        "text-dark-400 hover:text-white"
                    )}
                    aria-label="Increase quantity"
                >
                    <Plus size={16} />
                </button>
            </div>
        </div>
    )
}
