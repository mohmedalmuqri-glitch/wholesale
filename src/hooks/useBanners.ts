import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { fetchBanners } from '@/lib/db';
import type { AppBanner, BannerId } from '@/types';

const BANNER_CACHE_KEY = 'shouub_banners_v1';

type BannerMap = Partial<Record<BannerId, AppBanner>>;

function readCache(): BannerMap | null {
  try {
    const raw = localStorage.getItem(BANNER_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as BannerMap;
  } catch {
    return null;
  }
}

function writeCache(map: BannerMap) {
  try {
    localStorage.setItem(BANNER_CACHE_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

export function useBanners(): {
  banners: BannerMap;
  loading: boolean;
  refresh: () => Promise<void>;
} {
  const [banners, setBanners] = useState<BannerMap>(() => readCache() ?? {});
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const rows = await fetchBanners();
      const map: BannerMap = {};
      for (const r of rows) map[r.id] = r;
      setBanners(map);
      writeCache(map);
    } catch {
      // keep cached/fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const channel = supabase
      .channel('banners-rt')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'app_banners' },
        () => refresh()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [refresh]);

  return { banners, loading, refresh };
}
