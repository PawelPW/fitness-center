import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Preferences } from '@capacitor/preferences';
import { SUPPORTED_LANGUAGES, filterLanguages } from '../i18n/languages';
import './LanguageSelector.css';

/**
 * LanguageSelector Component
 *
 * Interactive modal for selecting application language with:
 * - Real-time search filtering
 * - Flag emojis and native language names
 * - Checkmark indicator for current language
 * - Smooth animations and transitions
 * - Capacitor Preferences integration for persistence
 * - Confirmation message on language change
 *
 * @param {boolean} isOpen - Controls modal visibility
 * @param {function} onClose - Callback when modal is closed
 */
export default function LanguageSelector({ isOpen, onClose }) {
  const { i18n, t } = useTranslation('settings');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredLanguages, setFilteredLanguages] = useState(SUPPORTED_LANGUAGES);
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const searchInputRef = useRef(null);
  const modalRef = useRef(null);

  // Filter languages when search query changes
  useEffect(() => {
    const results = filterLanguages(searchQuery);
    setFilteredLanguages(results);
  }, [searchQuery]);

  // Update selected language when i18n language changes
  useEffect(() => {
    setSelectedLanguage(i18n.language);
  }, [i18n.language]);

  // Focus search input when modal opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Handle language selection
  const handleLanguageSelect = async (languageCode) => {
    if (languageCode === selectedLanguage) {
      // Same language selected, just close modal
      handleClose();
      return;
    }

    try {
      // Change i18n language
      await i18n.changeLanguage(languageCode);

      // Persist to Capacitor Preferences
      await Preferences.set({
        key: 'app-language',
        value: languageCode
      });

      // Update local state
      setSelectedLanguage(languageCode);

      // Show confirmation message
      setShowConfirmation(true);
      setTimeout(() => {
        setShowConfirmation(false);
        handleClose();
      }, 2000);

    } catch (error) {
      console.error('Failed to change language:', error);
    }
  };

  // Handle modal close
  const handleClose = () => {
    setSearchQuery('');
    setShowConfirmation(false);
    onClose();
  };

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Handle search clear
  const handleClearSearch = () => {
    setSearchQuery('');
    searchInputRef.current?.focus();
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      handleClose();
    }
  };

  // Don't render if not open
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="language-selector-backdrop"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="language-selector-title"
    >
      <div className="language-selector-modal" ref={modalRef}>
        {/* Header */}
        <div className="language-selector-header">
          <h2 id="language-selector-title" className="language-selector-title">
            {t('language.selectLanguage', 'Select Language')}
          </h2>
          <button
            className="language-selector-close"
            onClick={handleClose}
            aria-label="Close language selector"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Search Input */}
        <div className="language-selector-search">
          <div className="search-input-wrapper">
            <svg
              className="search-icon"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              ref={searchInputRef}
              type="text"
              className="search-input"
              placeholder={t('language.searchPlaceholder', 'Search languages...')}
              value={searchQuery}
              onChange={handleSearchChange}
              aria-label="Search languages"
            />
            {searchQuery && (
              <button
                className="search-clear"
                onClick={handleClearSearch}
                aria-label="Clear search"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Language List */}
        <div className="language-selector-list">
          {filteredLanguages.length > 0 ? (
            filteredLanguages.map((language) => {
              const isSelected = language.code === selectedLanguage;
              return (
                <button
                  key={language.code}
                  className={`language-option ${isSelected ? 'language-option-selected' : ''}`}
                  onClick={() => handleLanguageSelect(language.code)}
                  aria-label={`Select ${language.nativeName}`}
                  aria-current={isSelected ? 'true' : 'false'}
                >
                  <div className="language-option-content">
                    <span className="language-flag" aria-hidden="true">
                      {language.flag}
                    </span>
                    <div className="language-names">
                      <span className="language-native-name">
                        {language.nativeName}
                      </span>
                      {language.nativeName !== language.englishName && (
                        <span className="language-english-name">
                          {language.englishName}
                        </span>
                      )}
                    </div>
                  </div>
                  {isSelected && (
                    <div className="language-checkmark" aria-hidden="true">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  )}
                </button>
              );
            })
          ) : (
            <div className="language-no-results">
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
                <line x1="11" y1="8" x2="11" y2="14" />
                <line x1="11" y1="16" x2="11.01" y2="16" />
              </svg>
              <p className="no-results-text">
                {t('language.noResults', 'No languages found')}
              </p>
              <p className="no-results-suggestion">
                {t('language.tryDifferentSearch', 'Try a different search term')}
              </p>
            </div>
          )}
        </div>

        {/* Confirmation Message */}
        {showConfirmation && (
          <div className="language-confirmation">
            <svg
              className="confirmation-icon"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span className="confirmation-text">
              {t('language.changeSuccess', 'Language changed successfully')}
            </span>
          </div>
        )}

        {/* Footer Info */}
        <div className="language-selector-footer">
          <p className="footer-info">
            {t('language.footerInfo', 'Language settings are synced across all your devices')}
          </p>
        </div>
      </div>
    </div>
  );
}
