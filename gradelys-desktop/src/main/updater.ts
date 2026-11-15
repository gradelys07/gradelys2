import { app, dialog, Notification } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log/main';

const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours
let intervalHandle: NodeJS.Timeout | null = null;
let manualCheckRequested = false;

export function setupAutoUpdater(): void {
  if (!app.isPackaged) {
    log.info('Auto-updater disabled in development mode');
    return;
  }

  autoUpdater.logger = log;
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('update-available', (info) => {
    log.info(`Update available: ${info.version}`);
    if (manualCheckRequested) {
      manualCheckRequested = false;
      void dialog.showMessageBox({
        type: 'info',
        title: 'Mise à jour disponible',
        message: `Gradelys ${info.version} est en cours de téléchargement en arrière-plan.`,
        buttons: ['OK'],
      });
    }
  });

  autoUpdater.on('update-not-available', () => {
    if (manualCheckRequested) {
      manualCheckRequested = false;
      void dialog.showMessageBox({
        type: 'info',
        title: 'Aucune mise à jour',
        message: `Tu utilises déjà la dernière version de Gradelys (${app.getVersion()}).`,
        buttons: ['OK'],
      });
    }
  });

  autoUpdater.on('error', (err) => {
    log.warn('Auto-updater error:', err.message);
    if (manualCheckRequested) {
      manualCheckRequested = false;
      void dialog.showMessageBox({
        type: 'warning',
        title: 'Erreur de mise à jour',
        message: 'Impossible de vérifier les mises à jour pour le moment.',
        buttons: ['OK'],
      });
    }
  });

  autoUpdater.on('update-downloaded', () => {
    log.info('Update downloaded and ready to install');
    if (Notification.isSupported()) {
      const notif = new Notification({
        title: 'Gradelys',
        body: 'Mise à jour prête — Redémarrer pour appliquer',
      });
      notif.on('click', () => {
        autoUpdater.quitAndInstall();
      });
      notif.show();
    }

    void dialog
      .showMessageBox({
        type: 'info',
        title: 'Mise à jour prête',
        message: 'Mise à jour prête — Redémarrer',
        detail: 'Une nouvelle version de Gradelys a été téléchargée.',
        buttons: ['Redémarrer maintenant', 'Plus tard'],
        defaultId: 0,
      })
      .then(({ response }) => {
        if (response === 0) {
          autoUpdater.quitAndInstall();
        }
      });
  });

  setTimeout(() => {
    void autoUpdater.checkForUpdates().catch((err) => {
      log.warn('Initial update check failed:', err instanceof Error ? err.message : String(err));
    });
  }, 5000);

  intervalHandle = setInterval(() => {
    void autoUpdater.checkForUpdates().catch((err) => {
      log.warn('Periodic update check failed:', err instanceof Error ? err.message : String(err));
    });
  }, CHECK_INTERVAL_MS);
}

export function checkForUpdatesManually(): void {
  if (!app.isPackaged) {
    void dialog.showMessageBox({
      type: 'info',
      title: 'Mises à jour',
      message: 'Les mises à jour automatiques sont désactivées en mode développement.',
      buttons: ['OK'],
    });
    return;
  }

  manualCheckRequested = true;
  void autoUpdater.checkForUpdates().catch((err) => {
    manualCheckRequested = false;
    log.warn('Manual update check failed:', err instanceof Error ? err.message : String(err));
  });
}

export function stopAutoUpdater(): void {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
}

