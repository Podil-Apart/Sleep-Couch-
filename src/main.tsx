// Ensure window.fetch has both getter and setter for iframe supervisors/extensions
if (typeof window !== 'undefined') {
  try {
    const origFetch = window.fetch ? window.fetch.bind(window) : null;
    let _fetch = origFetch;
    try {
      Object.defineProperty(window, 'fetch', {
        get: () => _fetch,
        set: (fn) => {
          _fetch = fn;
        },
        configurable: true,
        enumerable: true,
      });
    } catch {}
    try {
      if (typeof Window !== 'undefined' && Window.prototype) {
        const desc = Object.getOwnPropertyDescriptor(Window.prototype, 'fetch');
        if (desc && !desc.set && desc.configurable) {
          Object.defineProperty(Window.prototype, 'fetch', {
            get: desc.get || (() => _fetch),
            set: (fn) => {
              _fetch = fn;
            },
            configurable: true,
            enumerable: desc.enumerable !== false,
          });
        }
      }
    } catch {}
  } catch {}

  // Gracefully suppress expected stream cancellations (AbortError / WebSocket closures)
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    if (
      reason &&
      (reason.name === 'AbortError' ||
        reason.message?.includes('aborted') ||
        reason.message?.includes('AbortError') ||
        reason.message?.includes('WebSocket closed without opened'))
    ) {
      event.preventDefault();
      event.stopPropagation();
    }
  });

  window.addEventListener('error', (event) => {
    const err = event.error;
    if (
      (err &&
        (err.name === 'AbortError' ||
          err.message?.includes('aborted') ||
          err.message?.includes('AbortError'))) ||
      event.message?.includes('WebSocket closed without opened') ||
      event.message?.includes('signal is aborted')
    ) {
      event.preventDefault();
      event.stopPropagation();
    }
  });
}

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
