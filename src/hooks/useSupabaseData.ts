import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { mapCategory, mapOfferCategory, mapProduct } from '@/lib/mappers';
import type { Category, OfferCategory, Product } from '@/types';

const CACHE_KEY = 'tajeri_data_cache_v2';
const CACHE_TTL_MS = 5 * 60 * 1000;

type CachedData = {
  categories: Category[];
  offerCategories: OfferCategory[];
  products: Product[];
  timestamp: number;
};

type DataState = {
  categories: Category[];
  offerCategories: OfferCategory[];
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

function writeCache(categories: Category[], offerCategories: OfferCategory[], products: Product[]): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ categories, offerCategories, products, timestamp: Date.now() }));
  } catch {
    // Cache is optional.
  }
}

export function useSupabaseData(): DataState {
  const [categories, setCategories] = useState<Category[]>([]);
  const [offerCategories, setOfferCategories] = useState<OfferCategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const didInit = useRef(false);

  const refresh = useCallback(async () => {
    try {
      const [catRes, offerCatRes, prodRes] = await Promise.all([
        supabase
          .from('categories')
          .select('id,name,color,created_at')
          .order('created_at', { ascending: true }),
        supabase
          .from('offer_categories')
          .select('id,name,created_at')
          .order('created_at', { ascending: true }),
        supabase
          .from('products')
          .select('id,name,category_id,price,image,description,full_carton_units,half_carton_enabled,half_carton_price,half_carton_units,stock,is_offer,offer_category_id,discount_percentage,old_price,created_at')
          .order('created_at', { ascending: false }),
      ]);

      if (catRes.error) throw catRes.error;
      if (offerCatRes.error) throw offerCatRes.error;
      if (prodRes.error) throw prodRes.error;

      const cats = (catRes.data ?? []).map((row) => mapCategory(row as Record<string, unknown>));
      const offerCats = (offerCatRes.data ?? []).map((row) => mapOfferCategory(row as Record<string, unknown>));
      const prods = (prodRes.data ?? []).map((row) => mapProduct(row as Record<string, unknown>));

      setCategories(cats);
      setOfferCategories(offerCats);
      setProducts(prods);
      writeCache(cats, offerCats, prods);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر تحميل البيانات');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const cached = readCache();
    if (cached) {
      setCategories(cached.categories);
      setOfferCategories(cached.offerCategories ?? []);
      setProducts(cached.products);
      setLoading(false);
    }

    if (didInit.current) return;
    didInit.current = true;
    refresh();

    const channel = supabase
      .channel('tajeri-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'offer_categories' }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, refresh)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refresh]);

  return { categories, offerCategories, products, loading, error, refresh };
}
