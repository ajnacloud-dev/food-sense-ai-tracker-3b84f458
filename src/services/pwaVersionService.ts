
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
  private updateAttempts: number = 0;
  private readonly MAX_UPDATE_ATTEMPTS = 3;
  private lastSuccessfulUpdate: number = 0;
  private readonly UPDATE_COOLDOWN = 300000; // 5 minutes

  constructor() {
    this.currentVersion = this.getStoredVersion();
    this.loadSessionProcessedVersions();
    this.checkForCompletedUpdate();
    this.resetUpdateAttemptsIfNeeded();
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
      console.log('Version stored and updated successfully:', version);
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

  private resetUpdateAttemptsIfNeeded(): void {
    const now = Date.now();
    const lastAttempt = parseInt(localStorage.getItem('pwa-last-update-attempt') || '0');
    
    // Reset attempts if more than 30 minutes have passed
    if (now - lastAttempt > 1800000) {
      this.updateAttempts = 0;
      localStorage.removeItem('pwa-update-attempts');
      localStorage.removeItem('pwa-last-update-attempt');
    } else {
      this.updateAttempts = parseInt(localStorage.getItem('pwa-update-attempts') || '0');
    }
  }

  private recordUpdateAttempt(): void {
    this.updateAttempts++;
    localStorage.setItem('pwa-update-attempts', this.updateAttempts.toString());
    localStorage.setItem('pwa-last-update-attempt', Date.now().toString());
  }

  private checkForCompletedUpdate(): void {
    try {
      const targetVersion = localStorage.getItem('pwa-updating-to-version');
      if (targetVersion) {
        console.log('Detected completed update to target version:', targetVersion);
        
        // CRITICAL FIX: Actually update the current version to the target version
        this.setStoredVersion(targetVersion);
        this.markVersionAsProcessed(targetVersion);
        this.lastKnownServerVersion = targetVersion;
        this.updateInProgress = false;
        this.lastSuccessfulUpdate = Date.now();
        
        // Reset update attempts after successful update
        this.updateAttempts = 0;
        localStorage.removeItem('pwa-update-attempts');
        localStorage.removeItem('pwa-last-update-attempt');
        
        // Clean up the update marker
        localStorage.removeItem('pwa-updating-to-version');
        
        console.log('Update completion processed successfully - current version now:', this.currentVersion);
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
    // Circuit breaker: prevent infinite update loops
    if (this.updateAttempts >= this.MAX_UPDATE_ATTEMPTS) {
      console.log('Maximum update attempts reached, preventing further updates');
      return false;
    }

    // Don't check if update is already in progress
    if (this.updateInProgress) {
      console.log('Update already in progress, skipping check');
      return false;
    }

    // Cooldown after successful update
    const now = Date.now();
    if (this.lastSuccessfulUpdate > 0 && (now - this.lastSuccessfulUpdate) < this.UPDATE_COOLDOWN) {
      console.log('Update cooldown active, skipping check');
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
      processedThisSession: this.isVersionProcessedThisSession(serverInfo.version),
      updateAttempts: this.updateAttempts
    });

    // Don't process the same version again in this session
    if (this.isVersionProcessedThisSession(serverInfo.version)) {
      console.log('Version already processed this session:', serverInfo.version);
      return false;
    }

    // CRITICAL FIX: Check if we're already on the server version
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
    this.recordUpdateAttempt();
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
    this.lastSuccessfulUpdate = Date.now();
    
    // Reset update attempts after successful update
    this.updateAttempts = 0;
    localStorage.removeItem('pwa-update-attempts');
    localStorage.removeItem('pwa-last-update-attempt');
    
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
    this.updateAttempts = 0;
    this.lastSuccessfulUpdate = 0;
    localStorage.removeItem('pwa-update-attempts');
    localStorage.removeItem('pwa-last-update-attempt');
    localStorage.removeItem('pwa-updating-to-version');
    console.log('Force reset completed');
  }

  // Get update status for debugging
  getUpdateStatus(): object {
    return {
      currentVersion: this.currentVersion,
      lastKnownServerVersion: this.lastKnownServerVersion,
      updateInProgress: this.updateInProgress,
      updateAttempts: this.updateAttempts,
      lastSuccessfulUpdate: this.lastSuccessfulUpdate,
      processedVersions: [...this.sessionProcessedVersions]
    };
  }
}

export const pwaVersionService = new PWAVersionService();
