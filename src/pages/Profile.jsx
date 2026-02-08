import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSwipeNavigation } from '../hooks/useSwipeNavigation';
import apiService from '../services/api';
import { logger } from '../utils/logger';
import '../styles/Profile.css';

function Profile({ onBack, user, onUpdateUser }) {
  const { t } = useTranslation(['profile', 'common']);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    age: user?.age || '',
    gender: user?.gender || 'male',
    weight_kg: user?.weight_kg || '',
    height_cm: user?.height_cm || '',
    target_weight_kg: user?.target_weight_kg || '',
    fitness_goal: user?.fitness_goal || 'maintenance',
    activity_level: user?.activity_level || 'moderate',
    weekly_workout_target: user?.weekly_workout_target || 3
  });

  // Unit toggles
  const [weightUnit, setWeightUnit] = useState('kg');
  const [heightUnit, setHeightUnit] = useState('cm');

  // Swipe navigation
  const swipeHandlers = useSwipeNavigation(onBack);

  // Update form data when user prop changes
  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        age: user.age || '',
        gender: user.gender || 'male',
        weight_kg: user.weight_kg || '',
        height_cm: user.height_cm || '',
        target_weight_kg: user.target_weight_kg || '',
        fitness_goal: user.fitness_goal || 'maintenance',
        activity_level: user.activity_level || 'moderate',
        weekly_workout_target: user.weekly_workout_target || 3
      });
    }
  }, [user]);

  // Calculate BMI
  const calculateBMI = () => {
    const weight = parseFloat(formData.weight_kg);
    const height = parseFloat(formData.height_cm);
    if (weight && height) {
      const heightInMeters = height / 100;
      return (weight / (heightInMeters * heightInMeters)).toFixed(1);
    }
    return null;
  };

  // Calculate daily calories (simplified BMR)
  const calculateDailyCalories = () => {
    const weight = parseFloat(formData.weight_kg);
    const height = parseFloat(formData.height_cm);
    const age = parseInt(formData.age);

    if (weight && height && age) {
      // Mifflin-St Jeor equation
      let bmr;
      if (formData.gender === 'male') {
        bmr = 10 * weight + 6.25 * height - 5 * age + 5;
      } else {
        bmr = 10 * weight + 6.25 * height - 5 * age - 161;
      }

      // Activity multiplier
      const activityMultipliers = {
        sedentary: 1.2,
        light: 1.375,
        moderate: 1.55,
        active: 1.725,
        very_active: 1.9
      };

      return Math.round(bmr * (activityMultipliers[formData.activity_level] || 1.55));
    }
    return null;
  };

  // Calculate protein requirement (2g per kg for muscle gain, 1.6g for weight loss)
  const calculateProtein = () => {
    const weight = parseFloat(formData.weight_kg);
    if (weight) {
      if (formData.fitness_goal === 'muscle_gain') {
        return Math.round(weight * 2.0);
      } else if (formData.fitness_goal === 'weight_loss') {
        return Math.round(weight * 1.6);
      }
      return Math.round(weight * 1.5);
    }
    return null;
  };

  // Recalculate stats whenever formData changes
  const bmi = useMemo(() => calculateBMI(), [formData.weight_kg, formData.height_cm]);
  const dailyCalories = useMemo(() => calculateDailyCalories(), [
    formData.weight_kg,
    formData.height_cm,
    formData.age,
    formData.gender,
    formData.activity_level
  ]);
  const dailyProtein = useMemo(() => calculateProtein(), [
    formData.weight_kg,
    formData.fitness_goal
  ]);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(null);
  };

  // Convert weight units
  const convertWeight = (value, fromUnit, toUnit) => {
    if (!value) return '';
    const numValue = parseFloat(value);
    if (fromUnit === 'kg' && toUnit === 'lbs') {
      return (numValue * 2.20462).toFixed(1);
    } else if (fromUnit === 'lbs' && toUnit === 'kg') {
      return (numValue / 2.20462).toFixed(1);
    }
    return value;
  };

  // Convert height units
  const convertHeight = (value, fromUnit, toUnit) => {
    if (!value) return '';
    const numValue = parseFloat(value);
    if (fromUnit === 'cm' && toUnit === 'ft') {
      const totalInches = numValue / 2.54;
      const feet = Math.floor(totalInches / 12);
      const inches = Math.round(totalInches % 12);
      return `${feet}'${inches}"`;
    } else if (fromUnit === 'ft' && toUnit === 'cm') {
      return Math.round(numValue * 30.48);
    }
    return value;
  };

  // Handle save
  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      // Validate required fields
      if (!formData.username) {
        setError('Username is required');
        return;
      }

      // Prepare data for API
      const profileData = {
        ...formData,
        weight_kg: formData.weight_kg ? parseFloat(formData.weight_kg) : null,
        height_cm: formData.height_cm ? parseFloat(formData.height_cm) : null,
        target_weight_kg: formData.target_weight_kg ? parseFloat(formData.target_weight_kg) : null,
        age: formData.age ? parseInt(formData.age) : null,
        weekly_workout_target: parseInt(formData.weekly_workout_target) || 3
      };

      const response = await apiService.updateUserProfile(profileData);

      if (response.success) {
        setSuccess(true);
        if (onUpdateUser) {
          onUpdateUser(response.user);
        }
        setTimeout(() => {
          setSuccess(false);
        }, 3000);
      } else {
        setError(response.message || 'Failed to update profile');
      }
    } catch (err) {
      logger.error('Error saving profile:', err);

      // Handle validation errors from express-validator
      if (err.message && err.message.includes('errors')) {
        try {
          const errorData = JSON.parse(err.message);
          if (errorData.errors && Array.isArray(errorData.errors)) {
            const errorMessages = errorData.errors
              .map(e => `${e.path}: ${e.msg}`)
              .join(', ');
            setError(`Validation error: ${errorMessages}`);
            return;
          }
        } catch (parseError) {
          // If parsing fails, continue to generic error
        }
      }

      setError(err.message || 'Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-container" {...swipeHandlers}>
      {/* Header */}
      <div className="profile-header">
        <button className="back-button" onClick={onBack} aria-label="Go back">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </button>
        <h1 className="profile-title">{t('profile:title', 'Profile')}</h1>
        <button
          className="save-button-header"
          onClick={handleSave}
          disabled={saving}
          aria-label={t('common:save', 'Save')}
        >
          {saving ? '...' : t('common:save', 'Save')}
        </button>
      </div>

      {/* Content */}
      <div className="profile-content">

        {/* Success Message */}
        {success && (
          <div className="alert alert-success">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <span>{t('profile:save_success', 'Profile updated successfully!')}</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="alert alert-error">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Personal Info Section */}
        <div className="profile-section">
          <h2 className="section-title">{t('profile:personal_info', 'Personal Information')}</h2>

          <div className="profile-card">
            <div className="form-group">
              <label htmlFor="username" className="form-label">{t('profile:username', 'Username')}</label>
              <input
                type="text"
                id="username"
                name="username"
                className="form-input"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="John Doe"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email" className="form-label">{t('profile:email', 'Email')}</label>
              <input
                type="email"
                id="email"
                name="email"
                className="form-input"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="john@example.com"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="age" className="form-label">{t('profile:age', 'Age')}</label>
                <input
                  type="number"
                  id="age"
                  name="age"
                  className="form-input"
                  value={formData.age}
                  onChange={handleInputChange}
                  placeholder="28"
                  min="13"
                  max="120"
                />
              </div>

              <div className="form-group">
                <label htmlFor="gender" className="form-label">{t('profile:gender', 'Gender')}</label>
                <select
                  id="gender"
                  name="gender"
                  className="form-select"
                  value={formData.gender}
                  onChange={handleInputChange}
                >
                  <option value="male">{t('profile:male', 'Male')}</option>
                  <option value="female">{t('profile:female', 'Female')}</option>
                  <option value="other">{t('profile:other', 'Other')}</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Body Metrics Section */}
        <div className="profile-section">
          <h2 className="section-title">{t('profile:body_metrics', 'Body Metrics')}</h2>

          <div className="profile-card">
            <div className="form-group">
              <div className="form-label-with-toggle">
                <label htmlFor="weight" className="form-label">{t('profile:weight', 'Current Weight')}</label>
                <div className="unit-toggle">
                  <button
                    className={`unit-btn ${weightUnit === 'kg' ? 'active' : ''}`}
                    onClick={() => setWeightUnit('kg')}
                    type="button"
                  >
                    kg
                  </button>
                  <button
                    className={`unit-btn ${weightUnit === 'lbs' ? 'active' : ''}`}
                    onClick={() => setWeightUnit('lbs')}
                    type="button"
                  >
                    lbs
                  </button>
                </div>
              </div>
              <input
                type="number"
                id="weight"
                name="weight_kg"
                className="form-input"
                value={formData.weight_kg}
                onChange={handleInputChange}
                placeholder={weightUnit === 'kg' ? '75.0' : '165.3'}
                step="0.1"
              />
            </div>

            <div className="form-group">
              <div className="form-label-with-toggle">
                <label htmlFor="height" className="form-label">{t('profile:height', 'Height')}</label>
                <div className="unit-toggle">
                  <button
                    className={`unit-btn ${heightUnit === 'cm' ? 'active' : ''}`}
                    onClick={() => setHeightUnit('cm')}
                    type="button"
                  >
                    cm
                  </button>
                  <button
                    className={`unit-btn ${heightUnit === 'ft' ? 'active' : ''}`}
                    onClick={() => setHeightUnit('ft')}
                    type="button"
                  >
                    ft
                  </button>
                </div>
              </div>
              <input
                type="number"
                id="height"
                name="height_cm"
                className="form-input"
                value={formData.height_cm}
                onChange={handleInputChange}
                placeholder={heightUnit === 'cm' ? '180' : '5\'11"'}
                step="0.1"
              />
            </div>

            <div className="form-group">
              <label htmlFor="target_weight" className="form-label">{t('profile:target_weight', 'Target Weight')}</label>
              <input
                type="number"
                id="target_weight"
                name="target_weight_kg"
                className="form-input"
                value={formData.target_weight_kg}
                onChange={handleInputChange}
                placeholder="70.0"
                step="0.1"
              />
            </div>
          </div>
        </div>

        {/* Fitness Goals Section */}
        <div className="profile-section">
          <h2 className="section-title">{t('profile:fitness_goals', 'Fitness Goals')}</h2>

          <div className="profile-card">
            <div className="form-group">
              <label htmlFor="fitness_goal" className="form-label">{t('profile:goal', 'Goal')}</label>
              <select
                id="fitness_goal"
                name="fitness_goal"
                className="form-select"
                value={formData.fitness_goal}
                onChange={handleInputChange}
              >
                <option value="weight_loss">{t('profile:weight_loss', 'Weight Loss')}</option>
                <option value="muscle_gain">{t('profile:muscle_gain', 'Muscle Gain')}</option>
                <option value="maintenance">{t('profile:maintenance', 'Maintenance')}</option>
                <option value="endurance">{t('profile:endurance', 'Endurance')}</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="activity_level" className="form-label">{t('profile:activity_level', 'Activity Level')}</label>
              <select
                id="activity_level"
                name="activity_level"
                className="form-select"
                value={formData.activity_level}
                onChange={handleInputChange}
              >
                <option value="sedentary">{t('profile:sedentary', 'Sedentary (Little or no exercise)')}</option>
                <option value="light">{t('profile:light', 'Light (1-2 workouts/week)')}</option>
                <option value="moderate">{t('profile:moderate', 'Moderate (3-5 workouts/week)')}</option>
                <option value="active">{t('profile:active', 'Active (6-7 workouts/week)')}</option>
                <option value="very_active">{t('profile:very_active', 'Very Active (2x per day)')}</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="weekly_target" className="form-label">{t('profile:weekly_target', 'Weekly Workout Target')}</label>
              <input
                type="number"
                id="weekly_target"
                name="weekly_workout_target"
                className="form-input"
                value={formData.weekly_workout_target}
                onChange={handleInputChange}
                placeholder="3"
                min="1"
                max="14"
              />
            </div>
          </div>
        </div>

        {/* Calculated Stats Section */}
        <div className="profile-section">
          <h2 className="section-title">{t('profile:your_stats', 'Your Stats')}</h2>
          <p className="section-description">{t('profile:stats_description', 'Automatically calculated based on your profile')}</p>

          <div className="profile-card stats-card">
            <div className="stat-item">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <div className="stat-label">BMI</div>
                <div className="stat-value">{bmi || '—'}</div>
                {bmi && (
                  <div className="stat-hint">
                    {bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Healthy' : bmi < 30 ? 'Overweight' : 'Obese'}
                  </div>
                )}
              </div>
            </div>

            <div className="stat-item">
              <div className="stat-icon">🔥</div>
              <div className="stat-content">
                <div className="stat-label">{t('profile:daily_calories', 'Daily Calories')}</div>
                <div className="stat-value">{dailyCalories ? `${dailyCalories} kcal` : '—'}</div>
                <div className="stat-hint">{t('profile:maintenance_calories', 'Maintenance calories')}</div>
              </div>
            </div>

            <div className="stat-item">
              <div className="stat-icon">🥩</div>
              <div className="stat-content">
                <div className="stat-label">{t('profile:protein', 'Protein')}</div>
                <div className="stat-value">{dailyProtein ? `${dailyProtein}g` : '—'}</div>
                <div className="stat-hint">{t('profile:daily_target', 'Daily target')}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <button
          className="save-button-bottom"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? t('common:saving', 'Saving...') : t('common:save_changes', 'Save Changes')}
        </button>

      </div>
    </div>
  );
}

export default Profile;
