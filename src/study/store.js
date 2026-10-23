import { useSyncExternalStore } from "react";
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { STORAGE_KEY } from './progress';
import { createProgressStore } from './progressStore';

const native = Capacitor.isNativePlatform();
const store = createProgressStore({
  read: async () => native
    ? (await Preferences.get({ key: STORAGE_KEY })).value
    : localStorage.getItem(STORAGE_KEY),
  write: (value) => native
    ? Preferences.set({ key: STORAGE_KEY, value })
    : localStorage.setItem(STORAGE_KEY, value),
  readLegacy: () => localStorage.getItem('weak_kanji_ids'),
});
export const initializeProgress = () => store.initialize();
export const getRawProgress = () => store.getRaw();
export function useProgress() {
  return useSyncExternalStore(store.subscribe, store.getSnapshot);
}
export function getWarning() {
  return store.getWarning();
}
export function updateProgress(change) {
  return store.update(change);
}
window.addEventListener("storage", (event) => {
  if (!native && event.key === STORAGE_KEY) store.receive(event.newValue);
});
