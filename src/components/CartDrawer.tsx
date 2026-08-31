import { ShoppingCart, Plus, Minus, Trash2, X, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { CartItem, CartUnit, PaymentMethod, Product, OrderItem } from '@/types';
import { formatSAR } from '@/utils';
import { unitPrice, unitLabel } from '@/cartUtils';
import { insertOrder } from '@/lib/db';
import { useToast } from './Toast';

type CartDrawerProps = {
  open: boolean;
  onClose: () => void;
  items: CartItem[];
  products: Product[];
  customerId: string | null;
  customerName: string;
  customerPhone: string;
  customerArea: string;
  onInc: (productId: string, unit: CartUnit) => void;
  onDec: (productId: string, unit: CartUnit) => void;
  onRemove: (productId: string, unit: CartUnit) => void;
  onClear: () => void;
};

type CheckoutStage = 'idle' | 'submitting' | 'done';

export function CartDrawer({
  open,
  onClose,
  items,
  products,
  customerId,
  customerName,
  customerPhone,
  customerArea,
  onInc,
  onDec,
  onRemove,
  onClear,
}: CartDrawerProps) {
  const { notify } = useToast();
  const [stage, setStage] = useState<CheckoutStage>('idle');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [area, setArea] = useState('');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    if (open) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const lines = items
    .map((item) => {
      const product = products.find((p) => p.id === item.productId);
      return product ? { item, product } : null;
    })
    .filter((l): l is { item: CartItem; product: Product } => l !== null);

  const total = lines.reduce((sum, l) => sum + unitPrice(l.product, l.item.unit) * l.item.qty, 0);
  const count = items.reduce((sum, i) => sum + i.qty, 0);

  const submitOrder = async () => {
    if (!customerName.trim()) {
      notify('الرجاء تسجيل بياناتك أولاً من تبويب "صفحتي"', 'error');
      return;
    }
    const orderItems: OrderItem[] = lines.map((l) => ({
      product_id: l.product.id,
      product_name: l.product.name,
      unit: l.item.unit,
      qty: l.item.qty,
      price: unitPrice(l.product, l.item.unit),
    }));
    if (!area.trim() && !customerArea.trim()) {
      notify('الرجاء إدخال اسم المنطقة', 'error');
      return;
    }
    setStage('submitting');
    try {
      await insertOrder(
        customerId,
        customerName.trim(),
        customerPhone.trim(),
        (area.trim() || customerArea.trim()),
        paymentMethod,
        orderItems,
        total
      );
      setStage('done');
      onClear();
      notify('تم إرسال الطلب بنجاح');
      setTimeout(() => {
        setStage('idle');
        setArea('');
        onClose();
      }, 1800);
    } catch (err) {
      setStage('idle');
      notify(err instanceof Error ? err.message : 'فشل إرسال الطلب', 'error');
    }
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
      />
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-[min(100vw,420px)] bg-sand-50 shadow-2xl transition-transform duration-300 flex flex-col ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-hidden={!open}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-sand-200 bg-white">
          <div className="flex items-center gap-2">
            <ShoppingCart size={22} className="text-brand-600" />
            <h2 className="text-lg font-bold text-sand-800">سلة الشراء</h2>
            {count > 0 && (
              <span className="bg-brand-600 text-white text-xs font-bold rounded-full px-2 py-0.5">
                {count}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-sand-400 hover:text-sand-800 transition-colors p-1"
            aria-label="إغلاق السلة"
          >
            <X size={22} />
          </button>
        </div>

        {lines.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-sand-400 px-8 text-center">
            <ShoppingCart size={56} strokeWidth={1.2} />
            <p className="text-base font-medium">السلة فارغة</p>
            <p className="text-sm">أضف منتجات من المتجر لتظهر هنا</p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {lines.map(({ item, product }) => {
                const price = unitPrice(product, item.unit);
                const label = unitLabel(product, item.unit);
                return (
                  <div
                    key={`${item.productId}-${item.unit}`}
                    className="flex gap-3 bg-white rounded-2xl p-3 border border-sand-200 animate-pop-in"
                  >
                    <div className="w-16 h-16 rounded-xl bg-white border border-sand-200 overflow-hidden shrink-0 flex items-center justify-center">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ShoppingCart size={24} className="text-sand-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-sand-800 line-clamp-2">{product.name}</p>
                      <p className="text-xs text-blue-600 font-bold mt-0.5">{label}</p>
                      <p className="text-xs text-sand-500 mt-0.5">{formatSAR(price)} / الوحدة</p>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-1 bg-sand-100 rounded-full p-1">
                          <button
                            onClick={() => onDec(item.productId, item.unit)}
                            className="w-7 h-7 rounded-full bg-white hover:bg-sand-200 flex items-center justify-center text-sand-700 transition-colors"
                            aria-label="إنقاص"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="w-7 text-center text-sm font-bold text-sand-800">
                            {item.qty}
                          </span>
                          <button
                            onClick={() => onInc(item.productId, item.unit)}
                            className="w-7 h-7 rounded-full bg-brand-600 hover:bg-brand-700 text-white flex items-center justify-center transition-colors"
                            aria-label="زيادة"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <span className="text-sm font-bold text-brand-700">
                          {formatSAR(price * item.qty)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => onRemove(item.productId, item.unit)}
                      className="text-sand-300 hover:text-red-500 transition-colors self-start"
                      aria-label="حذف"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-sand-200 bg-white px-5 py-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-sand-500">الإجمالي</span>
                <span className="text-xl font-extrabold text-sand-900">{formatSAR(total)}</span>
              </div>

              {stage !== 'done' && (
                <>
                  <input
                    type="text"
                    value={area || customerArea}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="اسم المنطقة (مثل: حده)"
                    className="w-full h-11 rounded-xl bg-sand-50 border border-sand-200 focus:border-brand-400 px-3 text-sm outline-none transition-all"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPaymentMethod('cash')}
                      className={`flex-1 h-10 rounded-xl font-bold text-sm transition-all ${
                        paymentMethod === 'cash'
                          ? 'bg-brand-600 text-white'
                          : 'bg-sand-50 border border-sand-200 text-sand-600'
                      }`}
                    >
                      نقداً
                    </button>
                    <button
                      onClick={() => setPaymentMethod('wallet')}
                      className={`flex-1 h-10 rounded-xl font-bold text-sm transition-all ${
                        paymentMethod === 'wallet'
                          ? 'bg-brand-600 text-white'
                          : 'bg-sand-50 border border-sand-200 text-sand-600'
                      }`}
                    >
                      محفظة إلكترونية
                    </button>
                  </div>
                </>
              )}

              {stage === 'done' ? (
                <div className="flex items-center justify-center gap-2 h-11 text-green-600 font-bold text-sm">
                  <ShoppingCart size={18} />
                  تم إرسال طلبك بنجاح!
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={onClear}
                    disabled={stage === 'submitting'}
                    className="flex-1 h-11 rounded-full border border-sand-300 text-sand-700 font-bold text-sm hover:bg-sand-100 transition-colors"
                  >
                    تفريغ السلة
                  </button>
                  <button
                    onClick={submitOrder}
                    disabled={stage === 'submitting' || !customerId}
                    className="flex-[2] h-11 rounded-full bg-brand-600 hover:bg-brand-700 disabled:bg-brand-400 text-white font-bold text-sm transition-colors shadow-soft flex items-center justify-center gap-2"
                  >
                    {stage === 'submitting' ? <Loader2 size={16} className="animate-spin" /> : null}
                    {customerId ? 'تأكيد وإرسال الطلب' : 'سجل من "صفحتي" أولاً'}
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </aside>
    </>
  );
}
