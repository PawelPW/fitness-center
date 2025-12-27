import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSwipeNavigation } from '../hooks/useSwipeNavigation';
import { getCurrentLanguage, getLanguageName } from '../i18n';
import { getLanguageByCode } from '../i18n/languages';
import LanguageSelector from '../components/LanguageSelector';
import '../styles/Settings.css';

function Settings({ onBack }) {
  const { t, i18n } = useTranslation(['settings', 'common']);
  const currentLanguage = getCurrentLanguage();
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);

  // Swipe navigation
  const swipeHandlers = useSwipeNavigation(onBack);

  return (
    <div className="settings-container" {...swipeHandlers}>
      {/* Header */}
      <div className="settings-header">
        <button className="back-button" onClick={onBack} aria-label="Go back">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <h1 className="settings-title">{t('settings:title')}</h1>
        <div className="header-spacer"></div>
      </div>

      {/* Settings Content */}
      <div className="settings-content">

        {/* Language Section */}
        <div className="settings-section">
          <h2 className="section-title">{t('settings:language')}</h2>
          <p className="section-description">{t('settings:language_description')}</p>

          <div className="settings-card">
            <div
              className="settings-row"
              onClick={() => setShowLanguageSelector(true)}
              role="button"
              tabIndex={0}
              onKeyPress={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setShowLanguageSelector(true);
                }
              }}
            >
              <div className="settings-row-icon">
                <span className="language-flag" aria-hidden="true">
                  {getLanguageByCode(currentLanguage)?.flag || '🌐'}
                </span>
              </div>
              <div className="settings-row-content">
                <div className="settings-row-title">
                  {getLanguageByCode(currentLanguage)?.nativeName || 'English'}
                </div>
                <div className="settings-row-subtitle">
                  {t('settings:language_tap_to_change', 'Tap to change language')}
                </div>
              </div>
              <div className="settings-row-chevron">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7 4l6 6-6 6"/>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Workout Preferences Section */}
        <div className="settings-section">
          <h2 className="section-title">{t('settings:units')}</h2>
          <p className="section-description">{t('settings:units_description')}</p>

          <div className="settings-card">
            <div className="settings-row settings-row-disabled">
              <div className="settings-row-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                  <polyline points="7.5 4.21 12 6.81 16.5 4.21"/>
                  <polyline points="7.5 19.79 7.5 14.6 3 12"/>
                  <polyline points="21 12 16.5 14.6 16.5 19.79"/>
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                  <line x1="12" y1="22.08" x2="12" y2="12"/>
                </svg>
              </div>
              <div className="settings-row-content">
                <div className="settings-row-title">{t('settings:metric')}</div>
                <div className="settings-row-subtitle">Kilograms (kg)</div>
              </div>
              <div className="settings-row-badge">
                <span className="badge-coming-soon">Coming Soon</span>
              </div>
            </div>

            <div className="settings-row settings-row-disabled">
              <div className="settings-row-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
              <div className="settings-row-content">
                <div className="settings-row-title">Rest Timer</div>
                <div className="settings-row-subtitle">Default 90 seconds</div>
              </div>
              <div className="settings-row-badge">
                <span className="badge-coming-soon">Coming Soon</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications Section */}
        <div className="settings-section">
          <h2 className="section-title">{t('settings:notifications')}</h2>
          <p className="section-description">{t('settings:notifications_description')}</p>

          <div className="settings-card">
            <div className="settings-row settings-row-disabled">
              <div className="settings-row-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
              </div>
              <div className="settings-row-content">
                <div className="settings-row-title">Workout Reminders</div>
                <div className="settings-row-subtitle">Get notified to stay consistent</div>
              </div>
              <div className="settings-row-badge">
                <span className="badge-coming-soon">Coming Soon</span>
              </div>
            </div>

            <div className="settings-row settings-row-disabled">
              <div className="settings-row-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-8.27 4a2 2 0 0 1-3.46 0"/>
                </svg>
              </div>
              <div className="settings-row-content">
                <div className="settings-row-title">Achievement Alerts</div>
                <div className="settings-row-subtitle">Celebrate your progress</div>
              </div>
              <div className="settings-row-badge">
                <span className="badge-coming-soon">Coming Soon</span>
              </div>
            </div>
          </div>
        </div>

        {/* Account Section */}
        <div className="settings-section">
          <h2 className="section-title">{t('settings:account')}</h2>

          <div className="settings-card">
            <div className="settings-row settings-row-disabled">
              <div className="settings-row-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <div className="settings-row-content">
                <div className="settings-row-title">{t('settings:profile')}</div>
                <div className="settings-row-subtitle">Update your personal information</div>
              </div>
              <div className="settings-row-chevron">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7 4l6 6-6 6"/>
                </svg>
              </div>
            </div>

            <div className="settings-row settings-row-disabled">
              <div className="settings-row-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <div className="settings-row-content">
                <div className="settings-row-title">Change Password</div>
                <div className="settings-row-subtitle">Update your security credentials</div>
              </div>
              <div className="settings-row-chevron">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7 4l6 6-6 6"/>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Privacy & Legal Section */}
        <div className="settings-section">
          <h2 className="section-title">{t('settings:privacy')}</h2>

          <div className="settings-card">
            <div className="settings-row settings-row-disabled">
              <div className="settings-row-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <div className="settings-row-content">
                <div className="settings-row-title">Privacy Policy</div>
                <div className="settings-row-subtitle">How we handle your data</div>
              </div>
              <div className="settings-row-chevron">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7 4l6 6-6 6"/>
                </svg>
              </div>
            </div>

            <div className="settings-row settings-row-disabled">
              <div className="settings-row-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10 9 9 9 8 9"/>
                </svg>
              </div>
              <div className="settings-row-content">
                <div className="settings-row-title">{t('settings:terms')}</div>
                <div className="settings-row-subtitle">Terms and conditions</div>
              </div>
              <div className="settings-row-chevron">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7 4l6 6-6 6"/>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* About Section */}
        <div className="settings-section">
          <h2 className="section-title">{t('settings:about')}</h2>

          <div className="settings-card">
            <div className="settings-row settings-row-static">
              <div className="settings-row-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="16" x2="12" y2="12"/>
                  <line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
              </div>
              <div className="settings-row-content">
                <div className="settings-row-title">{t('settings:version')}</div>
                <div className="settings-row-subtitle">1.0.0 (Build 1)</div>
              </div>
            </div>

            <div className="settings-row settings-row-disabled">
              <div className="settings-row-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
              <div className="settings-row-content">
                <div className="settings-row-title">Contact Support</div>
                <div className="settings-row-subtitle">Get help with any issues</div>
              </div>
              <div className="settings-row-chevron">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7 4l6 6-6 6"/>
                </svg>
              </div>
            </div>

            <div className="settings-row settings-row-disabled">
              <div className="settings-row-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                </svg>
              </div>
              <div className="settings-row-content">
                <div className="settings-row-title">What's New</div>
                <div className="settings-row-subtitle">Recent updates and features</div>
              </div>
              <div className="settings-row-chevron">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7 4l6 6-6 6"/>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Logout Section */}
        <div className="settings-section">
          <div className="settings-card">
            <div className="settings-row settings-row-danger settings-row-disabled">
              <div className="settings-row-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
              </div>
              <div className="settings-row-content">
                <div className="settings-row-title">{t('settings:logout')}</div>
                <div className="settings-row-subtitle">Sign out of your account</div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Language Selector Modal */}
      <LanguageSelector
        isOpen={showLanguageSelector}
        onClose={() => setShowLanguageSelector(false)}
      />
    </div>
  );
}

export default Settings;
