import React, { useState } from 'react';
import apiService from '../services/api.js';
import '../styles/Login.css';

function Login({ onLogin }) {
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
      setError('Please enter both username and password');
      return;
    }

    if (isSignUp) {
      // Sign up validation
      if (!formData.email) {
        setError('Please enter your email');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      // Validate password strength (must match backend requirements)
      if (formData.password.length < 12) {
        setError('Password must be at least 12 characters long');
        return;
      }
      if (!/[A-Z]/.test(formData.password)) {
        setError('Password must contain at least one uppercase letter');
        return;
      }
      if (!/[a-z]/.test(formData.password)) {
        setError('Password must contain at least one lowercase letter');
        return;
      }
      if (!/[0-9]/.test(formData.password)) {
        setError('Password must contain at least one number');
        return;
      }
      if (!/[@$!%*?&#]/.test(formData.password)) {
        setError('Password must contain at least one special character (@$!%*?&#)');
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
        setError(error.message || 'Registration failed');
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
        setError(error.message || 'Login failed');
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

          <h1 className="login-title">FITNESS CENTER</h1>

          <p className="login-subtitle">
            {isSignUp ? 'Create your account' : 'Sign in to your account'}
          </p>

          <form onSubmit={handleSubmit} className="form">
            {isSignUp && (
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your.email@example.com"
                  className="input-field"
                  autoComplete="email"
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Enter your username"
                className="input-field"
                autoComplete="username"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                className="input-field"
                autoComplete={isSignUp ? "new-password" : "current-password"}
              />
            </div>

            {isSignUp && (
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
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
                  Processing...
                </>
              ) : isSignUp ? (
                'Create Account'
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="auth-divider">
            <span></span>
            <span>OR</span>
            <span></span>
          </div>

          <button onClick={toggleMode} className="btn-ghost btn-full">
            {isSignUp
              ? 'Already have an account? Sign In'
              : "Don't have an account? Sign Up"}
          </button>

          {!isSignUp && (
            <a href="#" className="forgot-link">
              Forgot password?
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default Login;
