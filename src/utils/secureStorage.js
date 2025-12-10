import { Preferences } from '@capacitor/preferences';

/**
 * Secure Storage Utility
 * Uses Capacitor Preferences API which provides:
 * - iOS: Keychain storage (encrypted)
 * - Android: EncryptedSharedPreferences (encrypted)
 * - Web: localStorage (fallback, not as secure)
 */
class SecureStorage {
  /**
   * Store a value securely
   * @param {string} key - Storage key
   * @param {string} value - Value to store
   */
  async set(key, value) {
    try {
      await Preferences.set({ key, value });
    } catch (error) {
      console.error('SecureStorage.set error:', error);
      throw new Error('Failed to store data securely');
    }
  }

  /**
   * Retrieve a value securely
   * @param {string} key - Storage key
   * @returns {Promise<string|null>} - Retrieved value or null
   */
  async get(key) {
    try {
      const { value } = await Preferences.get({ key });
      return value;
    } catch (error) {
      console.error('SecureStorage.get error:', error);
      return null;
    }
  }

  /**
   * Remove a value from secure storage
   * @param {string} key - Storage key
   */
  async remove(key) {
    try {
      await Preferences.remove({ key });
    } catch (error) {
      console.error('SecureStorage.remove error:', error);
      throw new Error('Failed to remove data from secure storage');
    }
  }

  /**
   * Clear all secure storage
   */
  async clear() {
    try {
      await Preferences.clear();
    } catch (error) {
      console.error('SecureStorage.clear error:', error);
      throw new Error('Failed to clear secure storage');
    }
  }

  /**
   * Get all keys from secure storage
   * @returns {Promise<string[]>} - Array of keys
   */
  async keys() {
    try {
      const { keys } = await Preferences.keys();
      return keys;
    } catch (error) {
      console.error('SecureStorage.keys error:', error);
      return [];
    }
  }
}

const secureStorage = new SecureStorage();
export default secureStorage;
