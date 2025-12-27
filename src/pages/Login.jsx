import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import apiService from '../services/api.js';
import '../styles/Login.css';

function Login({ onLogin }) {
  const { t } = useTranslation('auth');
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.username || !formData.password) {
      setError(t('errors.requiredFields'));
      return;
    }

    if (isSignUp) {
      // Sign up validation
      if (!formData.email) {
        setError(t('errors.emailRequired'));
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError(t('errors.passwordsMismatch'));
        return;
      }

      // Validate password strength (must match backend requirements)
      if (formData.password.length < 12) {
        setError(t('errors.passwordTooShort'));
        return;
      }
      if (!/[A-Z]/.test(formData.password)) {
        setError(t('errors.passwordNeedsUppercase'));
        return;
      }
      if (!/[a-z]/.test(formData.password)) {
        setError(t('errors.passwordNeedsLowercase'));
        return;
      }
      if (!/[0-9]/.test(formData.password)) {
        setError(t('errors.passwordNeedsNumber'));
        return;
      }
      if (!/[@$!%*?&#]/.test(formData.password)) {
        setError(t('errors.passwordNeedsSpecial'));
        return;
      }

      // Register via API
      setLoading(true);
      try {
        const response = await apiService.register(
          formData.username,
          formData.email,
          formData.password
        );
        onLogin(response.user);
      } catch (error) {
        setError(error.message || t('errors.registrationFailed'));
      } finally {
        setLoading(false);
      }
    } else {
      // Login via API
      setLoading(true);
      try {
        const response = await apiService.login(formData.username, formData.password);
        onLogin(response.user);
      } catch (error) {
        setError(error.message || t('errors.loginFailed'));
      } finally {
        setLoading(false);
      }
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setError('');
    setFormData({
      username: '',
      password: '',
      confirmPassword: '',
      email: '',
    });
  };

  return (
    <div className="login-container">
      <div className="login-content">
        <div className="login-card">
          {/* Logo */}
          <div className="logo-container">
            <svg className="logo-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20.57 14.86L22 13.43L20.57 12L17 15.57L8.43 7L12 3.43L10.57 2L9.14 3.43L7.71 2L5.57 4.14L4.14 2.71L2.71 4.14L4.14 5.57L2 7.71L3.43 9.14L2 10.57L3.43 12L7 8.43L15.57 17L12 20.57L13.43 22L14.86 20.57L16.29 22L18.43 19.86L19.86 21.29L21.29 19.86L19.86 18.43L22 16.29L20.57 14.86Z" fill="currentColor"/>
            </svg>
          </div>

          <h1 className="login-title">{t('appName')}</h1>

          <p className="login-subtitle">
            {isSignUp ? t('signUp.title') : t('signIn.title')}
          </p>

          <form onSubmit={handleSubmit} className="form">
            {isSignUp && (
              <div className="form-group">
                <label htmlFor="email">{t('form.emailLabel')}</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder={t('form.emailPlaceholder')}
                  className="input-field"
                  autoComplete="email"
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="username">{t('form.usernameLabel')}</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder={t('form.usernamePlaceholder')}
                className="input-field"
                autoComplete="username"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">{t('form.passwordLabel')}</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder={t('form.passwordPlaceholder')}
                className="input-field"
                autoComplete={isSignUp ? "new-password" : "current-password"}
              />
            </div>

            {isSignUp && (
              <div className="form-group">
                <label htmlFor="confirmPassword">{t('form.confirmPasswordLabel')}</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder={t('form.confirmPasswordPlaceholder')}
                  className="input-field"
                  autoComplete="new-password"
                />
              </div>
            )}

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn-primary btn-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  {t('processing')}
                </>
              ) : isSignUp ? (
                t('signUp.button')
              ) : (
                t('signIn.button')
              )}
            </button>
          </form>

          <div className="auth-divider">
            <span></span>
            <span>{t('or')}</span>
            <span></span>
          </div>

          <button onClick={toggleMode} className="btn-ghost btn-full">
            {isSignUp
              ? t('signUp.hasAccount')
              : t('signIn.noAccount')}
          </button>

          {!isSignUp && (
            <a href="#" className="forgot-link">
              {t('signIn.forgotPassword')}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default Login;
