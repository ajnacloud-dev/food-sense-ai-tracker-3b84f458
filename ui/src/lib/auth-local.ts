/**
 * Local authentication adapter for development
 * Works with the local backend authentication mode
 */

import { LOCAL_USER } from '@/config/local';

const API_URL = import.meta.env.VITE_API_URL || '';

// Mock user for local development - uses centralized config
const MOCK_USER = {
  id: LOCAL_USER.id,
  email: LOCAL_USER.email,
  user_metadata: {
    full_name: LOCAL_USER.name,
    user_type: 'participant'
  }
};

// Mock session
const MOCK_SESSION = {
  access_token: 'dev-user-1',
  user: MOCK_USER
};

export const localAuth = {
  /**
   * Sign in with email and password (mock for local dev)
   */
  async signInWithPassword({ email, password }: { email: string; password: string }) {
    // In local mode, any credentials work
    console.log('Local auth: Signing in with', email);

    // Store the mock session
    localStorage.setItem('mock_token', 'dev-user-1');
    localStorage.setItem('mock_user', JSON.stringify(MOCK_USER));

    return {
      data: {
        user: MOCK_USER,
        session: MOCK_SESSION
      },
      error: null
    };
  },

  /**
   * Sign up (mock for local dev)
   */
  async signUp({ email, password }: { email: string; password: string }) {
    console.log('Local auth: Signing up with', email);

    // In local mode, signup always succeeds
    localStorage.setItem('mock_token', 'dev-user-1');
    localStorage.setItem('mock_user', JSON.stringify(MOCK_USER));

    return {
      data: {
        user: MOCK_USER,
        session: MOCK_SESSION
      },
      error: null
    };
  },

  /**
   * Sign out (mock for local dev)
   */
  async signOut() {
    console.log('Local auth: Signing out');

    localStorage.removeItem('mock_token');
    localStorage.removeItem('mock_user');

    return { error: null };
  },

  /**
   * Get current session (mock for local dev)
   */
  async getSession() {
    const token = localStorage.getItem('mock_token');
    const userStr = localStorage.getItem('mock_user');

    if (token && userStr) {
      const user = JSON.parse(userStr);
      return {
        data: {
          session: {
            access_token: token,
            user: user
          }
        },
        error: null
      };
    }

    return {
      data: { session: null },
      error: null
    };
  },

  /**
   * Get current user (mock for local dev)
   */
  async getUser() {
    const userStr = localStorage.getItem('mock_user');

    if (userStr) {
      return {
        data: { user: JSON.parse(userStr) },
        error: null
      };
    }

    return {
      data: { user: null },
      error: null
    };
  }
};

/**
 * Get auth headers for API requests
 */
export function getAuthHeaders() {
  const token = localStorage.getItem('mock_token') || LOCAL_USER.token;
  return {
    'Authorization': `Bearer ${token}`,
    'X-User-Id': LOCAL_USER.id  // Uses centralized config
  };
}