/**
 * GridCard Variant Component
 * 
 * Renders a node as a card in a grid layout.
 * Typically used for collections and items that need visual prominence.
 * 
 * @module engine/components/variants/GridCard
 */

import { Clock, ChefHat, Dumbbell, FileText, Calendar } from 'lucide-react'
import type { VariantComponentProps } from '../../registry'
import { useNode, useNodeMeta, useChildCount } from '../../context/NodeContext'
import { cn } from '@/lib/utils'

// Icon mapping for different semantic types
const typeIcons: Record<string, typeof Clock> = {
  recipe: ChefHat,
  workout: Dumbbell,
  document: FileText,
  event: Calendar,
}

/**
 * GridCard - Renders a node as a card.
 * 
 * Features:
 * - Optional image/thumbnail area
 * - Title and description
 * - Type-specific icon
 * - Metadata badges (cook time, servings, etc.)
 * - Glassmorphism cyberpunk styling
 */
export function GridCard({ node }: VariantComponentProps) {
  const { depth } = useNode()
  const childCount = useChildCount()
  
  // Extract metadata
  const color = useNodeMeta<string>('color', '#06b6d4') // Default cyan
  const imageUrl = useNodeMeta<string>('imageUrl')
  const description = useNodeMeta<string>('description')
  const prepTime = useNodeMeta<number>('prepTime')
  const cookTime = useNodeMeta<number>('cookTime')
  const servings = useNodeMeta<number>('servings')
  const duration = useNodeMeta<number>('duration')
  const semanticType = useNodeMeta<string>('semanticType') // For Phase 2: recipe, workout, etc.
  
  // Get icon based on semantic type
  const TypeIcon = semanticType ? typeIcons[semanticType] : null
  
  return (
    <div
      className={cn(
        "rounded-xl overflow-hidden",
        "bg-dark-100/80 backdrop-blur-sm",
        "border border-dark-200 hover:border-cyan-500/50",
        "transition-all duration-200",
        "hover:shadow-lg hover:shadow-cyan-500/10"
      )}
      style={{ 
        marginLeft: depth > 0 ? depth * 8 : 0,
        borderColor: color ? `${color}33` : undefined,
      }}
      data-variant="grid_card"
      data-node-id={node.id}
    >
      {/* Image/Thumbnail Area */}
      {imageUrl ? (
        <div className="aspect-video bg-dark-200 overflow-hidden">
          <img 
            src={imageUrl} 
            alt={node.title}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div 
          className="h-2"
          style={{ backgroundColor: color || '#06b6d4' }}
        />
      )}
      
      {/* Content */}
      <div className="p-3 space-y-2">
        {/* Title Row */}
        <div className="flex items-start gap-2">
          {TypeIcon && (
            <TypeIcon 
              size={18} 
              className="flex-shrink-0 mt-0.5"
              style={{ color: color || '#06b6d4' }}
            />
          )}
          <h3 className="font-medium text-sm leading-tight line-clamp-2">
            {node.title}
          </h3>
        </div>
        
        {/* Description */}
        {description && (
          <p className="text-xs text-dark-400 line-clamp-2">
            {description}
          </p>
        )}
        
        {/* Metadata Badges */}
        <div className="flex flex-wrap gap-2">
          {/* Cook Time (for recipes) */}
          {(prepTime || cookTime) && (
            <span className="flex items-center gap-1 text-xs text-dark-400">
              <Clock size={12} />
              {prepTime && cookTime 
                ? `${prepTime + cookTime}m`
                : `${prepTime || cookTime}m`
              }
            </span>
          )}
          
          {/* Servings */}
          {servings && (
            <span className="text-xs text-dark-400">
              {servings} servings
            </span>
          )}
          
          {/* Duration (for workouts) */}
          {duration && (
            <span className="flex items-center gap-1 text-xs text-dark-400">
              <Clock size={12} />
              {duration}m
            </span>
          )}
          
          {/* Child count */}
          {childCount > 0 && (
            <span className="text-xs text-dark-500">
              {childCount} items
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
