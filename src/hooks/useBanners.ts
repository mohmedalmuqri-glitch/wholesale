import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { fetchBanners } from '@/lib/db';
import type { AppBanner, BannerId } from '@/types';

const BANNER_CACHE_KEY = 'shouub_banner_slides_v1';
type BannerMap = Record<BannerId, AppBanner[]>;
const EMPTY_BANNERS: BannerMap = { home: [], offers: [] };

function readCache(): BannerMap {
  try {
    const raw = localStorage.getItem(BANNER_CACHE_KEY);
    if (!raw) return EMPTY_BANNERS;
    const parsed = JSON.parse(raw) as Partial<BannerMap>;
    return { home: parsed.home ?? [], offers: parsed.offers ?? [] };
  } catch {
    return EMPTY_BANNERS;
  }
}

function writeCache(map: BannerMap): void {
  try {
    localStorage.setItem(BANNER_CACHE_KEY, JSON.stringify(map));
  } catch {
    // Cache is optional.
  }
}

function groupBanners(rows: AppBanner[]): BannerMap {
  return {
    home: rows.filter((row) => row.placement === 'home' && row.is_active),
    offers: rows.filter((row) => row.placement === 'offers' && row.is_active),
  };
}

export function useBanners(): {
  banners: BannerMap;
  loading: boolean;
  refresh: () => Promise<void>;
} {
  const [banners, setBanners] = useState<BannerMap>(() => readCache());
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const map = groupBanners(await fetchBanners());
      setBanners(map);
      writeCache(map);
    } catch {
      // Keep cached slides when the network is unavailable.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const channel = supabase
      .channel('banner-slides-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_banner_slides' }, refresh)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [refresh]);

  return { banners, loading, refresh };
}
