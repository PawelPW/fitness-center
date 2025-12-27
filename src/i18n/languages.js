/**
 * Language Metadata
 *
 * Contains comprehensive information about all supported languages including:
 * - ISO 639-1 language codes
 * - Native language names (how speakers refer to their language)
 * - English names (for reference)
 * - Flag emojis (country/region representation)
 * - Text direction (LTR/RTL)
 *
 * Used by LanguageSelector component for display and filtering
 */

export const SUPPORTED_LANGUAGES = [
  {
    code: 'en',
    nativeName: 'English',
    englishName: 'English',
    flag: '🇬🇧',
    direction: 'ltr',
    region: 'United Kingdom'
  },
  {
    code: 'es',
    nativeName: 'Español',
    englishName: 'Spanish',
    flag: '🇪🇸',
    direction: 'ltr',
    region: 'Spain'
  },
  {
    code: 'fr',
    nativeName: 'Français',
    englishName: 'French',
    flag: '🇫🇷',
    direction: 'ltr',
    region: 'France'
  },
  {
    code: 'de',
    nativeName: 'Deutsch',
    englishName: 'German',
    flag: '🇩🇪',
    direction: 'ltr',
    region: 'Germany'
  },
  {
    code: 'it',
    nativeName: 'Italiano',
    englishName: 'Italian',
    flag: '🇮🇹',
    direction: 'ltr',
    region: 'Italy'
  },
  {
    code: 'pl',
    nativeName: 'Polski',
    englishName: 'Polish',
    flag: '🇵🇱',
    direction: 'ltr',
    region: 'Poland'
  },
  {
    code: 'pt',
    nativeName: 'Português',
    englishName: 'Portuguese',
    flag: '🇵🇹',
    direction: 'ltr',
    region: 'Portugal'
  }
];

/**
 * Get language metadata by code
 * @param {string} code - ISO 639-1 language code
 * @returns {object|null} Language metadata or null if not found
 */
export const getLanguageByCode = (code) => {
  return SUPPORTED_LANGUAGES.find(lang => lang.code === code) || null;
};

/**
 * Get language native name by code
 * @param {string} code - ISO 639-1 language code
 * @returns {string} Native name or code if not found
 */
export const getLanguageNativeName = (code) => {
  const language = getLanguageByCode(code);
  return language ? language.nativeName : code;
};

/**
 * Get language flag emoji by code
 * @param {string} code - ISO 639-1 language code
 * @returns {string} Flag emoji or empty string if not found
 */
export const getLanguageFlag = (code) => {
  const language = getLanguageByCode(code);
  return language ? language.flag : '';
};

/**
 * Filter languages by search query
 * Searches in native name, English name, and region
 * @param {string} query - Search query string
 * @returns {array} Filtered array of languages
 */
export const filterLanguages = (query) => {
  if (!query || query.trim() === '') {
    return SUPPORTED_LANGUAGES;
  }

  const searchTerm = query.toLowerCase().trim();

  return SUPPORTED_LANGUAGES.filter(lang => {
    return (
      lang.nativeName.toLowerCase().includes(searchTerm) ||
      lang.englishName.toLowerCase().includes(searchTerm) ||
      lang.region.toLowerCase().includes(searchTerm) ||
      lang.code.toLowerCase().includes(searchTerm)
    );
  });
};

/**
 * Get all language codes
 * @returns {array} Array of language codes
 */
export const getLanguageCodes = () => {
  return SUPPORTED_LANGUAGES.map(lang => lang.code);
};

export default SUPPORTED_LANGUAGES;
