import React from 'react';
import './LoadingSpinner.css';

/**
 * LoadingSpinner Component
 *
 * Reusable loading spinner with futuristic glassmorphism design.
 * Supports multiple sizes and color variants.
 *
 * @param {Object} props - Component props
 * @param {string} [props.size='medium'] - Spinner size: 'small' | 'medium' | 'large'
 * @param {string} [props.color='orange'] - Spinner color: 'orange' | 'white' | 'gray'
 * @param {string} [props.className=''] - Additional CSS classes
 */
function LoadingSpinner({ size = 'medium', color = 'orange', className = '' }) {
  return (
    <div className={`loading-spinner loading-spinner-${size} loading-spinner-${color} ${className}`}>
      <div className="spinner-circle"></div>
    </div>
  );
}

export default LoadingSpinner;
