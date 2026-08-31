import type { Product } from '@/types';

/** Returns the unit price for a given cart unit. */
export function unitPrice(product: Product, unit: 'full' | 'half'): number {
  if (unit === 'half') {
    return product.half_carton_enabled ? product.half_carton_price ?? 0 : 0;
  }
  return product.price;
}

/** Returns the display label for a cart unit. */
export function unitLabel(product: Product, unit: 'full' | 'half'): string {
  if (unit === 'half') {
    const n = product.half_carton_units;
    return n ? `نصف كرتون (${n} حبة)` : 'نصف كرتون';
  }
  const n = product.full_carton_units;
  return n ? `كرتون كامل (${n} حبة)` : 'كرتون كامل';
}
