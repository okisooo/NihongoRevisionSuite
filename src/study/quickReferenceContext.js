import { createContext, useContext, useEffect, useRef } from "react";

export const QuickReferenceContext = createContext(null);
export const useQuickReference = () => useContext(QuickReferenceContext);

// Read the latest local target without rerendering its parent on every frame.
export function useReferenceTarget(ids, options = {}) {
  const { register } = useQuickReference();
  const latest = useRef();
  useEffect(() => { latest.current = { ids, ...options }; });
  useEffect(() => register(() => latest.current), [register]);
}
