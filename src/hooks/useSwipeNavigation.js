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
      // Only trigger if swipe starts from left edge (first 50px)
      if (eventData.initial[0] < 50) {
        onSwipeRight?.();
      }
    },
    trackMouse: false, // Disable mouse tracking (mobile only)
    trackTouch: true,
    delta: 50, // Minimum swipe distance
    preventScrollOnSwipe: false,
    ...options,
  });

  return handlers;
}
