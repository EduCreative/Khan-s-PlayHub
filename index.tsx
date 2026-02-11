
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Register Service Worker for Offline Functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    /**
     * Fix: Ensure the Service Worker is registered on the same origin as the application page.
     * In preview environments, the JS modules might be served from a different origin (e.g., ai.studio),
     * so resolving sw.js relative to the module URL (import.meta.url) or using a plain relative path 
     * can lead to origin mismatch errors. Using window.location.origin ensures the browser
     * looks for sw.js on the current preview domain.
     */
    const swUrl = new URL('sw.js', window.location.origin).href;
    
    navigator.serviceWorker.register(swUrl)
      .then(registration => {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
      })
      .catch(err => {
        console.error('ServiceWorker registration failed: ', err);
      });
  });
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
