import React from 'react'
import { createRoot } from 'react-dom/client'
import { Amplify } from 'aws-amplify';
import App from './App.tsx'
import './index.css'

// Only register service worker in production to avoid caching issues during development
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);

        // Check for updates every 30 minutes
        setInterval(() => {
          registration.update();
        }, 30 * 60 * 1000);

        // Listen for waiting service worker
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('New service worker available');
                // The new service worker is available
                window.dispatchEvent(new CustomEvent('sw-update-available', {
                  detail: { registration }
                }));
              }
            });
          }
        });
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
} else if ('serviceWorker' in navigator) {
  // In development: unregister service workers and clear caches
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => {
      registration.unregister();
      console.log('🧹 Unregistered service worker for development');
    });
  });

  // Clear all caches
  if ('caches' in window) {
    caches.keys().then(names => {
      names.forEach(name => {
        caches.delete(name);
        console.log('🧹 Cleared cache:', name);
      });
    });
  }
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

async function init() {
  const container = document.getElementById("root");
  if (!container) {
    throw new Error('Root element not found');
  }
  const root = createRoot(container);

  try {
    // Fetch Auth Config from Backend
    const response = await fetch(`${API_URL}/v1/auth/config`);
    if (!response.ok) throw new Error('Failed to fetch auth config');

    const config = await response.json();

    if (config.userPoolId && config.userPoolClientId) {
      Amplify.configure({
        Auth: {
          Cognito: {
            userPoolId: config.userPoolId,
            userPoolClientId: config.userPoolClientId,
            loginWith: {
              email: true
            }
          }
        }
      });
      console.log('Amplify initialized with backend config');
    } else {
      console.warn('Amplify configuration missing in backend response, falling back to mock');
    }
  } catch (error) {
    console.error('Error initializing Amplify:', error);
  } finally {
    root.render(<App />);
  }
}

init();
