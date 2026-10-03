import { supabase } from '@/lib/supabase';
import type { OfferCategory, Product } from '@/types';

const OFFER_PRODUCT_FIELDS = 'id,name,category_id,price,image,description,full_carton_units,half_carton_enabled,half_carton_price,half_carton_units,stock,is_offer,offer_category_id,discount_percentage,old_price,created_at';

export async function insertOfferCategory(name: string): Promise<OfferCategory | null> {
  const { data, error } = await supabase
    .from('offer_categories')
    .insert({ name: name.trim() })
    .select('id,name,created_at')
    .maybeSingle();
  if (error) throw error;
  return data as OfferCategory | null;
}

export async function updateOfferCategory(id: string, name: string): Promise<void> {
  const { error } = await supabase
    .from('offer_categories')
    .update({ name: name.trim() })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteOfferCategory(id: string): Promise<void> {
  const { error } = await supabase.from('offer_categories').delete().eq('id', id);
  if (error) throw error;
}

export async function insertOfferProduct(data: {
  name: string;
  image: string;
  offerCategoryId: string;
  discountPercentage: number;
  oldPrice: number;
  price: number;
}): Promise<Product | null> {
  const { data: row, error } = await supabase
    .from('products')
    .insert({
      name: data.name.trim(),
      image: data.image,
      price: data.price,
      old_price: data.oldPrice,
      discount_percentage: data.discountPercentage,
      is_offer: true,
      offer_category_id: data.offerCategoryId,
      description: '',
      category_id: null,
      full_carton_units: null,
      half_carton_enabled: false,
      half_carton_price: null,
      half_carton_units: null,
      stock: 0,
    })
    .select(OFFER_PRODUCT_FIELDS)
    .maybeSingle();
  if (error) throw error;
  return row as Product | null;
}

export async function updateOfferProduct(id: string, data: {
  name: string;
  image: string;
  offerCategoryId: string;
  discountPercentage: number;
  oldPrice: number;
  price: number;
}): Promise<void> {
  const { error } = await supabase
    .from('products')
    .update({
      name: data.name.trim(),
      image: data.image,
      price: data.price,
      old_price: data.oldPrice,
      discount_percentage: data.discountPercentage,
      is_offer: true,
      offer_category_id: data.offerCategoryId,
    })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteOfferProduct(id: string): Promise<void> {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
}
