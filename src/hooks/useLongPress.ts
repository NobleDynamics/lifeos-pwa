import { useRef, useEffect } from 'react'

interface UseLongPressOptions {
  threshold?: number
  onStart?: () => void
  onFinish?: () => void
  onCancel?: () => void
}

export function useLongPress(
  callback: (event: any, data?: any) => void,
  options: UseLongPressOptions = {}
) {
  const { threshold = 400, onStart, onFinish, onCancel } = options
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const isLongPressTriggered = useRef(false)

  const start = (event: any, data?: any) => {
    onStart?.()
    isLongPressTriggered.current = false
    
    timerRef.current = setTimeout(() => {
      isLongPressTriggered.current = true
      callback(event, data)
    }, threshold)
  }

  const clear = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  const cancel = () => {
    clear()
    if (!isLongPressTriggered.current) {
      onCancel?.()
    } else {
      onFinish?.()
    }
  }

  useEffect(() => {
    return () => {
      clear()
    }
  }, [])

  return {
    onMouseDown: (event: React.MouseEvent, data?: any) => start(event, data),
    onTouchStart: (event: React.TouchEvent, data?: any) => start(event, data),
    onMouseUp: cancel,
    onMouseLeave: cancel,
    onTouchEnd: cancel,
  }
