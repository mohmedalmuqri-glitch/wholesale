import type { Category, OfferCategory, Product } from '@/types';

/** Maps a database product row to the frontend Product type (numeric coercion). */
export function mapProduct(row: Record<string, unknown>): Product {
  return {
    id: String(row.id),
    name: String(row.name ?? ''),
    category_id: row.category_id ? String(row.category_id) : null,
    price: Number(row.price ?? 0),
    image: String(row.image ?? ''),
    description: String(row.description ?? ''),
    full_carton_units: row.full_carton_units != null ? Number(row.full_carton_units) : null,
    half_carton_enabled: Boolean(row.half_carton_enabled ?? false),
    half_carton_price: row.half_carton_price != null ? Number(row.half_carton_price) : null,
    half_carton_units: row.half_carton_units != null ? Number(row.half_carton_units) : null,
    stock: Number(row.stock ?? 0),
    is_offer: Boolean(row.is_offer ?? false),
    offer_category_id: row.offer_category_id ? String(row.offer_category_id) : null,
    discount_percentage: Number(row.discount_percentage ?? 0),
    old_price: row.old_price != null ? Number(row.old_price) : null,
    created_at: String(row.created_at ?? ''),
  };
}

/** Maps a database category row to the frontend Category type. */
export function mapOfferCategory(row: Record<string, unknown>): OfferCategory {
  return {
    id: String(row.id),
    name: String(row.name ?? ''),
    created_at: String(row.created_at ?? ''),
  };
}

export function mapCategory(row: Record<string, unknown>): Category {
  return {
    id: String(row.id),
    name: String(row.name ?? ''),
    color: row.color ? String(row.color) : '#059669',
    created_at: String(row.created_at ?? ''),
  };
}
