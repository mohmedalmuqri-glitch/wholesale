import { useEffect, useMemo, useState } from 'react';
import {
  Users,
  MapPin,
  Bike,
  Plus,
  Trash2,
  Phone,
  MapPinned,
  Loader2,
  UserRound,
  Store,
} from 'lucide-react';
import type { Customer, Delegate, GeographicZone, Order, OrderStatus } from '@/types';
import {
  fetchAllCustomers,
  fetchDelegates,
  fetchGeographicZones,
  fetchAllOrders,
  insertGeographicZone,
  deleteGeographicZone,
  insertDelegate,
  deleteDelegate,
} from '@/lib/db';
import { useToast } from './Toast';

type SubTab = 'customers' | 'delegates' | 'zones';

const ACTIVE_STATUSES: OrderStatus[] = ['pending', 'preparing', 'delivering'];

type ZoneStats = {
  customerCount: number;
  activeOrders: number;
  delegateName: string | null;
};

type DelegateStats = {
  activeOrders: number;
};

export function CustomersAdminTab() {
  const [sub, setSub] = useState<SubTab>('customers');

  return (
    <div dir="rtl" className="space-y-5">
      <div className="w-full overflow-x-auto bg-white border-b border-sand-200">
        <div className="min-w-max flex flex-row items-center justify-end gap-1 px-2 sm:px-5">
          <SubTabButton active={sub === 'customers'} onClick={() => setSub('customers')}>
            العملاء
          </SubTabButton>
          <SubTabButton active={sub === 'delegates'} onClick={() => setSub('delegates')}>
            المناديب
          </SubTabButton>
          <SubTabButton active={sub === 'zones'} onClick={() => setSub('zones')}>
            المربعات الجغرافية
          </SubTabButton>
        </div>
      </div>

      {sub === 'customers' && <CustomersList />}
      {sub === 'delegates' && <DelegatesManager />}
      {sub === 'zones' && <ZonesManager />}
    </div>
  );
}

/* ---------------- Sub tab button ---------------- */

function SubTabButton({
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
      className={`px-5 sm:px-7 h-12 text-base font-bold transition-all whitespace-nowrap border-b-2 ${
        active
          ? 'bg-blue-950 text-white border-blue-950 rounded-xl my-1 shadow-soft'
          : 'text-sand-800 border-transparent hover:bg-sand-50'
      }`}
    >
      {children}
    </button>
  );
}

/* ---------------- Customers list ---------------- */

function CustomersList() {
  const { notify } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [zones, setZones] = useState<GeographicZone[]>([]);
  const [delegates, setDelegates] = useState<Delegate[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    Promise.all([fetchAllCustomers(), fetchGeographicZones(), fetchDelegates()])
      .then(([c, z, d]) => {
        setCustomers(c);
        setZones(z);
        setDelegates(d);
      })
      .catch(() => notify('تعذر تحميل العملاء', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const zoneName = (id: string | null) => zones.find((z) => z.id === id)?.name ?? null;
  const delegateName = (id: string | null) => delegates.find((d) => d.id === id)?.name ?? null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-brand-600">
        <Loader2 size={28} className="animate-spin" />
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-dashed border-sand-300 py-16 flex flex-col items-center text-sand-400">
        <Users size={48} strokeWidth={1.2} className="mb-3" />
        <p className="font-medium text-sand-600">لا يوجد عملاء مسجلون بعد</p>
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {customers.map((c) => (
        <div key={c.id} className="bg-white rounded-2xl border border-sand-200 p-4 shadow-card">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
              <Store size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sand-800 line-clamp-1">{c.business_name || c.user_name}</p>
              <p className="text-xs text-sand-500 line-clamp-1">{c.user_name}</p>
            </div>
          </div>
          <div className="mt-3 space-y-1.5 text-xs text-sand-600">
            <div className="flex items-center gap-1.5">
              <Phone size={13} className="text-sand-400" />
              <span dir="ltr">{c.phone || '—'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin size={13} className="text-sand-400" />
              <span>{zoneName(c.zone_id) ?? 'بدون مربع'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Bike size={13} className="text-sand-400" />
              <span>{delegateName(c.delegate_id) ?? 'بدون مندوب'}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------------- Delegates manager ---------------- */

function DelegatesManager() {
  const { notify } = useToast();
  const [delegates, setDelegates] = useState<Delegate[]>([]);
  const [zones, setZones] = useState<GeographicZone[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [zoneId, setZoneId] = useState('');

  const load = () => {
    Promise.all([fetchDelegates(), fetchGeographicZones(), fetchAllOrders(), fetchAllCustomers()])
      .then(([d, z, o, c]) => {
        setDelegates(d);
        setZones(z);
        setOrders(o);
        setCustomers(c);
      })
      .catch(() => notify('تعذر تحميل المناديب', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const statsByDelegate = useMemo(() => {
    const map = new Map<string, DelegateStats>();
    for (const d of delegates) {
      map.set(d.id, { activeOrders: 0 });
    }
    const customerDelegate = new Map<string, string | null>();
    for (const c of customers) {
      customerDelegate.set(c.id, c.delegate_id);
    }
    for (const o of orders) {
      const delegateId = o.customer_id ? customerDelegate.get(o.customer_id) : null;
      if (delegateId && ACTIVE_STATUSES.includes(o.status)) {
        const s = map.get(delegateId);
        if (s) s.activeOrders += 1;
      }
    }
    return map;
  }, [delegates, orders, customers]);

  const addDelegate = async () => {
    if (!name.trim()) return notify('أدخل اسم المندوب', 'error');
    if (!zoneId) return notify('اختر المربع الجغرافي', 'error');
    setSaving(true);
    try {
      await insertDelegate(name.trim(), phone.trim(), zoneId);
      setName('');
      setPhone('');
      setZoneId('');
      notify('تمت إضافة المندوب');
      load();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'فشل إضافة المندوب', 'error');
    } finally {
      setSaving(false);
    }
  };

  const removeDelegate = async (id: string, delegateName: string) => {
    if (!window.confirm(`حذف المندوب "${delegateName}"؟`)) return;
    try {
      await deleteDelegate(id);
      notify('تم حذف المندوب', 'info');
      load();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'فشل حذف المندوب', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-brand-600">
        <Loader2 size={28} className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Add form */}
      <div className="bg-white rounded-2xl border border-sand-200 p-5 shadow-card">
        <h3 className="text-base font-extrabold text-sand-900 mb-4 flex items-center gap-2">
          <Bike size={18} className="text-brand-600" />
          إضافة مندوب جديد
        </h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="اسم المندوب"
            className="h-11 rounded-xl bg-sand-50 border border-sand-200 focus:border-brand-500 px-3 text-sm outline-none"
          />
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="رقم الجوال"
            dir="ltr"
            className="h-11 rounded-xl bg-sand-50 border border-sand-200 focus:border-brand-500 px-3 text-sm outline-none text-right"
          />
          <select
            value={zoneId}
            onChange={(e) => setZoneId(e.target.value)}
            className="h-11 rounded-xl bg-sand-50 border border-sand-200 focus:border-brand-500 px-3 text-sm outline-none"
          >
            <option value="">اختر المربع الجغرافي</option>
            {zones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.name}
              </option>
            ))}
          </select>
          <button
            onClick={addDelegate}
            disabled={saving}
            className="h-11 rounded-xl bg-sand-900 hover:bg-sand-800 disabled:bg-sand-400 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            إضافة
          </button>
        </div>
        <p className="text-xs text-sand-500 mt-3">
          إجمالي المناديب: <span className="font-bold text-sand-800">{delegates.length}</span>
        </p>
      </div>

      {/* Delegates list */}
      {delegates.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-sand-300 py-12 flex flex-col items-center text-sand-400">
          <Bike size={40} strokeWidth={1.2} className="mb-2" />
          <p className="font-medium text-sand-600">لا يوجد مناديب بعد</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {delegates.map((d) => {
            const zone = zones.find((z) => z.id === d.zone_id);
            return (
              <div key={d.id} className="bg-white rounded-2xl border border-sand-200 p-4 shadow-card">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <UserRound size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sand-800 line-clamp-1">{d.name}</p>
                    <p className="text-xs text-sand-500" dir="ltr">{d.phone || '—'}</p>
                  </div>
                  <button
                    onClick={() => removeDelegate(d.id, d.name)}
                    className="w-8 h-8 rounded-lg text-sand-400 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-colors"
                    aria-label="حذف"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  {zone && (
                    <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full border border-blue-200 flex items-center gap-1">
                      <MapPinned size={11} />
                      {zone.name}
                    </span>
                  )}
                  <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-full border border-amber-200">
                    {(statsByDelegate.get(d.id)?.activeOrders ?? 0)} جارية
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------------- Zones manager ---------------- */

function ZonesManager() {
  const { notify } = useToast();
  const [zones, setZones] = useState<GeographicZone[]>([]);
  const [delegates, setDelegates] = useState<Delegate[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const load = () => {
    Promise.all([fetchGeographicZones(), fetchDelegates(), fetchAllCustomers(), fetchAllOrders()])
      .then(([z, d, c, o]) => {
        setZones(z);
        setDelegates(d);
        setCustomers(c);
        setOrders(o);
      })
      .catch(() => notify('تعذر تحميل المربعات الجغرافية', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const zoneStats = useMemo(() => {
    const map = new Map<string, ZoneStats>();
    for (const z of zones) {
      map.set(z.id, { customerCount: 0, activeOrders: 0, delegateName: null });
    }
    for (const c of customers) {
      if (c.zone_id) {
        const s = map.get(c.zone_id);
        if (s) s.customerCount += 1;
      }
    }
    for (const d of delegates) {
      if (d.zone_id) {
        const s = map.get(d.zone_id);
        if (s && !s.delegateName) s.delegateName = d.name;
      }
    }
    for (const o of orders) {
      const customer = customers.find((c) => c.id === o.customer_id);
      if (customer?.zone_id && ACTIVE_STATUSES.includes(o.status)) {
        const s = map.get(customer.zone_id);
        if (s) s.activeOrders += 1;
      }
    }
    return map;
  }, [zones, delegates, customers, orders]);

  const addZone = async () => {
    if (!name.trim()) return notify('أدخل اسم المربع / الحي', 'error');
    setSaving(true);
    try {
      await insertGeographicZone(name.trim(), description.trim());
      setName('');
      setDescription('');
      notify('تمت إضافة المربع الجغرافي');
      load();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'فشل إضافة المربع', 'error');
    } finally {
      setSaving(false);
    }
  };

  const removeZone = async (id: string, zoneName: string) => {
    if (!window.confirm(`حذف المربع "${zoneName}"؟ سيتم إزالة ربط العملاء به.`)) return;
    try {
      await deleteGeographicZone(id);
      notify('تم حذف المربع', 'info');
      load();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'فشل حذف المربع', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-brand-600">
        <Loader2 size={28} className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Add form */}
      <div className="bg-white rounded-2xl border border-sand-200 p-5 shadow-card">
        <h3 className="text-base font-extrabold text-sand-900 mb-4 flex items-center gap-2">
          <MapPin size={18} className="text-brand-600" />
          إضافة مربع جديد
        </h3>
        <div className="grid sm:grid-cols-3 gap-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="اسم المربع / الحي"
            className="h-11 rounded-xl bg-sand-50 border border-sand-200 focus:border-brand-500 px-3 text-sm outline-none"
          />
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="وصف اختياري"
            className="h-11 rounded-xl bg-sand-50 border border-sand-200 focus:border-brand-500 px-3 text-sm outline-none"
          />
          <button
            onClick={addZone}
            disabled={saving}
            className="h-11 rounded-xl bg-sand-900 hover:bg-sand-800 disabled:bg-sand-400 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            + مربع جديد
          </button>
        </div>
      </div>

      {/* Zones list */}
      {zones.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-sand-300 py-12 flex flex-col items-center text-sand-400">
          <MapPin size={40} strokeWidth={1.2} className="mb-2" />
          <p className="font-medium text-sand-600">لا توجد مربعات جغرافية بعد</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {zones.map((z) => {
            const s = zoneStats.get(z.id);
            return (
              <div key={z.id} className="bg-white rounded-2xl border border-sand-200 p-4 shadow-card">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                    <MapPin size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sand-800 line-clamp-1">{z.name}</p>
                    {z.description && (
                      <p className="text-xs text-sand-500 line-clamp-2 mt-0.5">{z.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => removeZone(z.id, z.name)}
                    className="w-8 h-8 rounded-lg text-sand-400 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-colors"
                    aria-label="حذف"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full border border-blue-200">
                    {s?.customerCount ?? 0} عميل
                  </span>
                  <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-full border border-amber-200">
                    {s?.activeOrders ?? 0} جارية
                  </span>
                  {s?.delegateName && (
                    <span className="text-[11px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-200 flex items-center gap-1">
                      <Bike size={11} />
                      {s.delegateName}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
