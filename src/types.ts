export type Category = {
  id: string;
  name: string;
  color?: string;
  image: string;
  active_image: string;
  parent_id: string | null;
  sort_order: number;
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
  is_offer?: boolean;
  offer_category_id?: string | null;
  discount_percentage?: number;
  old_price?: number | null;
  created_at: string;
};

export type OfferCategory = {
  id: string;
  name: string;
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
  zone_id: string | null;
  delegate_id: string | null;
  created_at: string;
};

export type GeographicZone = {
  id: string;
  name: string;
  description: string;
  created_at: string;
};

export type Delegate = {
  id: string;
  name: string;
  phone: string;
  zone_id: string | null;
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

export type BottomTab = 'home' | 'offers' | 'store' | 'orders' | 'profile';

export const FONT_OPTIONS = [
  { value: 'Tajawal', label: 'Tajawal', weights: '400;500;700;800;900' },
  { value: 'Cairo', label: 'Cairo', weights: '400;500;600;700;800;900' },
  { value: 'Almarai', label: 'Almarai', weights: '400;700;800' },
  { value: 'Changa', label: 'Changa', weights: '400;500;600;700' },
  { value: 'IBM Plex Sans Arabic', label: 'IBM Plex Sans Arabic', weights: '400;500;600;700' },
  { value: 'Noto Kufi Arabic', label: 'Noto Kufi Arabic', weights: '400;500;600;700;800;900' },
] as const;

export type FontFamilyName = (typeof FONT_OPTIONS)[number]['value'];

export const NAV_TAB_LABELS: Record<BottomTab, string> = {
  home: 'الرئيسية',
  offers: 'العروض',
  store: 'المتجر',
  orders: 'الطلبات',
  profile: 'صفحتي',
};

export const HOME_SECTION_LABELS = {
  banner: 'البانر الرئيسي',
  stats: 'بطاقة عدد المنتجات',
  offers_card: 'بطاقة العروض الحصرية',
  support_card: 'بطاقة المساعدة',
} as const;

export type HomeSectionId = keyof typeof HOME_SECTION_LABELS;

export const COMPONENT_LABELS = {
  search_bar: 'شريط البحث',
  category_rail: 'شريط التصنيفات',
  product_badge: 'شارة نصف الكرتون على المنتج',
  product_unit_label: 'سطر السعر والوحدة على البطاقة',
  product_qty_controls: 'أزرار + و - على البطاقة',
} as const;

export type ComponentId = HomeSectionId | keyof typeof COMPONENT_LABELS;

export const ALL_COMPONENT_LABELS: Record<ComponentId, string> = { ...HOME_SECTION_LABELS, ...COMPONENT_LABELS };

export type DesignSettings = {
  id: number;
  primary_color: string;
  active_color: string;
  button_color: string;
  badge_color: string;
  font_family: FontFamilyName;
  body_weight: 400 | 500 | 600;
  bold_weight: 700 | 800 | 900;
  heading_scale: number;
  body_scale: number;
  button_scale: number;
  nav_order: BottomTab[];
  home_section_order: HomeSectionId[];
  hidden_components: ComponentId[];
  product_layout: 'grid' | 'list';
  updated_at: string;
};

export const DEFAULT_DESIGN_SETTINGS: DesignSettings = {
  id: 1,
  primary_color: '#059669',
  active_color: '#047857',
  button_color: '#3B82F6',
  badge_color: '#f97316',
  font_family: 'Tajawal',
  body_weight: 400,
  bold_weight: 700,
  heading_scale: 1,
  body_scale: 1,
  button_scale: 1,
  nav_order: ['home', 'offers', 'store', 'orders', 'profile'],
  home_section_order: ['banner', 'stats', 'offers_card', 'support_card'],
  hidden_components: [],
  product_layout: 'grid',
  updated_at: new Date(0).toISOString(),
};

export type AppSettings = {
  id: number;
  whatsapp_number: string;
  admin_pin: string;
  pin_required: boolean;
  hide_offers_button: boolean;
  updated_at: string;
};

export type BannerId = 'home' | 'offers';

export type AppBanner = {
  id: string;
  placement: BannerId;
  image_url: string;
  storage_path: string;
  alt_text: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Notification = {
  id: string;
  title: string;
  body: string;
  created_at: string;
};
