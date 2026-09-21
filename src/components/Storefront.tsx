import { useMemo, useState, useEffect, useCallback } from 'react';
import {
  Bell,
  CircleHelp,
  Search,
  ShoppingCart,
  Store,
  Package,
  Check,
} from 'lucide-react';
import type { CartItem, Category, CartUnit, Customer, Product, AppBanner } from '@/types';
import { CART_BLUE, STORAGE_KEYS } from '@/types';
import { formatSAR } from '@/utils';
import { CartDrawer } from './CartDrawer';
import { OrdersTab } from './OrdersTab';
import { ProfileTab } from './ProfileTab';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useToast } from './Toast';
import { BottomNav, type BottomTab } from './BottomNav';
import { supabase } from '@/lib/supabase';
import { useBanners } from '@/hooks/useBanners';

type StorefrontProps = {
  categories: Category[];
  products: Product[];
};

export function Storefront({ categories, products }: StorefrontProps) {
  const [query, setQuery] = useState('');
  const [activeCat, setActiveCat] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<BottomTab>('home');
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useLocalStorage<CartItem[]>(STORAGE_KEYS.cart, []);
  const [customerId, setCustomerId] = useLocalStorage<string | null>(STORAGE_KEYS.customerId, null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [choiceProduct, setChoiceProduct] = useState<Product | null>(null);
  const [choiceUnit, setChoiceUnit] = useState<CartUnit>('full');
  const [orderRefreshKey, setOrderRefreshKey] = useState(0);
  const { notify } = useToast();
  const { banners } = useBanners();

  // Load customer data when customerId is available
  const refreshCustomer = useCallback(async () => {
    if (!customerId) {
      setCustomer(null);
      return;
    }
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .maybeSingle();
    if (error) return;
    setCustomer(data as Customer | null);
  }, [customerId]);

  useEffect(() => {
    refreshCustomer();
  }, [refreshCustomer]);

  // Realtime subscription for customer's orders
  useEffect(() => {
    if (!customerId) return;
    const channel = supabase
      .channel('customer-orders-rt')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `customer_id=eq.${customerId}` },
        () => setOrderRefreshKey((k) => k + 1)
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [customerId]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesCat = activeCat === 'all' || p.category_id === activeCat;
      const matchesQuery =
        !query.trim() || p.name.toLowerCase().includes(query.trim().toLowerCase());
      return matchesCat && matchesQuery;
    });
  }, [products, activeCat, query]);

  const cartCount = cart.reduce((sum, i) => sum + i.qty, 0);

  const addFullCarton = (productId: string) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === productId && i.unit === 'full');
      if (existing) {
        return prev.map((i) =>
          i.productId === productId && i.unit === 'full' ? { ...i, qty: i.qty + 1 } : i
        );
      }
      return [...prev, { productId, unit: 'full' as const, qty: 1 }];
    });
    notify('تمت إضافة الكرتون الكامل إلى السلة');
  };

  const addWithChoice = (productId: string, unit: CartUnit) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === productId && i.unit === unit);
      if (existing) {
        return prev.map((i) =>
          i.productId === productId && i.unit === unit ? { ...i, qty: i.qty + 1 } : i
        );
      }
      return [...prev, { productId, unit, qty: 1 }];
    });
    notify(unit === 'half' ? 'تمت إضافة نصف الكرتون إلى السلة' : 'تمت إضافة الكرتون الكامل إلى السلة');
  };

  const handleAddClick = (product: Product) => {
    if (product.half_carton_enabled) {
      setChoiceUnit('full');
      setChoiceProduct(product);
    } else {
      addFullCarton(product.id);
    }
  };

  const confirmChoice = () => {
    if (!choiceProduct) return;
    addWithChoice(choiceProduct.id, choiceUnit);
    setChoiceProduct(null);
  };

  const inc = (productId: string, unit: CartUnit) =>
    setCart((prev) =>
      prev.map((i) =>
        i.productId === productId && i.unit === unit ? { ...i, qty: i.qty + 1 } : i
      )
    );
  const dec = (productId: string, unit: CartUnit) =>
    setCart((prev) =>
      prev
        .map((i) =>
          i.productId === productId && i.unit === unit ? { ...i, qty: i.qty - 1 } : i
        )
        .filter((i) => i.qty > 0)
    );
  const remove = (productId: string, unit: CartUnit) =>
    setCart((prev) => prev.filter((i) => !(i.productId === productId && i.unit === unit)));
  const clear = () => setCart([]);

  const handleCustomerSaved = (c: Customer) => {
    setCustomerId(c.id);
    setCustomer(c);
    setOrderRefreshKey((k) => k + 1);
  };

  return (
    <div className="min-h-screen bg-sand-50">
      <header className="sticky top-0 z-30 border-b border-sand-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-2 text-right transition-transform active:scale-95"
            aria-label="الرئيسية"
          >
            <img src="/Screenshot_٢٠٢٦٠٩٢٠-٠٠٠٨٠٢_Gallery.jpg" alt="شعار شعوب" className="h-11 w-11 rounded-xl object-cover" />
            <span className="leading-none">
              <strong className="block font-display text-lg font-extrabold tracking-tight text-sand-900">شعوب</strong>
              <span className="mt-1 block text-[9px] font-bold uppercase tracking-[0.22em] text-orange-500">SHOU'UB</span>
            </span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => notify('لا توجد إشعارات جديدة حالياً')}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-sand-200 bg-white text-sand-600 transition hover:border-brand-300 hover:text-brand-700"
              aria-label="الإشعارات"
            >
              <Bell size={18} />
            </button>
            <button
              type="button"
              onClick={() => notify('يسعدنا مساعدتك، تواصل معنا عبر صفحة الدعم')}
              className="hidden h-10 items-center gap-2 rounded-full border border-sand-200 bg-white px-3 text-xs font-bold text-sand-600 transition hover:border-brand-300 hover:text-brand-700 sm:flex"
            >
              <CircleHelp size={17} />
              الدعم
            </button>
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="relative flex h-10 w-10 items-center justify-center rounded-full bg-brand-700 text-white shadow-soft transition hover:bg-brand-800 active:scale-95"
              aria-label="السلة"
            >
              <ShoppingCart size={18} />
              {cartCount > 0 && (
                <span className="absolute -left-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full border-2 border-white bg-orange-500 px-1 text-[10px] font-bold text-white animate-pop-in">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {activeTab === 'store' && (
        <div className="mx-auto max-w-5xl px-4 pt-4 sm:px-6">
          <div className="relative mb-2">
            <Search size={18} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sand-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث عن منتج..."
              className="h-11 w-full rounded-full border border-transparent bg-sand-100 pl-4 pr-10 text-sm text-sand-800 outline-none transition-all placeholder:text-sand-400 focus:border-brand-400 focus:bg-white"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
            <Chip active={activeCat === 'all'} onClick={() => setActiveCat('all')}>الكل</Chip>
            {categories.map((c) => (
              <Chip key={c.id} active={activeCat === c.id} onClick={() => setActiveCat(c.id)}>{c.name}</Chip>
            ))}
          </div>
        </div>
      )}

      {/* Tab content */}
      {activeTab === 'home' ? (
        <HomeTab
          productsCount={products.length}
          banner={banners.home ?? null}
          onShop={() => setActiveTab('store')}
          onOffers={() => setActiveTab('offers')}
          onSupport={() => notify('يسعدنا مساعدتك، تواصل معنا عبر صفحة الدعم')}
        />
      ) : activeTab === 'offers' ? (
        <OffersTab banner={banners.offers ?? null} onShop={() => setActiveTab('store')} />
      ) : activeTab === 'store' ? (
        <main className="max-w-5xl mx-auto px-4 sm:px-6 py-4 pb-32">
          {filtered.length === 0 ? (
            <EmptyState query={query} hasProducts={products.length > 0} />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {filtered.map((product) => (
                <article
                  key={product.id}
                  className="group bg-white rounded-2xl border border-sand-200 overflow-hidden shadow-card hover:shadow-soft transition-all duration-300 flex flex-col animate-fade-in"
                >
                  <div className="relative aspect-square bg-white overflow-hidden">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sand-200">
                        <Package size={64} strokeWidth={1} />
                      </div>
                    )}
                    {product.half_carton_enabled && (
                      <span className="absolute top-2 left-2 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                        متاح نصف كرتون
                      </span>
                    )}
                  </div>

                  <div className="p-3 flex flex-col flex-1 gap-2">
                    <h3 className="text-sm font-bold text-sand-800 leading-snug line-clamp-2 min-h-[2.5rem]">
                      {product.name}
                    </h3>
                    <div className="mt-auto">
                      <span className="block text-base font-extrabold text-brand-700 leading-none">
                        {formatSAR(product.price)}
                      </span>
                      <span className="text-[11px] text-sand-400 mt-1 block">
                        {product.full_carton_units
                          ? `السعر للكرتون (${product.full_carton_units} حبة)`
                          : 'السعر للكرتون'}
                      </span>
                    </div>
                    <button
                      onClick={() => handleAddClick(product)}
                      style={{ backgroundColor: CART_BLUE }}
                      className="w-full h-9 rounded-full hover:brightness-110 active:scale-95 text-white font-bold text-xs transition-all shadow-soft"
                    >
                      إضافة للسلة
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </main>
      ) : activeTab === 'orders' ? (
        <OrdersTab customerId={customerId} refreshKey={orderRefreshKey} />
      ) : (
        <ProfileTab customer={customer} onSaved={handleCustomerSaved} />
      )}

      <BottomNav activeTab={activeTab} onChange={setActiveTab} />

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cart}
        products={products}
        customerId={customerId}
        customerName={customer?.business_name ?? customer?.user_name ?? ''}
        customerPhone={customer?.phone ?? ''}
        customerArea={customer?.business_name ?? ''}
        onInc={inc}
        onDec={dec}
        onRemove={remove}
        onClear={clear}
        onViewOrders={() => setActiveTab('orders')}
      />

      {/* Half-carton choice modal */}
      {choiceProduct && (
        <ChoiceModal
          product={choiceProduct}
          unit={choiceUnit}
          onUnitChange={setChoiceUnit}
          onConfirm={confirmChoice}
          onClose={() => setChoiceProduct(null)}
        />
      )}
    </div>
  );
}

function HomeTab({
  productsCount,
  onShop,
  onSupport,
}: {
  productsCount: number;
  onShop: () => void;
  onSupport: () => void;
}) {
  return (
    <main className="mx-auto max-w-5xl px-4 pb-32 sm:px-6">
      <section className="relative mt-4 min-h-[250px] overflow-hidden rounded-[28px] bg-[#0f3155] shadow-soft">
        <img
          src="/Screenshot_٢٠٢٦٠٩٢٠-٠٠٠٨٠٢_Gallery.jpg"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover opacity-[0.12] mix-blend-screen"
        />
        <div className="absolute -left-16 -top-16 h-48 w-48 rounded-full bg-orange-500/20 blur-3xl" />
        <div className="relative flex min-h-[250px] flex-col justify-center p-6 text-white sm:p-10">
          <span className="mb-4 inline-flex w-fit rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold text-orange-200">
            منصة شعوب للتجارة
          </span>
          <h1 className="max-w-md font-display text-3xl font-extrabold leading-tight sm:text-4xl">
            كل احتياجاتك بالجملة، في مكان واحد
          </h1>
          <p className="mt-3 max-w-sm text-sm leading-7 text-white/75">
            اكتشف المنتجات، اطلب بسهولة، وتابع طلباتك من البداية حتى التوصيل.
          </p>
          <button
            type="button"
            onClick={onShop}
            className="mt-6 flex h-11 w-fit items-center rounded-full bg-orange-500 px-6 text-sm font-extrabold text-white shadow-lg transition hover:bg-orange-600 active:scale-95"
          >
            ابدأ التسوق
          </button>
        </div>
      </section>

      <section className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-sand-200 bg-white p-4 shadow-card">
          <p className="text-2xl font-extrabold text-brand-700">{productsCount}</p>
          <p className="mt-1 text-xs font-bold text-sand-500">منتج متاح</p>
        </div>
        <button
          type="button"
          onClick={onShop}
          className="rounded-2xl border border-sand-200 bg-white p-4 text-right shadow-card transition hover:border-brand-300"
        >
          <Store className="text-brand-700" size={22} />
          <p className="mt-2 text-xs font-bold text-sand-700">تصفح المتجر</p>
        </button>
        <button
          type="button"
          onClick={onSupport}
          className="col-span-2 rounded-2xl border border-sand-200 bg-white p-4 text-right shadow-card transition hover:border-orange-300 sm:col-span-1"
        >
          <CircleHelp className="text-orange-500" size={22} />
          <p className="mt-2 text-xs font-bold text-sand-700">تحتاج مساعدة؟</p>
        </button>
      </section>
    </main>
  );
}

/* ---------------- Choice modal ---------------- */

function ChoiceModal({
  product,
  unit,
  onUnitChange,
  onConfirm,
  onClose,
}: {
  product: Product;
  unit: CartUnit;
  onUnitChange: (u: CartUnit) => void;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const fullPrice = product.price;
  const halfPrice = product.half_carton_price ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl shadow-2xl animate-pop-in overflow-hidden">
        <div className="px-5 pt-5 pb-2">
          <h2 className="font-extrabold text-base text-sand-900 mb-1">اختر طريقة الشراء</h2>
          <p className="text-xs text-sand-500 line-clamp-1">{product.name}</p>
        </div>

        <div className="px-5 py-3 space-y-2.5">
          <ChoiceOption
            active={unit === 'full'}
            onClick={() => onUnitChange('full')}
            label="كرتون كامل"
            sub={product.full_carton_units ? `${product.full_carton_units} حبة` : undefined}
            price={fullPrice}
          />
          <ChoiceOption
            active={unit === 'half'}
            onClick={() => onUnitChange('half')}
            label="نصف كرتون"
            sub={product.half_carton_units ? `${product.half_carton_units} حبة` : undefined}
            price={halfPrice}
          />
        </div>

        <div className="px-5 pb-5 pt-2 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 h-11 rounded-full border border-sand-300 text-sand-700 font-bold text-sm hover:bg-sand-100 transition-colors"
          >
            إلغاء
          </button>
          <button
            onClick={onConfirm}
            style={{ backgroundColor: CART_BLUE }}
            className="flex-[2] h-11 rounded-full hover:brightness-110 text-white font-bold text-sm transition-all shadow-soft"
          >
            تأكيد الإضافة للسلة
          </button>
        </div>
      </div>
    </div>
  );
}

function ChoiceOption({
  active,
  onClick,
  label,
  sub,
  price,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  sub?: string;
  price: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 rounded-2xl border-2 p-3 transition-all text-right ${
        active ? 'border-blue-500 bg-blue-50' : 'border-sand-200 hover:border-sand-300 bg-white'
      }`}
    >
      <div
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
          active ? 'border-blue-500' : 'border-sand-300'
        }`}
      >
        {active && <Check size={12} className="text-blue-500" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm text-sand-800">{label}</p>
        {sub && <p className="text-xs text-sand-400 mt-0.5">{sub}</p>}
      </div>
      <span className="text-sm font-extrabold text-red-600 shrink-0">{formatSAR(price)}</span>
    </button>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 px-4 h-9 rounded-full text-sm font-bold transition-all whitespace-nowrap ${
        active
          ? 'bg-brand-600 text-white shadow-soft'
          : 'bg-white text-sand-600 border border-sand-200 hover:border-brand-300 hover:text-brand-700'
      }`}
    >
      {children}
    </button>
  );
}

function EmptyState({ query, hasProducts }: { query: string; hasProducts: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center text-sand-400">
      <Package size={64} strokeWidth={1} className="mb-3" />
      {query ? (
        <p className="text-base font-medium">لا توجد نتائج لـ "{query}"</p>
      ) : hasProducts ? (
        <p className="text-base font-medium">لا توجد منتجات في هذا القسم</p>
      ) : (
        <p className="text-base font-medium">لا توجد منتجات بعد</p>
      )}
    </div>
  );
}
