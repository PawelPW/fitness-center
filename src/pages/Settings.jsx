import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSwipeNavigation } from '../hooks/useSwipeNavigation';
import { getCurrentLanguage, getLanguageName } from '../i18n';
import { getLanguageByCode } from '../i18n/languages';
import LanguageSelector from '../components/LanguageSelector';
import '../styles/Settings.css';

function Settings({ onBack, onLogout, onViewProfile, user }) {
  const { t, i18n } = useTranslation(['settings', 'common']);
  const currentLanguage = getCurrentLanguage();
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);

  // Swipe navigation
  const swipeHandlers = useSwipeNavigation(onBack);

  // Calculate BMI if user has weight and height
  const calculateBMI = () => {
    if (user?.weight_kg && user?.height_cm) {
      const heightInMeters = user.height_cm / 100;
      const bmi = user.weight_kg / (heightInMeters * heightInMeters);
      return bmi.toFixed(1);
    }
    return null;
  };

  const bmi = calculateBMI();

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

      {/* Settings Content - Hub Layout */}
      <div className="settings-content">

        {/* Profile Card */}
        <div className="hub-card profile-hub-card" onClick={onViewProfile} role="button" tabIndex={0}>
          <div className="hub-card-header">
            <div className="hub-card-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <h2 className="hub-card-title">{t('settings:profile', 'Profile')}</h2>
          </div>

          <div className="hub-card-content">
            {user && (
              <>
                <div className="profile-summary">
                  <div className="profile-avatar-small">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                  </div>
                  <div className="profile-summary-text">
                    <div className="profile-summary-name">{user.username}</div>
                    <div className="profile-summary-email">{user.email || 'No email'}</div>
                  </div>
                </div>

                <div className="profile-stats-pills">
                  {user.weight_kg && (
                    <div className="stat-pill">
                      <span className="stat-pill-icon">⚖️</span>
                      <span className="stat-pill-value">{user.weight_kg}kg</span>
                    </div>
                  )}
                  {user.height_cm && (
                    <div className="stat-pill">
                      <span className="stat-pill-icon">📏</span>
                      <span className="stat-pill-value">{user.height_cm}cm</span>
                    </div>
                  )}
                  {bmi && (
                    <div className="stat-pill">
                      <span className="stat-pill-icon">📊</span>
                      <span className="stat-pill-value">BMI {bmi}</span>
                    </div>
                  )}
                  {!user.weight_kg && !user.height_cm && (
                    <div className="profile-incomplete">
                      <span>Complete your profile to track progress</span>
                    </div>
                  )}
                </div>

                {user.target_weight_kg && user.weight_kg && (
                  <div className="profile-goal-progress">
                    <div className="goal-label">
                      Goal: {user.target_weight_kg}kg
                      <span className="goal-remaining">
                        {Math.abs(user.weight_kg - user.target_weight_kg).toFixed(1)}kg to go
                      </span>
                    </div>
                    <div className="goal-progress-bar">
                      <div
                        className="goal-progress-fill"
                        style={{
                          width: `${Math.min(100, Math.max(0, ((user.weight_kg - user.target_weight_kg) / user.weight_kg) * 100))}%`
                        }}
                      ></div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="hub-card-action">
            <span>{t('settings:manage_profile', 'Manage Profile')}</span>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 4l6 6-6 6"/>
            </svg>
          </div>
        </div>

        {/* Preferences Card */}
        <div className="hub-card preferences-hub-card">
          <div className="hub-card-header">
            <div className="hub-card-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1v6m0 6v6M1 12h6m6 0h6"/>
                <path d="M4.22 4.22l4.24 4.24m7.08 0l4.24-4.24M4.22 19.78l4.24-4.24m7.08 0l4.24 4.24"/>
              </svg>
            </div>
            <h2 className="hub-card-title">{t('settings:preferences', 'Preferences')}</h2>
          </div>

          <div className="hub-card-content">
            <div className="preference-item" onClick={() => setShowLanguageSelector(true)} role="button" tabIndex={0}>
              <div className="preference-icon">
                <span className="language-flag">{getLanguageByCode(currentLanguage)?.flag || '🌐'}</span>
              </div>
              <div className="preference-text">
                <div className="preference-label">{t('settings:language', 'Language')}</div>
                <div className="preference-value">{getLanguageByCode(currentLanguage)?.nativeName || 'English'}</div>
              </div>
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M7 4l6 6-6 6"/>
              </svg>
            </div>

            <div className="preference-item preference-item-disabled">
              <div className="preference-icon">🔔</div>
              <div className="preference-text">
                <div className="preference-label">{t('settings:notifications', 'Notifications')}</div>
                <div className="preference-value">Coming Soon</div>
              </div>
            </div>
          </div>
        </div>

        {/* Account Card */}
        <div className="hub-card account-hub-card">
          <div className="hub-card-header">
            <div className="hub-card-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <h2 className="hub-card-title">{t('settings:account', 'Account')}</h2>
          </div>

          <div className="hub-card-content">
            {user && (
              <div className="account-summary">
                <div className="account-avatar-hub">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
                <div className="account-summary-text">
                  <div className="account-summary-name">{user.username}</div>
                  <div className="account-summary-email">{user.email || 'No email provided'}</div>
                </div>
              </div>
            )}

            <button className="hub-logout-button" onClick={onLogout} aria-label={t('common:logout')}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              <span>{t('common:logout')}</span>
            </button>
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
