import { useCallback, useEffect } from 'react'
import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useBackButton } from '@/hooks/useBackButton'
import { cn } from '@/lib/utils'

export interface FormSheetProps {
  /** Title displayed in the header */
  title: string
  /** Called when the sheet is closed (X button, backdrop click, or back button) */
  onClose: () => void
  /** Content to render inside the sheet */
  children: React.ReactNode
  /** Optional max height for scrollable forms (default: "85vh") */
  maxHeight?: string
  /** Whether the sheet is visible (controls animation) */
  isOpen?: boolean
  /** Optional class name for the content container */
  contentClassName?: string
}

/**
 * FormSheet - Reusable bottom sheet component for all add/edit forms
 * 
 * Features:
 * - Framer-motion slide-up animation with fade backdrop
 * - Built-in back button handling
 * - Consistent header with close button
 * - Backdrop click to close
 * - Responsive with max-width constraint
 * 
 * @example
 * <FormSheet
 *   title={isEditing ? 'Edit Category' : 'Create Category'}
 *   onClose={handleClose}
 * >
 *   <form onSubmit={handleSubmit}>
 *     {children here}
 *   </form>
 * </FormSheet>
 */
export function FormSheet({
  title,
  onClose,
  children,
  maxHeight = '85vh',
  isOpen = true,
  contentClassName,
}: FormSheetProps) {
  // Handle Android back button to close the sheet
  const handleClose = useCallback(() => {
    onClose()
  }, [onClose])

  useBackButton({
    onCloseModal: () => {
      handleClose()
      return true
    }
  })

  // Prevent body scroll when sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleClose])

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          {/* Backdrop with fade animation */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Sheet with slide-up animation */}
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{
              type: 'spring',
              damping: 30,
              stiffness: 400,
            }}
            className="relative w-full max-w-lg bg-dark-100 rounded-t-2xl shadow-xl overflow-hidden"
            style={{ maxHeight }}
          >
            {/* Drag Handle (visual indicator) */}
            <div className="flex justify-center pt-2 pb-0">
              <div className="w-10 h-1 bg-dark-400 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-dark-300">
              <h2 className="text-lg font-semibold text-white">{title}</h2>
              <button
                type="button"
                onClick={handleClose}
                className="p-2 rounded-full hover:bg-dark-200 transition-colors"
                aria-label="Close"
              >
                <X size={20} className="text-dark-500" />
              </button>
            </div>

            {/* Content - scrollable if needed */}
            <div 
              className={cn(
                "overflow-y-auto",
                contentClassName
              )}
              style={{ maxHeight: `calc(${maxHeight} - 80px)` }}
            >
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

