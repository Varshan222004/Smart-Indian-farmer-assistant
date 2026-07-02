// Service Worker Registration using vite-plugin-pwa
import { registerSW } from 'virtual:pwa-register';

export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    const updateSW = registerSW({
      immediate: true,
      onNeedRefresh() {
        // New service worker available
        if (confirm('New version available! Reload to update?')) {
          updateSW(true);
        }
      },
      onOfflineReady() {
        console.log('App ready to work offline');
      },
      onRegistered(registration) {
        console.log('Service Worker registered:', registration);
        // Check for updates every hour
        setInterval(() => {
          registration?.update();
        }, 60 * 60 * 1000);
      },
      onRegisterError(error) {
        console.error('Service Worker registration error:', error);
      }
    });
  }
}

