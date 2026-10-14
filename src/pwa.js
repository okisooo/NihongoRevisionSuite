import { registerSW } from 'virtual:pwa-register';

// Registers the offline service worker on the hosted site and calls onNeedRefresh
// with an update function when a new version has been deployed.
// Electron loads the app from file://, where service workers don't apply.
export function setupPwa(onNeedRefresh) {
  if (!('serviceWorker' in navigator) || !location.protocol.startsWith('http')) return;

  const updateSW = registerSW({
    onNeedRefresh: () => onNeedRefresh(() => updateSW(true)),
    onRegisteredSW(_url, registration) {
      if (!registration) return;
      // Check for a new deploy whenever the app comes back to the foreground, and hourly.
      const check = () => registration.update().catch(() => {});
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') check();
      });
      setInterval(check, 60 * 60 * 1000);
    },
  });
}
