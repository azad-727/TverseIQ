import { Component } from 'react';
import { RefreshCw } from 'lucide-react';
import './ErrorBoundary.css';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-boundary-content">
            <div className="error-boundary-icon">⚠️</div>
            <h2 className="error-boundary-title">Something went wrong</h2>
            <p className="error-boundary-desc">
              {this.state.error?.message || 'An unexpected error occurred while rendering this page.'}
            </p>
            <button className="error-boundary-btn" onClick={this.handleRetry}>
              <RefreshCw size={16} />
              Try Again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
