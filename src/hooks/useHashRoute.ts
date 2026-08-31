import { useEffect, useState } from 'react';

/** A tiny hash-based router supporting `/` and `/admin`. */
export function useHashRoute() {
  const [route, setRoute] = useState(() => normalize(window.location.hash));

  useEffect(() => {
    const onHash = () => setRoute(normalize(window.location.hash));
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  return route;
}

function normalize(hash: string): 'store' | 'admin' {
  const clean = hash.replace(/^#\/?/, '').toLowerCase();
  return clean.startsWith('admin') ? 'admin' : 'store';
}

export function navigate(to: 'store' | 'admin') {
  window.location.hash = to === 'admin' ? '/admin' : '/';
}
