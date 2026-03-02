import { offlineApi } from './offlineApi';

class BackgroundSyncService {
  private syncInterval: NodeJS.Timeout | null = null;
  private isRunning = false;

  // Start background sync with configurable interval (default: 5 minutes)
  start(intervalMinutes: number = 5): void {
    if (this.isRunning) {
      console.log('Background sync already running');
      return;
    }

    this.isRunning = true;
    console.log(`Starting background sync every ${intervalMinutes} minutes`);

    // Initial sync
    this.performSync();

    // Set up periodic sync
    this.syncInterval = setInterval(() => {
      this.performSync();
    }, intervalMinutes * 60 * 1000);
  }

  // Stop background sync
  stop(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    this.isRunning = false;
    console.log('Background sync stopped');
  }

  // Perform a single sync operation
  private async performSync(): Promise<void> {
    if (!navigator.onLine) {
      console.log('Skipping background sync - offline');
      return;
    }

    try {
      console.log('Performing background sync...');

      // Sync pending changes
      await offlineApi.syncAll();

      // Refresh critical data
      await this.refreshCriticalData();

      console.log('Background sync completed successfully');
    } catch (error) {
      console.error('Background sync failed:', error);
    }
  }

  // Refresh critical data in the background
  private async refreshCriticalData(): Promise<void> {
    try {
      // We don't have easy access to user role here without passing it or storing it
      // For now, let's just make sure we only fetch what's generally allowed or handle 403s
      const refreshPromises = [
        offlineApi.get('/cases?limit=100').catch(err => console.warn('Failed to refresh cases:', err)),
      ];

      // Only attempt students if likely to have permission (we could check a global state if available)
      // For safety, let's just use the offlineApi's internal role-aware logic if we refactored it that way,
      // but here we are calling .get() directly.

      await Promise.allSettled(refreshPromises);
      console.log('Critical data refreshed');
    } catch (error) {
      console.error('Failed to refresh critical data:', error);
    }
  }

  // Get sync status
  isActive(): boolean {
    return this.isRunning;
  }

  // Force immediate sync
  async forceSync(): Promise<void> {
    console.log('Forcing immediate sync...');
    await this.performSync();
  }
}

// Export singleton instance
export const backgroundSync = new BackgroundSyncService();
export default backgroundSync; 