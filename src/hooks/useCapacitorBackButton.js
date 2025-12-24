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
    let listenerHandle;

    // Add listener for hardware back button (Android)
    const setupListener = async () => {
      listenerHandle = await App.addListener('backButton', (event) => {
        // Execute the provided callback
        onBackButton?.();
      });
    };

    setupListener();

    // Cleanup: Remove listener when component unmounts
    return () => {
      if (listenerHandle) {
        listenerHandle.remove();
      }
    };
  }, [onBackButton]);
}
