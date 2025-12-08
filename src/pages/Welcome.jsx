import React, { useEffect } from 'react';
import '../styles/Welcome.css';

function Welcome({ user, onComplete }) {
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
        <h1 className="welcome-title">Welcome back,</h1>
        <h2 className="welcome-username">{user.username}!</h2>
        <p className="welcome-message">Let's crush your goals today</p>
        <div className="welcome-loader">
          <div className="loader-bar"></div>
        </div>
      </div>
    </div>
  );
}

export default Welcome;
