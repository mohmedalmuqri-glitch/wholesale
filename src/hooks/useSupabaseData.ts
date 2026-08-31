import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { mapCategory, mapProduct } from '@/lib/mappers';
import type { Category, Product } from '@/types';

type DataState = {
  categories: Category[];
  products: Product[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

/** Loads categories + products from Supabase and subscribes to Realtime updates. */
export function useSupabaseData(): DataState {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [catRes, prodRes] = await Promise.all([
        supabase.from('categories').select('*').order('created_at', { ascending: true }),
        supabase.from('products').select('*').order('created_at', { ascending: false }),
      ]);

      if (catRes.error) throw catRes.error;
      if (prodRes.error) throw prodRes.error;

      setCategories((catRes.data ?? []).map((r) => mapCategory(r as Record<string, unknown>)));
      setProducts((prodRes.data ?? []).map((r) => mapProduct(r as Record<string, unknown>)));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر تحميل البيانات');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
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
