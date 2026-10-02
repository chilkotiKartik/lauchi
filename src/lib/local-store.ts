"use client";
import { useCallback, useSyncExternalStore } from "react";

/** A tiny persisted value (localStorage) that is safe when storage is blocked and never causes a hydration mismatch. */
export function useLocalJson<T>(key: string, fallback: T): [T, (next: T) => void] {
  const subscribe = useCallback((cb: () => void) => {
    window.addEventListener("storage", cb); window.addEventListener(`local:${key}`, cb);
    return () => { window.removeEventListener("storage", cb); window.removeEventListener(`local:${key}`, cb); };
  }, [key]);
  const raw = useSyncExternalStore(subscribe, () => { try { return localStorage.getItem(key); } catch { return null; } }, () => null);
  let value = fallback;
  if (raw) { try { value = JSON.parse(raw) as T; } catch { /* keep fallback */ } }
  const set = useCallback((next: T) => {
    try { localStorage.setItem(key, JSON.stringify(next)); } catch { /* private mode: it just will not persist */ }
    window.dispatchEvent(new Event(`local:${key}`));
  }, [key]);
  return [value, set];
}
