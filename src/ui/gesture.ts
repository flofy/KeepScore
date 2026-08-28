export type SwipeDirection = 'left' | 'right'

export interface SwipeCallbacks {
  onSwipe?: (direction: SwipeDirection) => void
}

export function createSwipeHandlers(callbacks: SwipeCallbacks) {
  let startX = 0
  let startY = 0

  return {
    onTouchStart(event: TouchEvent) {
      const touch = event.changedTouches[0]
      startX = touch.clientX
      startY = touch.clientY
    },
    onTouchEnd(event: TouchEvent) {
      const touch = event.changedTouches[0]
      const dx = touch.clientX - startX
      const dy = touch.clientY - startY
      if (Math.abs(dx) < 64 || Math.abs(dx) < Math.abs(dy) * 1.25) return
      callbacks.onSwipe?.(dx > 0 ? 'right' : 'left')
    },
  }
}
