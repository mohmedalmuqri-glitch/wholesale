import { useEffect, useState } from 'react';
import { ClipboardList, Package, Loader2, Clock, MapPin } from 'lucide-react';
import type { Order, OrderStatus } from '@/types';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/types';
import { formatSAR } from '@/utils';
import { fetchOrdersByCustomer } from '@/lib/db';

type OrdersTabProps = {
  customerId: string | null;
  refreshKey: number;
};

type FilterTab = 'preparing' | 'delivering' | 'delivered' | 'cancelled';

const FILTER_TABS: Array<{ id: FilterTab; label: string }> = [
  { id: 'preparing', label: 'قيد التجهيز' },
  { id: 'delivering', label: 'جاري التوصيل' },
  { id: 'delivered', label: 'تم التسليم' },
  { id: 'cancelled', label: 'ملغى' },
];

export function OrdersTab({ customerId, refreshKey }: OrdersTabProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>('preparing');

  useEffect(() => {
    if (!customerId) {
      setOrders([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await fetchOrdersByCustomer(customerId);
        if (!cancelled) setOrders(data);
      } catch {
        if (!cancelled) setOrders([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [customerId, refreshKey]);

  if (!customerId) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 pb-32">
        <EmptyOrders message="الرجاء تسجيل بياناتك من تبويب صفحتي أولاً" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 pb-32 flex flex-col items-center gap-3 text-sand-400">
        <Loader2 size={32} className="animate-spin text-violet-500" />
        <p className="text-sm font-medium">جارٍ تحميل الطلبات...</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 pb-32">
        <EmptyOrders message="لا توجد طلبات بعد. ابدأ التسوق من تبويب المتجر" />
      </div>
    );
  }

  const filtered = orders.filter((o) => {
    const status = (o.status ?? 'pending') as OrderStatus;
    return status === filter;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-32">
      <h1 className="text-xl font-extrabold text-sand-900 mb-4">طلباتي ({orders.length})</h1>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-3 -mx-1 px-1 scrollbar-thin mb-4">
        {FILTER_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setFilter(t.id)}
            className={`shrink-0 px-4 h-9 rounded-full text-sm font-bold transition-all whitespace-nowrap ${
              filter === t.id
                ? 'bg-violet-600 text-white shadow-soft'
                : 'bg-white text-sand-600 border border-sand-200 hover:border-violet-300 hover:text-violet-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyOrders message="لم يتم العثور على أي طلب" />
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}

function OrderCard({ order }: { order: Order }) {
  const status = (order.status ?? 'pending') as OrderStatus;
  const color = ORDER_STATUS_COLORS[status] ?? '#f59e0b';
  const label = ORDER_STATUS_LABELS[status] ?? 'بانتظار التأكيد';
  const date = new Date(order.created_at).toLocaleString('ar-EG', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <div className="bg-white rounded-2xl border border-sand-200 shadow-card overflow-hidden animate-fade-in">
      <div className="flex items-center justify-between px-4 py-3 border-b border-sand-100">
        <div className="flex items-center gap-2">
          {order.area && <MapPin size={16} className="text-sand-400" />}
          <span className="text-sm font-bold text-sand-800">
            {order.area || order.customer_name}
          </span>
        </div>
        <span
          className="text-xs font-bold px-3 py-1 rounded-full text-white"
          style={{ backgroundColor: color }}
        >
          {label}
        </span>
      </div>

      <div className="px-4 py-3 space-y-2">
        {order.items.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between text-sm">
            <span className="text-sand-700">
              {item.product_name}
              <span className="text-sand-400 text-xs mr-1">
                ({item.unit === 'half' ? 'نصف كرتون' : 'كرتون كامل'} × {item.qty})
              </span>
            </span>
            <span className="font-bold text-sand-800">{formatSAR(item.price * item.qty)}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between px-4 py-3 bg-sand-50 border-t border-sand-100">
        <div className="flex items-center gap-1.5 text-xs text-sand-500">
          <Clock size={14} />
          {date}
        </div>
        <span className="text-base font-extrabold text-brand-700">{formatSAR(order.total)}</span>
      </div>
    </div>
  );
}

function EmptyOrders({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center text-sand-400">
      <ClipboardList size={56} strokeWidth={1.2} className="mb-3" />
      <p className="text-base font-medium">{message}</p>
    </div>
  );
}
