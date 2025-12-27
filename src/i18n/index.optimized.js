import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';
import { Preferences } from '@capacitor/preferences';

// Supported languages
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
];

// Custom Capacitor language detector
const capacitorLanguageDetector = {
  type: 'languageDetector',
  async: true,
  detect: async (callback) => {
    try {
      // First, try to get saved language preference from Capacitor Preferences
      const { value: savedLanguage } = await Preferences.get({ key: 'app-language' });

      if (savedLanguage) {
        console.log('[i18n] Using saved language preference:', savedLanguage);
        callback(savedLanguage);
        return;
      }

      // Fall back to browser/device language detection
      const deviceLanguage = navigator.language || navigator.userLanguage || 'en';

      // Extract base language code (e.g., 'en' from 'en-US')
      const baseLanguage = deviceLanguage.split('-')[0].toLowerCase();

      // Check if the detected language is supported
      const supportedLanguageCodes = SUPPORTED_LANGUAGES.map(lang => lang.code);
      const languageToUse = supportedLanguageCodes.includes(baseLanguage) ? baseLanguage : 'en';

      console.log('[i18n] Detected device language:', deviceLanguage);
      console.log('[i18n] Using language:', languageToUse);

      callback(languageToUse);
    } catch (error) {
      console.error('[i18n] Error detecting language:', error);
      callback('en'); // Fallback to English on error
    }
  },
  init: () => {
    console.log('[i18n] Capacitor language detector initialized');
  },
  cacheUserLanguage: async (language) => {
    try {
      await Preferences.set({
        key: 'app-language',
        value: language,
      });
      console.log('[i18n] Language preference saved:', language);
    } catch (error) {
      console.error('[i18n] Error saving language preference:', error);
    }
  },
};

// Initialize i18next with lazy loading
i18n
  .use(HttpBackend) // Use HTTP backend for lazy loading
  .use(capacitorLanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common', 'dashboard', 'workout', 'exercises', 'training', 'stats', 'settings', 'auth', 'calendar'],

    // Backend configuration for lazy loading
    backend: {
      // Path to load translation files from public directory
      loadPath: '/locales/{{lng}}/{{ns}}/translations.json',

      // Request timeout
      requestOptions: {
        mode: 'cors',
        credentials: 'same-origin',
        cache: 'default',
      },
    },

    // Lazy loading configuration
    load: 'languageOnly', // Only load 'en', not 'en-US'
    preload: ['en'], // Preload only English for faster initial load

    // Partition loading - load namespaces on demand
    partialBundledLanguages: true,

    interpolation: {
      escapeValue: false, // React already escapes values
    },

    detection: {
      order: ['capacitor', 'navigator'],
      caches: [],
    },

    react: {
      useSuspense: true, // Enable suspense for better lazy loading UX
      bindI18n: 'languageChanged loaded',
      bindI18nStore: 'added removed',
    },

    debug: process.env.NODE_ENV === 'development',
  });

// Export helper function to change language
export const changeLanguage = async (languageCode) => {
  try {
    await i18n.changeLanguage(languageCode);
    await Preferences.set({
      key: 'app-language',
      value: languageCode,
    });
    console.log('[i18n] Language changed to:', languageCode);
  } catch (error) {
    console.error('[i18n] Error changing language:', error);
  }
};

// Export helper to get current language
export const getCurrentLanguage = () => i18n.language;

// Export helper to get language display name
export const getLanguageName = (code) => {
  const lang = SUPPORTED_LANGUAGES.find(l => l.code === code);
  return lang ? lang.nativeName : code;
};

export default i18n;
