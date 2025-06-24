
import { supabase } from '@/integrations/supabase/client';

interface ServerVersionInfo {
  version: string;
  timestamp: number;
  forceUpdate: boolean;
}

class PWAVersionService {
  private currentVersion: string | null = null;
  private lastServerCheck: number = 0;
  private readonly CHECK_INTERVAL = 60000; // Increased to 60 seconds to prevent spam
  private lastKnownServerVersion: string | null = null;

  constructor() {
    this.currentVersion = this.getStoredVersion();
  }

  private getStoredVersion(): string | null {
    try {
      return localStorage.getItem('pwa-app-version');
    } catch {
      return null;
    }
  }

  private setStoredVersion(version: string): void {
    try {
      localStorage.setItem('pwa-app-version', version);
      this.currentVersion = version;
    } catch (error) {
      console.error('Failed to store version:', error);
    }
  }

  async checkServerVersion(): Promise<ServerVersionInfo | null> {
    try {
      const now = Date.now();
      
      // Rate limit server checks
      if (now - this.lastServerCheck < this.CHECK_INTERVAL) {
        return null;
      }
      
      this.lastServerCheck = now;

      console.log('Checking server version...');
      
      const { data, error } = await supabase.functions.invoke('app-version');
      
      if (error) {
        console.error('Failed to check server version:', error);
        return null;
      }

      return data as ServerVersionInfo;
    } catch (error) {
      console.error('Error checking server version:', error);
      return null;
    }
  }

  async shouldForceUpdate(): Promise<boolean> {
    const serverInfo = await this.checkServerVersion();
    
    if (!serverInfo) {
      return false;
    }

    // Prevent duplicate notifications for the same server version
    if (this.lastKnownServerVersion === serverInfo.version) {
      return false;
    }

    console.log('Server version check:', {
      serverVersion: serverInfo.version,
      currentVersion: this.currentVersion,
      lastKnownServerVersion: this.lastKnownServerVersion,
      forceUpdate: serverInfo.forceUpdate
    });

    // Always force update if versions don't match (default behavior)
    if (this.currentVersion && this.currentVersion !== serverInfo.version) {
      console.log('Version mismatch detected, forcing update');
      this.lastKnownServerVersion = serverInfo.version;
      return true;
    }

    // Force update if server explicitly requests it (though it's true by default now)
    if (serverInfo.forceUpdate && !this.currentVersion) {
      this.lastKnownServerVersion = serverInfo.version;
      return true;
    }

    // Store server version if we don't have one
    if (!this.currentVersion) {
      this.setStoredVersion(serverInfo.version);
      this.lastKnownServerVersion = serverInfo.version;
    }

    return false;
  }

  updateCurrentVersion(version: string): void {
    this.setStoredVersion(version);
    this.lastKnownServerVersion = version;
  }

  getCurrentVersion(): string | null {
    return this.currentVersion;
  }

  // Reset state after successful update
  resetUpdateState(): void {
    this.lastKnownServerVersion = this.currentVersion;
  }
}

export const pwaVersionService = new PWAVersionService();
