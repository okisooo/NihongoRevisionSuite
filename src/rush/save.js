import { useEffect, useRef, useState } from "react";
import { updateProgress } from "../study/store";
import { applyRun, rushOf } from "./mastery";

export function useSave() {
  const [error, setError] = useState("");
  const save = async (change) => {
    try {
      await updateProgress(change);
      setError("");
      return true;
    } catch {
      setError("Progress could not be saved. Free some device storage and try again.");
      return false;
    }
  };
  return [save, error];
}

/** Runs applyRun inside the store queue and hands back what it reported. */
export async function saveRun(save, run, options) {
  let report = null;
  const ok = await save((p) => {
    report = applyRun(p, run, Date.now(), options);
    return report.progress;
  });
  return ok ? report : null;
}

/** Single-key shortcuts (enter, d, ...) while no control has focus. */
export function useKeys(handlers) {
  const ref = useRef(handlers);
  useEffect(() => {
    ref.current = handlers;
  });
  useEffect(() => {
    const onKey = (event) => {
      if (event.target.closest?.("input, textarea, select, button, a, summary")) return;
      const action = ref.current[event.key.toLowerCase()];
      if (action) {
        event.preventDefault();
        action();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}

/** Saves part of the practice settings (prompt kinds, source, sound...). */
export function setRushSettings(save, change) {
  return save((p) => {
    const current = rushOf(p);
    return { ...p, rush: { ...current, settings: { ...current.settings, ...change } } };
  });
}
