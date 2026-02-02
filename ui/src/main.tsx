import React from 'react'
import { createRoot } from 'react-dom/client'
import { Amplify } from 'aws-amplify';
import AppOptimized from './AppOptimized.tsx'
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

// Get auth mode from environment
const AUTH_MODE = import.meta.env.VITE_AUTH_MODE || 'local';
const IS_DEVELOPMENT = import.meta.env.DEV;

async function init() {
  const container = document.getElementById("root");
  if (!container) {
    throw new Error('Root element not found');
  }
  const root = createRoot(container);

  // Only configure Amplify in production/cloud mode
  if (AUTH_MODE === 'cognito' && !IS_DEVELOPMENT) {
    try {
      // In production, fetch auth config from backend
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${apiUrl}/v1/auth/config`);

      if (response.ok) {
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
          console.log('✅ Amplify configured with Cognito for production');
        }
      }
    } catch (error) {
      console.error('Failed to configure Cognito:', error);
    }
  } else {
    console.log(`🔧 Running in ${IS_DEVELOPMENT ? 'development' : AUTH_MODE} mode`);
  }

  root.render(<AppOptimized />);
}

init();
