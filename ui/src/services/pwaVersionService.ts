
import { backendApi } from '@/lib/api/client';

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
  private readonly UPDATE_SESSION_COOLDOWN = 60000; // 1 minute per session

  constructor() {
    this.currentVersion = this.getStoredVersion();
    this.loadSessionProcessedVersions();
    this.checkForCompletedUpdate();
    this.resetUpdateAttemptsIfNeeded();
    // console.log('PWAVersionService initialized with version:', this.currentVersion);
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
      // console.log('Version stored and updated successfully:', version);
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
    // console.log('Marked version as processed:', version);
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
        // console.log('Detected completed update to target version:', targetVersion);
        
        // CRITICAL FIX: Update current version to target version
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
        
        // console.log('✅ Update completion processed - current version now:', this.currentVersion);
        return;
      }

      // Additional check: if we don't have a current version, set a default
      if (!this.currentVersion) {
        const defaultVersion = 'v1.0.0';
        this.setStoredVersion(defaultVersion);
        // console.log('Set default version:', defaultVersion);
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

      // console.log('Checking server version...');
      
      const { data, error } = await backendApi.functions.invoke('app-version');
      
      if (error) {
        console.error('Failed to check server version:', error);
        return null;
      }

      // console.log('Server responded with:', data);
      return data as ServerVersionInfo;
    } catch (error) {
      console.error('Error checking server version:', error);
      return null;
    }
  }

  async shouldForceUpdate(): Promise<boolean> {
    // Circuit breaker: prevent infinite update loops
    if (this.updateAttempts >= this.MAX_UPDATE_ATTEMPTS) {
      // console.log('❌ Maximum update attempts reached, preventing further updates');
      return false;
    }

    // Don't check if update is already in progress
    if (this.updateInProgress) {
      // console.log('Update already in progress, skipping check');
      return false;
    }

    // Cooldown after successful update
    const now = Date.now();
    if (this.lastSuccessfulUpdate > 0 && (now - this.lastSuccessfulUpdate) < this.UPDATE_COOLDOWN) {
      // console.log('Update cooldown active, skipping check');
      return false;
    }

    const serverInfo = await this.checkServerVersion();
    
    if (!serverInfo) {
      return false;
    }

    // console.log('🔍 Version comparison:', {
    //   serverVersion: serverInfo.version,
    //   currentVersion: this.currentVersion,
    //   lastKnownServerVersion: this.lastKnownServerVersion,
    //   forceUpdate: serverInfo.forceUpdate,
    //   processedThisSession: this.isVersionProcessedThisSession(serverInfo.version),
    //   updateAttempts: this.updateAttempts
    // });

    // Don't process the same version again in this session
    if (this.isVersionProcessedThisSession(serverInfo.version)) {
      // console.log('✅ Version already processed this session:', serverInfo.version);
      return false;
    }

    // CRITICAL FIX: Exact version match check
    if (this.currentVersion === serverInfo.version) {
      // console.log('✅ Already on latest version:', serverInfo.version);
      this.markVersionAsProcessed(serverInfo.version);
      this.lastKnownServerVersion = serverInfo.version;
      return false;
    }

    // Only update if there's a real version difference and we haven't processed it
    if (this.currentVersion && this.currentVersion !== serverInfo.version) {
      // console.log('🚀 Version mismatch detected - update needed:', {
      //   from: this.currentVersion,
      //   to: serverInfo.version
      // });
      this.lastKnownServerVersion = serverInfo.version;
      return true;
    }

    // First time setup: set current version from server if we don't have one
    if (!this.currentVersion && serverInfo.version) {
      // console.log('📝 Setting initial version from server:', serverInfo.version);
      this.setStoredVersion(serverInfo.version);
      this.lastKnownServerVersion = serverInfo.version;
      this.markVersionAsProcessed(serverInfo.version);
      return false;
    }

    return false;
  }

  startUpdate(targetVersion: string): void {
    // console.log('🚀 Starting update to version:', targetVersion);
    this.updateInProgress = true;
    this.recordUpdateAttempt();
    this.markVersionAsProcessed(targetVersion);
    
    // Store the target version we're updating to
    try {
      localStorage.setItem('pwa-updating-to-version', targetVersion);
      // console.log('📝 Stored target version for update:', targetVersion);
    } catch (error) {
      console.error('Failed to store target version:', error);
    }
  }

  updateCurrentVersion(version: string): void {
    // console.log('✅ Manually updating current version to:', version);
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
  }

  getCurrentVersion(): string | null {
    return this.currentVersion;
  }

  resetUpdateState(): void {
    // console.log('🔄 Resetting update state...');
    this.checkForCompletedUpdate();
    
    // Only reset if we're not in the middle of an update
    if (!localStorage.getItem('pwa-updating-to-version')) {
      this.lastKnownServerVersion = this.currentVersion;
      this.updateInProgress = false;
    }
    
    // console.log('Update state reset - current version:', this.currentVersion);
  }

  isUpdateInProgress(): boolean {
    return this.updateInProgress;
  }

  // Emergency reset for debugging
  forceReset(): void {
    // console.log('🆘 Emergency reset triggered');
    this.sessionProcessedVersions.clear();
    this.saveSessionProcessedVersions();
    this.updateInProgress = false;
    this.lastKnownServerVersion = null;
    this.updateAttempts = 0;
    this.lastSuccessfulUpdate = 0;
    localStorage.removeItem('pwa-update-attempts');
    localStorage.removeItem('pwa-last-update-attempt');
    localStorage.removeItem('pwa-updating-to-version');
    // console.log('Emergency reset completed');
  }

  getUpdateStatus(): object {
    return {
      currentVersion: this.currentVersion,
      lastKnownServerVersion: this.lastKnownServerVersion,
      updateInProgress: this.updateInProgress,
      updateAttempts: this.updateAttempts,
      lastSuccessfulUpdate: this.lastSuccessfulUpdate,
      processedVersions: [...this.sessionProcessedVersions],
      hasUpdateMarker: !!localStorage.getItem('pwa-updating-to-version')
    };
  }
}

export const pwaVersionService = new PWAVersionService();
