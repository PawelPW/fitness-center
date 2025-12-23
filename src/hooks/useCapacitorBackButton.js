import { useEffect } from 'react';
import { App } from '@capacitor/app';

/**
 * Custom hook to handle Capacitor's back button event
 * This intercepts the native Android back button before it closes the app
 *
 * @param {Function} onBackButton - Callback function to execute when back button is pressed
 */
export function useCapacitorBackButton(onBackButton) {
  useEffect(() => {
    // Add listener for hardware back button (Android)
    const backButtonListener = App.addListener('backButton', (event) => {
      // Execute the provided callback
      onBackButton?.();
    });

    // Cleanup: Remove listener when component unmounts
    return () => {
      backButtonListener.remove();
    };
  }, [onBackButton]);
}
