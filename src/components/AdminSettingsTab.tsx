import { useEffect, useState } from 'react';
import { Check, KeyRound, Loader2, Phone, ShieldCheck } from 'lucide-react';
import type { AppSettings } from '@/types';
import { fetchSettings, updateSettings } from '@/lib/db';
import { useToast } from './Toast';

export function AdminSettingsTab() {
  const { notify } = useToast();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('967781995868');
  const [loading, setLoading] = useState(true);
  const [savingPin, setSavingPin] = useState(false);
  const [savingNumber, setSavingNumber] = useState(false);
  const [savingToggle, setSavingToggle] = useState(false);

  useEffect(() => {
    fetchSettings()
      .then((value) => {
        setSettings(value);
        setWhatsappNumber(value.whatsapp_number || '967781995868');
      })
      .catch(() => notify('تعذر تحميل إعدادات الأمان والتواصل', 'error'))
      .finally(() => setLoading(false));
  }, [notify]);

  const savePin = async () => {
    if (newPin.length < 4) {
      notify('الرمز السري يجب أن يتكون من 4 أرقام على الأقل', 'error');
      return;
    }
    if (newPin !== confirmPin) {
      notify('تأكيد الرمز السري غير مطابق', 'error');
      return;
    }
    setSavingPin(true);
    try {
      const updated = await updateSettings({ admin_pin: newPin });
      setSettings(updated);
      setNewPin('');
      setConfirmPin('');
      notify('تم حفظ الرمز الجديد');
    } catch {
      notify('تعذر حفظ الرمز الجديد', 'error');
    } finally {
      setSavingPin(false);
    }
  };

  const saveNumber = async () => {
    const normalized = whatsappNumber.replace(/\D/g, '');
    if (normalized.length < 8) {
      notify('أدخل رقم واتساب دولياً بدون علامة +', 'error');
      return;
    }
    setSavingNumber(true);
    try {
      const updated = await updateSettings({ whatsapp_number: normalized });
      setSettings(updated);
      setWhatsappNumber(updated.whatsapp_number);
      notify('تم حفظ رقم واتساب المورد');
    } catch {
      notify('تعذر حفظ رقم واتساب المورد', 'error');
    } finally {
      setSavingNumber(false);
    }
  };

  const togglePinRequired = async () => {
    if (!settings) return;
    setSavingToggle(true);
    try {
      const updated = await updateSettings({ pin_required: !settings.pin_required });
      setSettings(updated);
      notify(updated.pin_required ? 'تم تفعيل الرمز السري' : 'تم فتح لوحة التحكم بدون رمز');
    } catch {
      notify('تعذر تحديث خيار الرمز السري', 'error');
    } finally {
      setSavingToggle(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[360px] flex items-center justify-center text-brand-600">
        <Loader2 size={30} className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5" dir="rtl">
      <div>
        <h2 className="text-xl font-extrabold text-sand-900">إعدادات الأمان والتواصل</h2>
        <p className="text-sm text-sand-500 mt-1">تحكم في طريقة دخول لوحة التحكم ورقم استقبال الطلبات.</p>
      </div>

      <section className="bg-white rounded-3xl border border-sand-200 shadow-card p-5 sm:p-7">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center">
            <KeyRound size={22} />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-sand-900">تغيير الرمز السري</h3>
            <p className="text-xs text-sand-500 mt-1">استخدم رمزاً يسهل تذكره ولا تشاركه مع العملاء.</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm font-bold text-sand-700">الرمز الجديد</span>
            <input
              type="password"
              inputMode="numeric"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
              placeholder="أدخل الرمز الجديد"
              className="mt-2 w-full h-12 rounded-2xl border border-sand-200 bg-sand-50 px-4 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
          </label>
          <label className="block">
            <span className="text-sm font-bold text-sand-700">تأكيد الرمز الجديد</span>
            <input
              type="password"
              inputMode="numeric"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
              placeholder="أعد كتابة الرمز الجديد"
              className="mt-2 w-full h-12 rounded-2xl border border-sand-200 bg-sand-50 px-4 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
          </label>
        </div>

        <button
          onClick={savePin}
          disabled={savingPin}
          className="mt-5 h-11 px-5 rounded-full bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-bold text-sm transition-colors flex items-center gap-2"
        >
          {savingPin ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
          حفظ الرمز الجديد
        </button>

        <div className="mt-7 pt-5 border-t border-sand-100 flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <ShieldCheck size={20} className="text-brand-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-bold text-sand-800 text-sm">فتح لوحة التحكم بدون رمز</p>
              <p className="text-xs text-sand-500 mt-1">عند التفعيل لن تظهر شاشة الرمز عند فتح /admin.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={togglePinRequired}
            disabled={savingToggle || !settings}
            aria-label="تبديل طلب الرمز السري"
            className={`relative w-14 h-8 rounded-full transition-colors shrink-0 ${
              settings?.pin_required ? 'bg-brand-600' : 'bg-sand-300'
            }`}
          >
            <span
              className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow transition-transform ${
                settings?.pin_required ? 'right-1' : 'right-7'
              }`}
            />
          </button>
        </div>
      </section>

      <section className="bg-white rounded-3xl border border-sand-200 shadow-card p-5 sm:p-7">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center">
            <Phone size={22} />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-sand-900">رقم واتساب المورد</h3>
            <p className="text-xs text-sand-500 mt-1">مستقبل الطلبات</p>
          </div>
        </div>
        <p className="text-sm text-sand-600 leading-7 mb-4">
          يُستخدم في زر «إرسال الطلب عبر الواتساب» لدى البقال. أدخل الرقم بصيغة دولية بدون +.
        </p>
        <input
          type="tel"
          inputMode="numeric"
          value={whatsappNumber}
          onChange={(e) => setWhatsappNumber(e.target.value.replace(/\D/g, ''))}
          placeholder="967781995868"
          className="w-full h-12 rounded-2xl border border-sand-200 bg-sand-50 px-4 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          dir="ltr"
        />
        <button
          onClick={saveNumber}
          disabled={savingNumber}
          className="mt-4 h-11 px-5 rounded-full bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-bold text-sm transition-colors flex items-center gap-2"
        >
          {savingNumber ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
          حفظ الرقم
        </button>
      </section>
    </div>
  );
}
