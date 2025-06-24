
import { supabase } from '@/integrations/supabase/client';

interface ServerVersionInfo {
  version: string;
  timestamp: number;
  forceUpdate: boolean;
}

class PWAVersionService {
  private currentVersion: string | null = null;
  private lastServerCheck: number = 0;
  private readonly CHECK_INTERVAL = 60000; // 60 seconds
  private lastKnownServerVersion: string | null = null;
  private updateInProgress: boolean = false;
  private sessionProcessedVersions: Set<string> = new Set();

  constructor() {
    this.currentVersion = this.getStoredVersion();
    this.loadSessionProcessedVersions();
    this.checkForCompletedUpdate();
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
      console.log('Version stored successfully:', version);
    } catch (error) {
      console.error('Failed to store version:', error);
    }
  }

  private loadSessionProcessedVersions(): void {
    try {
      const processed = sessionStorage.getItem('pwa-processed-versions');
      if (processed) {
        this.sessionProcessedVersions = new Set(JSON.parse(processed));
      }
    } catch (error) {
      console.error('Failed to load processed versions:', error);
    }
  }

  private saveSessionProcessedVersions(): void {
    try {
      sessionStorage.setItem('pwa-processed-versions', JSON.stringify([...this.sessionProcessedVersions]));
    } catch (error) {
      console.error('Failed to save processed versions:', error);
    }
  }

  private markVersionAsProcessed(version: string): void {
    this.sessionProcessedVersions.add(version);
    this.saveSessionProcessedVersions();
    console.log('Marked version as processed:', version);
  }

  private isVersionProcessedThisSession(version: string): boolean {
    return this.sessionProcessedVersions.has(version);
  }

  private checkForCompletedUpdate(): void {
    try {
      // Check if we just completed an update
      const targetVersion = localStorage.getItem('pwa-updating-to-version');
      if (targetVersion) {
        console.log('Detected completed update to version:', targetVersion);
        // Store the target version as current version
        this.setStoredVersion(targetVersion);
        this.markVersionAsProcessed(targetVersion);
        this.lastKnownServerVersion = targetVersion;
        this.updateInProgress = false;
        // Clean up the update marker
        localStorage.removeItem('pwa-updating-to-version');
        console.log('Update completion processed successfully');
      }
    } catch (error) {
      console.error('Failed to process completed update:', error);
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
    // Don't check if update is already in progress
    if (this.updateInProgress) {
      console.log('Update already in progress, skipping check');
      return false;
    }

    const serverInfo = await this.checkServerVersion();
    
    if (!serverInfo) {
      return false;
    }

    console.log('Server version check:', {
      serverVersion: serverInfo.version,
      currentVersion: this.currentVersion,
      lastKnownServerVersion: this.lastKnownServerVersion,
      forceUpdate: serverInfo.forceUpdate,
      processedThisSession: this.isVersionProcessedThisSession(serverInfo.version)
    });

    // Don't process the same version again in this session
    if (this.isVersionProcessedThisSession(serverInfo.version)) {
      console.log('Version already processed this session:', serverInfo.version);
      return false;
    }

    // Check if we're already on the server version
    if (this.currentVersion === serverInfo.version) {
      console.log('Already on latest version:', serverInfo.version);
      this.markVersionAsProcessed(serverInfo.version);
      this.lastKnownServerVersion = serverInfo.version;
      return false;
    }

    // Prevent duplicate notifications for the same server version
    if (this.lastKnownServerVersion === serverInfo.version) {
      console.log('Already notified about this version:', serverInfo.version);
      return false;
    }

    // Version mismatch detected - force update needed
    if (this.currentVersion && this.currentVersion !== serverInfo.version) {
      console.log('Version mismatch detected, forcing update');
      this.lastKnownServerVersion = serverInfo.version;
      return true;
    }

    // Force update if server explicitly requests it and we don't have a version
    if (serverInfo.forceUpdate && !this.currentVersion) {
      console.log('No current version, setting from server:', serverInfo.version);
      this.setStoredVersion(serverInfo.version);
      this.lastKnownServerVersion = serverInfo.version;
      this.markVersionAsProcessed(serverInfo.version);
      return false;
    }

    return false;
  }

  startUpdate(targetVersion: string): void {
    console.log('Starting update to version:', targetVersion);
    this.updateInProgress = true;
    this.markVersionAsProcessed(targetVersion);
    
    // Store the target version we're updating to in localStorage (persistent across refresh)
    try {
      localStorage.setItem('pwa-updating-to-version', targetVersion);
      console.log('Stored target version for update:', targetVersion);
    } catch (error) {
      console.error('Failed to store target version:', error);
    }
  }

  updateCurrentVersion(version: string): void {
    this.setStoredVersion(version);
    this.lastKnownServerVersion = version;
    this.updateInProgress = false;
    
    // Clear the updating version marker
    try {
      localStorage.removeItem('pwa-updating-to-version');
    } catch (error) {
      console.error('Failed to clear updating version:', error);
    }
    
    console.log('Version updated successfully to:', version);
  }

  getCurrentVersion(): string | null {
    return this.currentVersion;
  }

  // Reset state after successful update
  resetUpdateState(): void {
    this.checkForCompletedUpdate();
    this.lastKnownServerVersion = this.currentVersion;
    this.updateInProgress = false;
    console.log('Update state reset, current version:', this.currentVersion);
  }

  // Check if we're in the middle of an update process
  isUpdateInProgress(): boolean {
    return this.updateInProgress;
  }

  // Force reset for debugging
  forceReset(): void {
    this.sessionProcessedVersions.clear();
    this.saveSessionProcessedVersions();
    this.updateInProgress = false;
    this.lastKnownServerVersion = null;
    console.log('Force reset completed');
  }
}

export const pwaVersionService = new PWAVersionService();
