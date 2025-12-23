import { useSwipeable } from 'react-swipeable';

/**
 * Custom hook for swipe navigation
 * Swipe right = go back
 * @param {Function} onSwipeRight - Callback for right swipe (go back)
 * @param {Object} options - Additional swipeable options
 */
export function useSwipeNavigation(onSwipeRight, options = {}) {
  const handlers = useSwipeable({
    onSwipedRight: (eventData) => {
      // Enhanced edge detection: 100px from left edge (increased from 50px)
      // Velocity check: minimum 0.3 to prevent accidental triggers
      const velocity = Math.abs(eventData.velocity);
      if (eventData.initial[0] < 100 && velocity > 0.3) {
        onSwipeRight?.();
      }
    },
    trackMouse: false, // Disable mouse tracking (mobile only)
    trackTouch: true,
    delta: 50, // Minimum swipe distance
    preventScrollOnSwipe: false,
    touchEventOptions: { passive: false }, // Allow preventDefault when needed
    ...options,
  });

  return handlers;
}
