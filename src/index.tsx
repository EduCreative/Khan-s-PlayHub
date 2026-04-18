
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: any}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', color: '#e11d48', background: '#0f172a', minHeight: '100vh', fontFamily: 'sans-serif' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '900', textTransform: 'uppercase', marginBottom: '20px' }}>Critical System Failure</h1>
          <div style={{ background: 'rgba(225, 29, 72, 0.1)', border: '1px solid #e11d48', padding: '20px', borderRadius: '12px' }}>
            <p style={{ fontWeight: 'bold', marginBottom: '10px' }}>Error Details:</p>
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px' }}>{this.state.error?.toString()}</pre>
          </div>
          <button 
            onClick={() => window.location.reload()}
            style={{ marginTop: '20px', padding: '12px 24px', background: '#e11d48', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            Attempt System Reboot
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );

  // Unregister existing service workers to fix potential blank screen issues
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      for (let registration of registrations) {
        registration.unregister();
        console.log('SW Unregistered');
      }
    });
  }

  /*
  // Register Service Worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => console.log('SW Registered:', reg.scope))
        .catch(err => console.log('SW Registration Failed:', err));
    });
  }
  */
}
