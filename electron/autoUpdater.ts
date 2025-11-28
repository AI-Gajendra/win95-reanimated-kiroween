/**
 * Auto-Updater Module
 * 
 * Handles automatic application updates using electron-updater.
 * Checks for updates on launch and notifies users when updates are available.
 * Never forces updates - user consent is always required.
 * 
 * @requirements 12.1, 12.2, 12.3, 12.4, 12.5
 */

import pkg from 'electron-updater';
const { autoUpdater } = pkg;
import type { UpdateInfo, ProgressInfo } from 'electron-updater';
import { BrowserWindow, dialog, Notification } from 'electron';
import log from 'electron-log';

// Configure logging for auto-updater
autoUpdater.logger = log;
log.transports.file.level = 'info';

/**
 * AutoUpdaterManager handles all auto-update functionality.
 * It checks for updates, notifies users, and manages the download/install process.
 */
export class AutoUpdaterManager {
  private mainWindow: BrowserWindow | null = null;
  private updateAvailable: boolean = false;
  private updateDownloaded: boolean = false;
  private updateInfo: UpdateInfo | null = null;

  constructor() {
    this.setupAutoUpdater();
  }

  /**
   * Set the main window reference for sending update notifications.
   * @param window - The main BrowserWindow instance
   */
  setMainWindow(window: BrowserWindow | null): void {
    this.mainWindow = window;
  }

  /**
   * Configure auto-updater settings and event handlers.
   * @requirements 12.5 - Never force updates without user consent
   */
  private setupAutoUpdater(): void {
    // Disable auto-download - we want user consent first
    // @requirements 12.5
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = false;

    // Set up event handlers
    autoUpdater.on('checking-for-update', () => {
      log.info('[AutoUpdater] Checking for updates...');
      this.sendStatusToWindow('checking-for-update');
    });

    autoUpdater.on('update-available', (info: UpdateInfo) => {
      log.info('[AutoUpdater] Update available:', info.version);
      this.updateAvailable = true;
      this.updateInfo = info;
      this.sendStatusToWindow('update-available', info);
      this.showUpdateNotification(info);
    });

    autoUpdater.on('update-not-available', (info: UpdateInfo) => {
      log.info('[AutoUpdater] No updates available. Current version:', info.version);
      this.updateAvailable = false;
      this.sendStatusToWindow('update-not-available', info);
    });

    autoUpdater.on('error', (err: Error) => {
      log.error('[AutoUpdater] Error:', err.message);
      this.sendStatusToWindow('error', { message: err.message });
    });

    autoUpdater.on('download-progress', (progressObj: ProgressInfo) => {
      const logMessage = `Download speed: ${progressObj.bytesPerSecond} - Downloaded ${progressObj.percent.toFixed(2)}%`;
      log.info('[AutoUpdater]', logMessage);
      this.sendStatusToWindow('download-progress', progressObj);
    });

    autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
      log.info('[AutoUpdater] Update downloaded:', info.version);
      this.updateDownloaded = true;
      this.sendStatusToWindow('update-downloaded', info);
      this.showInstallPrompt(info);
    });
  }

  /**
   * Check for updates on application launch.
   * @requirements 12.1
   */
  async checkForUpdates(): Promise<void> {
    try {
      log.info('[AutoUpdater] Initiating update check...');
      await autoUpdater.checkForUpdates();
    } catch (error) {
      log.error('[AutoUpdater] Failed to check for updates:', error);
    }
  }

  /**
   * Download the available update.
   * Called when user consents to download.
   * @requirements 12.3
   */
  async downloadUpdate(): Promise<void> {
    if (!this.updateAvailable) {
      log.warn('[AutoUpdater] No update available to download');
      return;
    }

    try {
      log.info('[AutoUpdater] Starting update download...');
      await autoUpdater.downloadUpdate();
    } catch (error) {
      log.error('[AutoUpdater] Failed to download update:', error);
      this.showErrorDialog('Failed to download update. Please try again later.');
    }
  }

  /**
   * Install the downloaded update and restart the application.
   * Only called after user explicitly consents.
   * @requirements 12.3, 12.5
   */
  installUpdate(): void {
    if (!this.updateDownloaded) {
      log.warn('[AutoUpdater] No update downloaded to install');
      return;
    }

    log.info('[AutoUpdater] Installing update and restarting...');
    autoUpdater.quitAndInstall(false, true);
  }

  /**
   * Show a notification when an update is available.
   * @param info - Information about the available update
   * @requirements 12.2
   */
  private showUpdateNotification(info: UpdateInfo): void {
    // Check if notifications are supported
    if (!Notification.isSupported()) {
      log.warn('[AutoUpdater] Notifications not supported, using dialog');
      this.showUpdateDialog(info);
      return;
    }

    const notification = new Notification({
      title: 'Update Available',
      body: `Win95 Reanimated ${info.version} is available. Click to download.`,
      icon: undefined // Will use app icon
    });

    notification.on('click', () => {
      this.showUpdateDialog(info);
    });

    notification.show();
  }

  /**
   * Show a dialog asking the user if they want to download the update.
   * @param info - Information about the available update
   * @requirements 12.2, 12.3, 12.5
   */
  private async showUpdateDialog(info: UpdateInfo): Promise<void> {
    const releaseNotes = typeof info.releaseNotes === 'string' 
      ? info.releaseNotes 
      : Array.isArray(info.releaseNotes) 
        ? info.releaseNotes.map(n => typeof n === 'string' ? n : n.note).join('\n')
        : '';

    const result = await dialog.showMessageBox({
      type: 'info',
      title: 'Update Available',
      message: `A new version of Win95 Reanimated is available!`,
      detail: `Version ${info.version} is ready to download.\n\n${releaseNotes ? 'Release Notes:\n' + releaseNotes : ''}`,
      buttons: ['Download Now', 'Later'],
      defaultId: 0,
      cancelId: 1
    });

    if (result.response === 0) {
      this.downloadUpdate();
    }
  }

  /**
   * Show a dialog prompting the user to install the downloaded update.
   * @param info - Information about the downloaded update
   * @requirements 12.3, 12.5
   */
  private async showInstallPrompt(info: UpdateInfo): Promise<void> {
    const result = await dialog.showMessageBox({
      type: 'info',
      title: 'Update Ready',
      message: `Win95 Reanimated ${info.version} has been downloaded.`,
      detail: 'The update will be installed when you restart the application. Would you like to restart now?',
      buttons: ['Restart Now', 'Later'],
      defaultId: 0,
      cancelId: 1
    });

    if (result.response === 0) {
      this.installUpdate();
    }
  }

  /**
   * Show an error dialog for update failures.
   * @param message - The error message to display
   */
  private showErrorDialog(message: string): void {
    dialog.showMessageBox({
      type: 'error',
      title: 'Update Error',
      message: 'Failed to update Win95 Reanimated',
      detail: message,
      buttons: ['OK']
    });
  }

  /**
   * Send update status to the renderer process.
   * @param status - The current update status
   * @param data - Additional data about the update
   */
  private sendStatusToWindow(status: string, data?: unknown): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('update:status', { status, data });
    }
  }

  /**
   * Get the current update state.
   * @returns Object containing update availability and download status
   */
  getUpdateState(): { available: boolean; downloaded: boolean; info: UpdateInfo | null } {
    return {
      available: this.updateAvailable,
      downloaded: this.updateDownloaded,
      info: this.updateInfo
    };
  }
}

// Export a singleton instance
export const autoUpdaterManager = new AutoUpdaterManager();
