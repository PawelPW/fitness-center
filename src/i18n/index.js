import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { Preferences } from '@capacitor/preferences';

// Import all translation files
// English
import enAuth from './locales/en/auth/translations.json';
import enCalendar from './locales/en/calendar/translations.json';
import enCommon from './locales/en/common/translations.json';
import enDashboard from './locales/en/dashboard/translations.json';
import enWorkout from './locales/en/workout/translations.json';
import enExercises from './locales/en/exercises/translations.json';
import enTraining from './locales/en/training/translations.json';
import enStats from './locales/en/stats/translations.json';
import enSettings from './locales/en/settings/translations.json';

// Spanish
import esCommon from './locales/es/common/translations.json';
import esDashboard from './locales/es/dashboard/translations.json';
import esWorkout from './locales/es/workout/translations.json';
import esExercises from './locales/es/exercises/translations.json';
import esTraining from './locales/es/training/translations.json';
import esStats from './locales/es/stats/translations.json';
import esSettings from './locales/es/settings/translations.json';

// French
import frCommon from './locales/fr/common/translations.json';
import frDashboard from './locales/fr/dashboard/translations.json';
import frWorkout from './locales/fr/workout/translations.json';
import frExercises from './locales/fr/exercises/translations.json';
import frTraining from './locales/fr/training/translations.json';
import frStats from './locales/fr/stats/translations.json';
import frSettings from './locales/fr/settings/translations.json';

// German
import deCommon from './locales/de/common/translations.json';
import deDashboard from './locales/de/dashboard/translations.json';
import deWorkout from './locales/de/workout/translations.json';
import deExercises from './locales/de/exercises/translations.json';
import deTraining from './locales/de/training/translations.json';
import deStats from './locales/de/stats/translations.json';
import deSettings from './locales/de/settings/translations.json';

// Italian
import itCommon from './locales/it/common/translations.json';
import itDashboard from './locales/it/dashboard/translations.json';
import itWorkout from './locales/it/workout/translations.json';
import itExercises from './locales/it/exercises/translations.json';
import itTraining from './locales/it/training/translations.json';
import itStats from './locales/it/stats/translations.json';
import itSettings from './locales/it/settings/translations.json';

// Polish
import plAuth from './locales/pl/auth/translations.json';
import plCalendar from './locales/pl/calendar/translations.json';
import plCommon from './locales/pl/common/translations.json';
import plDashboard from './locales/pl/dashboard/translations.json';
import plWorkout from './locales/pl/workout/translations.json';
import plExercises from './locales/pl/exercises/translations.json';
import plTraining from './locales/pl/training/translations.json';
import plStats from './locales/pl/stats/translations.json';
import plSettings from './locales/pl/settings/translations.json';

// Portuguese
import ptCommon from './locales/pt/common/translations.json';
import ptDashboard from './locales/pt/dashboard/translations.json';
import ptWorkout from './locales/pt/workout/translations.json';
import ptExercises from './locales/pt/exercises/translations.json';
import ptTraining from './locales/pt/training/translations.json';
import ptStats from './locales/pt/stats/translations.json';
import ptSettings from './locales/pt/settings/translations.json';

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

// Translation resources
const resources = {
  en: {
    auth: enAuth,
    calendar: enCalendar,
    common: enCommon,
    dashboard: enDashboard,
    workout: enWorkout,
    exercises: enExercises,
    training: enTraining,
    stats: enStats,
    settings: enSettings,
  },
  es: {
    common: esCommon,
    dashboard: esDashboard,
    workout: esWorkout,
    exercises: esExercises,
    training: esTraining,
    stats: esStats,
    settings: esSettings,
  },
  fr: {
    common: frCommon,
    dashboard: frDashboard,
    workout: frWorkout,
    exercises: frExercises,
    training: frTraining,
    stats: frStats,
    settings: frSettings,
  },
  de: {
    common: deCommon,
    dashboard: deDashboard,
    workout: deWorkout,
    exercises: deExercises,
    training: deTraining,
    stats: deStats,
    settings: deSettings,
  },
  it: {
    common: itCommon,
    dashboard: itDashboard,
    workout: itWorkout,
    exercises: itExercises,
    training: itTraining,
    stats: itStats,
    settings: itSettings,
  },
  pl: {
    auth: plAuth,
    calendar: plCalendar,
    common: plCommon,
    dashboard: plDashboard,
    workout: plWorkout,
    exercises: plExercises,
    training: plTraining,
    stats: plStats,
    settings: plSettings,
  },
  pt: {
    common: ptCommon,
    dashboard: ptDashboard,
    workout: ptWorkout,
    exercises: ptExercises,
    training: ptTraining,
    stats: ptStats,
    settings: ptSettings,
  },
};

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

// Initialize i18next
i18n
  .use(capacitorLanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['auth', 'calendar', 'common', 'dashboard', 'workout', 'exercises', 'training', 'stats', 'settings'],

    interpolation: {
      escapeValue: false, // React already escapes values
    },

    detection: {
      order: ['capacitor', 'navigator'],
      caches: [],
    },

    react: {
      useSuspense: false, // Disable suspense to avoid loading delays
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
