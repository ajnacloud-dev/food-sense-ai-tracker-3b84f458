/**
 * Local Development Configuration
 * Centralizes all local development settings
 */

// Determine if we're in local/development mode
export const IS_LOCAL_MODE = import.meta.env.DEV || import.meta.env.MODE === 'development';

// Default user for local development - matches backend test data
export const LOCAL_USER = {
  id: 'dev-user-1',
  email: 'dev@local.com',
  name: 'Development User',
  token: 'dev-user-1'
} as const;

// Get current user ID consistently
export function getLocalUserId(): string {
  if (!IS_LOCAL_MODE) {
    // In production, get from auth
    const user = localStorage.getItem('user');
    if (user) {
      try {
        return JSON.parse(user).id;
      } catch {
        return '';
      }
    }
    return '';
  }

  // In local mode, always use dev-user-1
  return LOCAL_USER.id;
}

// Initialize local storage for development
export function initializeLocalAuth() {
  if (!IS_LOCAL_MODE) return;

  // Check current user
  const currentUser = localStorage.getItem('mock_user');
  let needsUpdate = false;

  if (currentUser) {
    try {
      const parsed = JSON.parse(currentUser);
      // Force update if still using old user ID
      if (parsed.id === 'local-dev-user') {
        needsUpdate = true;
      }
    } catch {
      needsUpdate = true;
    }
  } else {
    needsUpdate = true;
  }

  if (needsUpdate) {
    // Set/update to correct local user
    localStorage.setItem('mock_token', LOCAL_USER.token);
    localStorage.setItem('mock_user', JSON.stringify({
      id: LOCAL_USER.id,
      email: LOCAL_USER.email,
      user_metadata: {
        full_name: LOCAL_USER.name,
        user_type: 'participant'
      }
    }));

    // Also update the auth_token and user for backendApi
    localStorage.setItem('auth_token', LOCAL_USER.token);
    localStorage.setItem('user', JSON.stringify({
      id: LOCAL_USER.id,
      email: LOCAL_USER.email,
      user_metadata: {
        full_name: LOCAL_USER.name,
        user_type: 'participant'
      }
    }));

    console.log('Local auth updated to user:', LOCAL_USER.id);

    // Reload to apply changes
    if (currentUser) {
      window.location.reload();
    }
  }
}