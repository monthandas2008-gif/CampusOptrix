import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles/tokens.css';

class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('CampusOptix UI Crash caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          background: '#0B132B',
          color: '#FFFFFF',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          fontFamily: 'system-ui, sans-serif'
        }}>
          <div style={{
            maxWidth: '600px',
            width: '100%',
            background: '#1C2541',
            borderRadius: '12px',
            padding: '32px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            border: '1px solid #3A506B'
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#FF6B6B', marginBottom: '8px' }}>
              CampusOptix Interface Notice
            </h2>
            <p style={{ fontSize: '13px', color: '#E0E1DD', marginBottom: '16px', lineHeight: '1.5' }}>
              {this.state.error?.message || 'A UI component encountered an issue.'}
            </p>
            <button
              onClick={() => {
                localStorage.clear();
                sessionStorage.clear();
                window.location.reload();
              }}
              style={{
                background: '#2457A6',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '6px',
                padding: '10px 18px',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              Reset Session & Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GlobalErrorBoundary>
      <App />
    </GlobalErrorBoundary>
  </React.StrictMode>
);
