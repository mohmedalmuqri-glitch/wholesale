import { supabase } from '@/lib/supabase';
import type { AppSettings, Category, Customer, Order, OrderItem, OrderStatus, PaymentMethod, Product } from '@/types';

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
  longitude: number | null
): Promise<Customer | null> {
  const { data: row, error } = await supabase
    .from('customers')
    .insert({
      user_name: userName,
      business_name: businessName,
      phone,
      latitude,
      longitude,
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
