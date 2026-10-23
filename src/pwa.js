import { registerSW } from 'virtual:pwa-register';

// Registers the offline service worker on the hosted site and calls onNeedRefresh
// with an update function when a new version has been deployed.
// Electron loads the app from file://, where service workers don't apply.
export function setupPwa(onNeedRefresh) {
  if (!('serviceWorker' in navigator) || !location.protocol.startsWith('http')) return;

  let active = true;
  let interval;
  let check;
  const onVisible = () => {
    if (document.visibilityState === 'visible') check?.();
  };
  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh: () => {
      if (active) onNeedRefresh(() => updateSW(true));
    },
    onRegisteredSW(_url, registration) {
      if (!registration || !active) return;
      // Check for a new deploy whenever the app comes back to the foreground, and hourly.
      check = () => registration.update().catch(() => {});
      document.addEventListener('visibilitychange', onVisible);
      interval = setInterval(check, 60 * 60 * 1000);
    },
  });
  return () => {
    active = false;
    document.removeEventListener('visibilitychange', onVisible);
    clearInterval(interval);
  };
}
