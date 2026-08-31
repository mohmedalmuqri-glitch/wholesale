export type Category = {
  id: string;
  name: string;
  color?: string;
  created_at: string;
};

export type Product = {
  id: string;
  name: string;
  category_id: string | null;
  price: number;
  image: string;
  description: string;
  full_carton_units: number | null;
  half_carton_enabled: boolean;
  half_carton_price: number | null;
  half_carton_units: number | null;
  stock: number;
  created_at: string;
};

export type OrderItem = {
  product_id: string;
  product_name: string;
  unit: 'full' | 'half';
  qty: number;
  price: number;
};

export type OrderStatus = 'pending' | 'preparing' | 'delivering' | 'delivered' | 'cancelled';

export type PaymentMethod = 'cash' | 'wallet';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'بانتظار التأكيد',
  preparing: 'قيد التجهيز',
  delivering: 'جاري التوصيل',
  delivered: 'تم التسليم',
  cancelled: 'ملغى',
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending: '#f59e0b',
  preparing: '#3b82f6',
  delivering: '#8b5cf6',
  delivered: '#22c55e',
  cancelled: '#ef4444',
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'نقداً',
  wallet: 'محفظة إلكترونية',
};

export type Order = {
  id: string;
  customer_id: string | null;
  customer_name: string;
  customer_phone: string;
  area: string | null;
  payment_method: PaymentMethod;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  created_at: string;
};

export type Customer = {
  id: string;
  user_name: string;
  business_name: string;
  phone: string;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
};

export type CartUnit = 'full' | 'half';

export type CartItem = {
  productId: string;
  unit: CartUnit;
  qty: number;
};

export const STORAGE_KEYS = {
  cart: 'tajeri_cart',
  customerId: 'tajeri_customer_id',
} as const;

export const CART_BLUE = '#3B82F6';

export type AppSettings = {
  id: number;
  whatsapp_number: string;
  admin_pin: string;
  pin_required: boolean;
  updated_at: string;
};
