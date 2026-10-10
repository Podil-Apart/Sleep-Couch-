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
