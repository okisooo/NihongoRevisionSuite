import { emptyProgress, validateProgress } from './progress.js';

// Both browser storage and native storage commit before the interface advances.
export function createProgressStore({ read, write, readLegacy = () => null }) {
  let state = emptyProgress();
  let raw = null;
  let warning = '';
  let initialized = false;
  let pending = Promise.resolve();
  const listeners = new Set();
  const notify = () => listeners.forEach((listener) => listener());

  function decode(value) {
    raw = value;
    try {
      state = value ? validateProgress(JSON.parse(value)) : emptyProgress();
      warning = '';
    } catch {
      state = emptyProgress();
      warning = 'Saved progress could not be read. Export the original backup before continuing; new changes will replace the unreadable record.';
    }
  }

  return {
    async initialize() {
      // A failed storage read must not turn into a fresh, writable empty record.
      decode(await read());
      if (!raw) {
        try {
          const weak = JSON.parse(readLegacy() || '[]');
          if (Array.isArray(weak)) for (const id of weak) {
            if (Number.isInteger(id) && id >= 1 && id <= 300) {
              state.cards[`character:${id}:meaning`] = {
                attempts: 1, misses: 1, streak: 0, due: 0, lastReviewed: 0,
              };
            }
          }
        } catch { /* The optional legacy list must not block valid progress. */ }
      }
      initialized = true;
    },
    getSnapshot: () => state,
    getWarning: () => warning,
    getRaw: () => raw,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    update(change) {
      const operation = pending.then(async () => {
        if (!initialized) throw new Error('Progress has not loaded.');
        const next = typeof change === 'function' ? change(state) : change;
        if (next === state) return;
        const value = JSON.stringify(next);
        await write(value);
        state = next;
        raw = value;
        warning = '';
        notify();
      });
      // A failed save is reported to its caller but cannot poison later retries.
      pending = operation.catch(() => {});
      return operation;
    },
    receive(value) {
      decode(value);
      notify();
    },
  };
}
