import React from 'react';
import './ErrorBoundary.css';

/**
 * ErrorBoundary Component
 *
 * React error boundary component to catch and handle JavaScript errors
 * anywhere in the component tree. Displays a fallback UI instead of crashing.
 *
 * @component
 * @example
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details for debugging
    console.error('Error caught by ErrorBoundary:', error);
    console.error('Component stack:', errorInfo.componentStack);

    // Update state with error details
    this.setState(prevState => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1
    }));

    // Optional: Send error to error reporting service
    // Example: logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const { error, errorInfo, errorCount } = this.state;

      return (
        <div className="error-boundary">
          <div className="error-boundary-container">
            <div className="error-boundary-icon">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>

            <h1 className="error-boundary-title">Something went wrong</h1>
            <p className="error-boundary-message">
              We encountered an unexpected error. Please try refreshing the page.
            </p>

            {errorCount > 2 && (
              <div className="error-boundary-warning">
                Multiple errors detected. If the problem persists, please clear your browser cache or contact support.
              </div>
            )}

            <div className="error-boundary-actions">
              <button
                onClick={this.handleReset}
                className="error-boundary-btn error-boundary-btn-secondary"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="1 4 1 10 7 10"></polyline>
                  <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
                </svg>
                Try Again
              </button>

              <button
                onClick={this.handleReload}
                className="error-boundary-btn error-boundary-btn-primary"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
                </svg>
                Refresh Page
              </button>
            </div>

            {/* Show error details in development mode */}
            {process.env.NODE_ENV === 'development' && error && (
              <details className="error-boundary-details">
                <summary className="error-boundary-details-summary">
                  Error Details (Development Only)
                </summary>
                <div className="error-boundary-details-content">
                  <div className="error-boundary-error-name">
                    <strong>Error:</strong> {error.toString()}
                  </div>
                  {errorInfo && errorInfo.componentStack && (
                    <div className="error-boundary-stack">
                      <strong>Component Stack:</strong>
                      <pre>{errorInfo.componentStack}</pre>
                    </div>
                  )}
                  {error.stack && (
                    <div className="error-boundary-stack">
                      <strong>Stack Trace:</strong>
                      <pre>{error.stack}</pre>
                    </div>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
