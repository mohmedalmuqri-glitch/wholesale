import { useState } from 'react';
import {
  UserRound,
  Store,
  Phone,
  MapPin,
  Save,
  Loader2,
  Settings,
  Navigation,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';
import type { Customer } from '@/types';
import { insertCustomer } from '@/lib/db';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { STORAGE_KEYS } from '@/types';
import { useToast } from './Toast';
import { navigate } from '@/hooks/useHashRoute';

type ProfileTabProps = {
  customer: Customer | null;
  onSaved: (c: Customer) => void;
};

export function ProfileTab({ customer, onSaved }: ProfileTabProps) {
  const { notify } = useToast();
  const [customerId] = useLocalStorage<string | null>(STORAGE_KEYS.customerId, null);
  const [userName, setUserName] = useState(customer?.user_name ?? '');
  const [businessName, setBusinessName] = useState(customer?.business_name ?? '');
  const [phone, setPhone] = useState(customer?.phone ?? '');
  const [lat, setLat] = useState<number | null>(customer?.latitude ?? null);
  const [lng, setLng] = useState<number | null>(customer?.longitude ?? null);
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);

  const useGPS = () => {
    if (!navigator.geolocation) {
      notify('المتصفح لا يدعم تحديد الموقع', 'error');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setLocating(false);
        notify('تم تحديد موقعك الحالي');
      },
      (err) => {
        setLocating(false);
        notify(err.message || 'تعذر تحديد الموقع', 'error');
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const mapsUrl =
    lat != null && lng != null
      ? `https://www.google.com/maps?q=${lat},${lng}`
      : '';

  const save = async () => {
    if (!userName.trim()) return notify('الرجاء إدخال اسم المستخدم', 'error');
    if (!businessName.trim()) return notify('الرجاء إدخال اسم النشاط التجاري', 'error');
    if (!phone.trim()) return notify('الرجاء إدخال رقم الهاتف', 'error');

    setSaving(true);
    try {
      const row = await insertCustomer(
        userName.trim(),
        businessName.trim(),
        phone.trim(),
        lat,
        lng
      );
      if (row) {
        onSaved(row);
        notify('تم حفظ بياناتك بنجاح');
      }
    } catch (err) {
      notify(err instanceof Error ? err.message : 'فشل حفظ البيانات', 'error');
    } finally {
      setSaving(false);
    }
  };

  const hasData = !!customerId && !!customer;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-32">
      <div className="max-w-md mx-auto">
        {/* Header card */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-3xl bg-violet-100 text-violet-600 flex items-center justify-center mx-auto mb-3 shadow-soft">
            <UserRound size={32} />
          </div>
          <h1 className="text-xl font-extrabold text-sand-900">صفحتي</h1>
          <p className="text-sm text-sand-500 mt-1">
            {hasData ? 'تم تسجيل بياناتك' : 'سجل بيانات منشأتك لمتابعة الطلبات'}
          </p>
        </div>

        {hasData && (
          <div className="flex items-center justify-center gap-2 mb-6 text-green-600 text-sm font-bold">
            <CheckCircle2 size={18} />
            بياناتك مسجلة - يمكنك الطلب الآن
          </div>
        )}

        {/* Form */}
        <div className="bg-white rounded-3xl border border-sand-200 shadow-card p-5 space-y-4">
          <FormField label="اسم المستخدم" icon={<UserRound size={18} />}>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="الاسم الكامل"
              className="w-full h-11 rounded-xl bg-sand-50 border border-sand-200 focus:border-violet-400 px-3 text-sm outline-none transition-all"
            />
          </FormField>

          <FormField label="اسم النشاط التجاري / المحل" icon={<Store size={18} />}>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="مثال: بقالة النور"
              className="w-full h-11 rounded-xl bg-sand-50 border border-sand-200 focus:border-violet-400 px-3 text-sm outline-none transition-all"
            />
          </FormField>

          <FormField label="رقم الهاتف" icon={<Phone size={18} />}>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="05xxxxxxxx"
              className="w-full h-11 rounded-xl bg-sand-50 border border-sand-200 focus:border-violet-400 px-3 text-sm outline-none transition-all"
            />
          </FormField>

          {/* Location section */}
          <div className="pt-2 border-t border-sand-100">
            <label className="block text-sm font-bold text-sand-700 mb-2">الموقع</label>

            <button
              onClick={useGPS}
              disabled={locating}
              className="w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-violet-50 border border-violet-200 text-violet-700 font-bold text-sm hover:bg-violet-100 transition-colors mb-3"
            >
              {locating ? <Loader2 size={18} className="animate-spin" /> : <Navigation size={18} />}
              تحديد الموقع الحالي عبر GPS
            </button>

            {lat != null && lng != null && (
              <div className="bg-violet-50 rounded-2xl p-3 space-y-2">
                <div className="flex items-center gap-2 text-xs text-sand-600">
                  <MapPin size={14} className="text-violet-500" />
                  <span>الإحداثيات:</span>
                  <span className="font-mono font-bold">{lat.toFixed(6)}, {lng.toFixed(6)}</span>
                </div>
                <a
                  href={`https://www.google.com/maps?q=${lat},${lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 h-10 rounded-xl bg-white border border-violet-200 text-violet-700 font-bold text-xs hover:bg-violet-50 transition-colors"
                >
                  <ExternalLink size={14} />
                  تأكيد من خريطة Google
                </a>
              </div>
            )}
          </div>

          {/* Save button */}
          <button
            onClick={save}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 h-12 rounded-full bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 text-white font-bold text-sm transition-colors shadow-soft active:scale-95"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            حفظ ومتابعة
          </button>
        </div>

        {/* Admin link */}
        <button
          onClick={() => navigate('admin')}
          className="w-full mt-4 flex items-center justify-center gap-2 h-12 rounded-full bg-sand-900 hover:bg-sand-800 text-white font-bold text-sm transition-colors shadow-soft active:scale-95"
        >
          <Settings size={18} />
          لوحة التحكم
        </button>
      </div>
    </div>
  );
}

function FormField({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-sm font-bold text-sand-700 mb-1.5">
        {icon}
        {label}
      </label>
      {children}
    </div>
  );
}
