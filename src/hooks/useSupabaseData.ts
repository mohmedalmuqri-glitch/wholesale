import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { mapCategory, mapProduct } from '@/lib/mappers';
import type { Category, Product } from '@/types';

const CACHE_KEY = 'tajeri_data_cache_v1';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

type CachedData = {
  categories: Category[];
  products: Product[];
  timestamp: number;
};

type DataState = {
  categories: Category[];
  products: Product[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

function readCache(): CachedData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedData;
    if (Date.now() - parsed.timestamp > CACHE_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(categories: Category[], products: Product[]) {
  try {
    const payload: CachedData = { categories, products, timestamp: Date.now() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch {
    // ignore quota errors
  }
}

/** Loads categories + products from Supabase with instant cache-first rendering. */
export function useSupabaseData(): DataState {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const didInit = useRef(false);

  const refresh = useCallback(async () => {
    try {
      const [catRes, prodRes] = await Promise.all([
        supabase
          .from('categories')
          .select('id,name,color,created_at')
          .order('created_at', { ascending: true }),
        supabase
          .from('products')
          .select(
            'id,name,category_id,price,image,description,full_carton_units,half_carton_enabled,half_carton_price,half_carton_units,stock,created_at'
          )
          .order('created_at', { ascending: false }),
      ]);

      if (catRes.error) throw catRes.error;
      if (prodRes.error) throw prodRes.error;

      const cats = (catRes.data ?? []).map((r) => mapCategory(r as Record<string, unknown>));
      const prods = (prodRes.data ?? []).map((r) => mapProduct(r as Record<string, unknown>));

      setCategories(cats);
      setProducts(prods);
      writeCache(cats, prods);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر تحميل البيانات');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Cache-first: show cached data instantly, then fetch fresh data in background
    const cached = readCache();
    if (cached) {
      setCategories(cached.categories);
      setProducts(cached.products);
      setLoading(false);
    }

    if (didInit.current) return;
    didInit.current = true;

    refresh();

    const channel = supabase
      .channel('tajeri-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
        refresh();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        refresh();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refresh]);

  return { categories, products, loading, error, refresh };
}
