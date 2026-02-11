
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Register Service Worker for Offline Functionality
// Enhanced with defensive checks for preview/sandbox environments
if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
  window.addEventListener('load', () => {
    // Construct the URL safely
    const swUrl = new URL('sw.js', window.location.origin).href;

    // Use a small timeout to ensure the document has reached a stable state.
    // This specifically mitigates the "The document is in an invalid state" error
    // which can occur if registration is attempted during rapid hot-reloads.
    setTimeout(() => {
      navigator.serviceWorker.register(swUrl)
        .then(registration => {
          console.log('ServiceWorker registration successful with scope: ', registration.scope);
        })
        .catch(err => {
          // If the error is specifically about the document state, we log it as a warning
          // as it's common in frame-based previews and doesn't break core app logic.
          if (err.message && err.message.includes('state')) {
            console.warn('ServiceWorker registration skipped: Document is currently in a transitional state.');
          } else {
            console.error('ServiceWorker registration failed: ', err);
          }
        });
    }, 1500); // 1.5s delay for environment stabilization
  });
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
