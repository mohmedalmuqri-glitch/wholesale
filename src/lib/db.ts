import { supabase } from '@/lib/supabase';
import type { AppBanner, AppSettings, BannerId, Category, Customer, Delegate, GeographicZone, Order, OrderItem, OrderStatus, PaymentMethod, Product } from '@/types';

/* ---------------- Products ---------------- */

export async function insertProduct(
  data: Omit<Product, 'id' | 'created_at'>
): Promise<Product | null> {
  const { data: row, error } = await supabase
    .from('products')
    .insert({
      name: data.name,
      category_id: data.category_id || null,
      price: data.price,
      image: data.image,
      description: data.description,
      full_carton_units: data.full_carton_units ?? null,
      half_carton_enabled: data.half_carton_enabled,
      half_carton_price: data.half_carton_price ?? null,
      half_carton_units: data.half_carton_units ?? null,
      stock: data.stock,
    })
    .select('*')
    .maybeSingle();

  if (error) throw error;
  return row as Product | null;
}

export async function updateProduct(
  id: string,
  data: Omit<Product, 'id' | 'created_at'>
): Promise<Product | null> {
  const { data: row, error } = await supabase
    .from('products')
    .update({
      name: data.name,
      category_id: data.category_id || null,
      price: data.price,
      image: data.image,
      description: data.description,
      full_carton_units: data.full_carton_units ?? null,
      half_carton_enabled: data.half_carton_enabled,
      half_carton_price: data.half_carton_price ?? null,
      half_carton_units: data.half_carton_units ?? null,
      stock: data.stock,
    })
    .eq('id', id)
    .select('*')
    .maybeSingle();

  if (error) throw error;
  return row as Product | null;
}

export async function insertProductsBatch(
  rows: Array<{
    name: string;
    category_id: string;
    price: number;
    image: string;
    half_carton_enabled: boolean;
    half_carton_price: number | null;
  }>
): Promise<void> {
  const payload = rows.map((r) => ({
    name: r.name,
    category_id: r.category_id || null,
    price: r.price,
    image: r.image,
    description: '',
    full_carton_units: null,
    half_carton_enabled: r.half_carton_enabled,
    half_carton_price: r.half_carton_price,
    half_carton_units: null,
    stock: 0,
  }));
  const { error } = await supabase.from('products').insert(payload);
  if (error) throw error;
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
}

/* ---------------- Categories ---------------- */

export async function insertCategory(name: string, color = '#059669'): Promise<Category | null> {
  const { data: row, error } = await supabase
    .from('categories')
    .insert({ name, color })
    .select('*')
    .maybeSingle();

  if (error) throw error;
  return row as Category | null;
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw error;
}

/* ---------------- Orders ---------------- */

export async function insertOrder(
  customerId: string | null,
  customerName: string,
  customerPhone: string,
  area: string,
  paymentMethod: PaymentMethod,
  items: OrderItem[],
  total: number
): Promise<Order | null> {
  const { data: row, error } = await supabase
    .from('orders')
    .insert({
      customer_id: customerId,
      customer_name: customerName,
      customer_phone: customerPhone,
      area,
      payment_method: paymentMethod,
      items,
      total,
      status: 'pending' as OrderStatus,
    })
    .select('*')
    .maybeSingle();

  if (error) throw error;
  return row as Order | null;
}

export async function fetchOrdersByCustomer(customerId: string): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as Order[];
}

export async function fetchAllOrders(): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as Order[];
}

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
  const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
  if (error) throw error;
}

export async function updateOrder(
  orderId: string,
  patch: { area?: string; payment_method?: PaymentMethod; customer_name?: string; customer_phone?: string; items?: OrderItem[]; total?: number }
): Promise<void> {
  const { error } = await supabase.from('orders').update(patch).eq('id', orderId);
  if (error) throw error;
}

/* ---------------- Customers ---------------- */

export async function insertCustomer(
  userName: string,
  businessName: string,
  phone: string,
  latitude: number | null,
  longitude: number | null,
  zoneId: string | null = null
): Promise<Customer | null> {
  const { data: row, error } = await supabase
    .from('customers')
    .insert({
      user_name: userName,
      business_name: businessName,
      phone,
      latitude,
      longitude,
      zone_id: zoneId,
    })
    .select('*')
    .maybeSingle();

  if (error) throw error;
  return row as Customer | null;
}

export async function fetchAllCustomers(): Promise<Customer[]> {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as Customer[];
}

/* ---------------- Geographic zones and delegates ---------------- */

export async function fetchGeographicZones(): Promise<GeographicZone[]> {
  const { data, error } = await supabase.from('geographic_zones').select('*').order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as GeographicZone[];
}

export async function insertGeographicZone(name: string, description: string): Promise<GeographicZone | null> {
  const { data, error } = await supabase
    .from('geographic_zones')
    .insert({ name, description })
    .select('*')
    .maybeSingle();
  if (error) throw error;
  return data as GeographicZone | null;
}

export async function deleteGeographicZone(id: string): Promise<void> {
  const { error } = await supabase.from('geographic_zones').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchDelegates(): Promise<Delegate[]> {
  const { data, error } = await supabase.from('delegates').select('*').order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Delegate[];
}

export async function insertDelegate(name: string, phone: string, zoneId: string): Promise<Delegate | null> {
  const { data, error } = await supabase
    .from('delegates')
    .insert({ name, phone, zone_id: zoneId || null })
    .select('*')
    .maybeSingle();
  if (error) throw error;
  return data as Delegate | null;
}

export async function deleteDelegate(id: string): Promise<void> {
  const { error } = await supabase.from('delegates').delete().eq('id', id);
  if (error) throw error;
}

/* ---------------- App settings ---------------- */

export async function fetchSettings(): Promise<AppSettings> {
  const { data, error } = await supabase
    .from('app_settings')
    .select('*')
    .eq('id', 1)
    .maybeSingle();

  if (error) throw error;
  return (data ?? {
    id: 1,
    whatsapp_number: '967781995868',
    admin_pin: '1234',
    pin_required: true,
    updated_at: new Date().toISOString(),
  }) as AppSettings;
}

export async function updateSettings(
  patch: Partial<Pick<AppSettings, 'whatsapp_number' | 'admin_pin' | 'pin_required'>>
): Promise<AppSettings> {
  const { data, error } = await supabase
    .from('app_settings')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', 1)
    .select('*')
    .maybeSingle();

  if (error) throw error;
  return data as AppSettings;
}

/* ---------------- App banners ---------------- */

export async function fetchBanners(): Promise<AppBanner[]> {
  const { data, error } = await supabase
    .from('app_banners')
    .select('id,image_url,storage_path,alt_text,updated_at');
  if (error) throw error;
  return (data ?? []) as AppBanner[];
}

export async function fetchBanner(id: BannerId): Promise<AppBanner | null> {
  const { data, error } = await supabase
    .from('app_banners')
    .select('id,image_url,storage_path,alt_text,updated_at')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data as AppBanner | null;
}

export async function uploadBannerImage(
  id: BannerId,
  file: File
): Promise<{ url: string; path: string }> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
  const path = `${id}/${Date.now()}.${ext}`;
  const { error: upErr } = await supabase.storage
    .from('banners')
    .upload(path, file, { cacheControl: '3600', upsert: false });
  if (upErr) throw upErr;
  const { data: pub } = supabase.storage.from('banners').getPublicUrl(path);
  return { url: pub.publicUrl, path };
}

export async function updateBanner(
  id: BannerId,
  patch: Partial<Pick<AppBanner, 'image_url' | 'storage_path' | 'alt_text'>>
): Promise<AppBanner> {
  const { data, error } = await supabase
    .from('app_banners')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .maybeSingle();
  if (error) throw error;
  return data as AppBanner;
}

export async function deleteBannerImage(path: string): Promise<void> {
  if (!path) return;
  const { error } = await supabase.storage.from('banners').remove([path]);
  if (error) throw error;
}
