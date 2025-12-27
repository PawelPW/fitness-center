import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import '../styles/Welcome.css';

function Welcome({ user, onComplete }) {
  const { t } = useTranslation('common');
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 2500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="welcome-container">
      {/* Animated Background */}
      <div className="welcome-background">
        <div className="gradient-mesh"></div>
        <div className="grid-background"></div>
        <div className="scan-line"></div>
        <div className="particles">
          {[...Array(5)].map((_, i) => (
            <div key={i} className={`particle particle-${i}`}></div>
          ))}
        </div>
      </div>

      <div className="welcome-content">
        <div className="welcome-icon">💪</div>
        <h1 className="welcome-title">{t('welcomeScreen.title')}</h1>
        <h2 className="welcome-username">{user.username}!</h2>
        <p className="welcome-message">{t('welcomeScreen.message')}</p>
        <div className="welcome-loader">
          <div className="loader-bar"></div>
        </div>
      </div>
    </div>
  );
}

export default Welcome;
