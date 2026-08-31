import { useMemo, useState, useEffect, useCallback } from 'react';
import { Search, ShoppingCart, Store, Package, Check } from 'lucide-react';
import type { CartItem, Category, CartUnit, Customer, Product } from '@/types';
import { CART_BLUE, STORAGE_KEYS } from '@/types';
import { formatSAR } from '@/utils';
import { CartDrawer } from './CartDrawer';
import { OrdersTab } from './OrdersTab';
import { ProfileTab } from './ProfileTab';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useToast } from './Toast';
import { BottomNav, type BottomTab } from './BottomNav';
import { supabase } from '@/lib/supabase';

type StorefrontProps = {
  categories: Category[];
  products: Product[];
};

export function Storefront({ categories, products }: StorefrontProps) {
  const [query, setQuery] = useState('');
  const [activeCat, setActiveCat] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<BottomTab>('store');
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useLocalStorage<CartItem[]>(STORAGE_KEYS.cart, []);
  const [customerId, setCustomerId] = useLocalStorage<string | null>(STORAGE_KEYS.customerId, null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [choiceProduct, setChoiceProduct] = useState<Product | null>(null);
  const [choiceUnit, setChoiceUnit] = useState<CartUnit>('full');
  const [orderRefreshKey, setOrderRefreshKey] = useState(0);
  const { notify } = useToast();

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
      {/* Header + search + categories — only on store tab */}
      {activeTab === 'store' && (
        <>
          <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-sand-200">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 shrink-0">
                  <div className="w-10 h-10 rounded-2xl bg-brand-600 text-white flex items-center justify-center shadow-soft">
                    <Store size={22} />
                  </div>
                  <div className="hidden sm:block">
                    <h1 className="font-display font-extrabold text-lg leading-none text-sand-900">
                      منصة الجملة
                    </h1>
                    <p className="text-[11px] text-sand-500 mt-0.5">تجارة المواد الغذائية</p>
                  </div>
                </div>

                <div className="flex-1 relative">
                  <Search
                    size={18}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-sand-400 pointer-events-none"
                  />
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="ابحث عن منتج..."
                    className="w-full h-11 rounded-full bg-sand-100 border border-transparent focus:border-brand-400 focus:bg-white pr-10 pl-4 text-sm text-sand-800 placeholder:text-sand-400 outline-none transition-all"
                  />
                </div>

                <button
                  onClick={() => setCartOpen(true)}
                  className="relative w-11 h-11 rounded-full bg-brand-600 hover:bg-brand-700 text-white flex items-center justify-center transition-colors shadow-soft shrink-0"
                  aria-label="السلة"
                >
                  <ShoppingCart size={20} />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -left-1 bg-red-500 text-white text-[11px] font-bold min-w-[20px] h-5 px-1 rounded-full flex items-center justify-center border-2 border-white animate-pop-in">
                      {cartCount}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </header>

          <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-4">
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin">
              <Chip active={activeCat === 'all'} onClick={() => setActiveCat('all')}>
                الكل
              </Chip>
              {categories.map((c) => (
                <Chip key={c.id} active={activeCat === c.id} onClick={() => setActiveCat(c.id)}>
                  {c.name}
                </Chip>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Tab content */}
      {activeTab === 'store' ? (
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
