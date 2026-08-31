import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * A localStorage-backed state hook that stays in sync across tabs and
 * components via the `storage` event and a same-tab broadcast.
 */
export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });

  const keyRef = useRef(key);
  keyRef.current = key;

  useEffect(() => {
    try {
      localStorage.setItem(keyRef.current, JSON.stringify(value));
    } catch {
      /* storage full or unavailable */
    }
  }, [value]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== keyRef.current) return;
      try {
        const next = e.newValue ? (JSON.parse(e.newValue) as T) : initial;
        setValue(next);
      } catch {
        /* ignore malformed */
      }
    };
    const onLocalSync = (e: Event) => {
      const ev = e as CustomEvent<{ key: string; value: T }>;
      if (ev.detail?.key !== keyRef.current) return;
      setValue(ev.detail.value);
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener('localstorage-sync', onLocalSync as EventListener);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('localstorage-sync', onLocalSync as EventListener);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = useCallback((next: T | ((prev: T) => T)) => {
    setValue((prev) => {
      const resolved = typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
      try {
        localStorage.setItem(keyRef.current, JSON.stringify(resolved));
        window.dispatchEvent(
          new CustomEvent('localstorage-sync', {
            detail: { key: keyRef.current, value: resolved },
          })
        );
      } catch {
        /* ignore */
      }
      return resolved;
    });
  }, []);

  return [value, update] as const;
}
