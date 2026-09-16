import { useEffect, useState } from 'react';
import { Lock, Loader2, ArrowRight } from 'lucide-react';
import type { AppSettings } from '@/types';
import { fetchSettings } from '@/lib/db';
import { useToast } from './Toast';
import { navigate } from '@/hooks/useHashRoute';

type AdminGateProps = {
  children: React.ReactNode;
};

export function AdminGate({ children }: AdminGateProps) {
  const { notify } = useToast();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pinInput, setPinInput] = useState('');

  useEffect(() => {
    fetchSettings()
      .then((value) => {
        setSettings(value);
        if (!value.pin_required) setUnlocked(true);
      })
      .catch(() => notify('تعذر تحميل إعدادات الأمان', 'error'))
      .finally(() => setLoading(false));
  }, [notify]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-brand-600">
        <Loader2 size={40} className="animate-spin" />
        <p className="text-sm font-medium">جارٍ التحقق...</p>
      </div>
    );
  }

  if (unlocked) return <>{children}</>;

  const submitPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    if (pinInput.replace(/\D/g, '') === settings.admin_pin) {
      setUnlocked(true);
      setPinInput('');
      notify('تم فتح لوحة التحكم');
    } else {
      notify('الرمز غير صحيح', 'error');
      setPinInput('');
    }
  };

  return (
    <div className="min-h-screen bg-sand-900 flex items-center justify-center px-6" dir="rtl">
      <form
        onSubmit={submitPin}
        className="w-full max-w-sm bg-sand-50 rounded-3xl shadow-2xl p-8 text-center"
      >
        <div className="w-16 h-16 rounded-2xl bg-brand-600 text-white flex items-center justify-center mx-auto mb-5">
          <Lock size={28} />
        </div>
        <h1 className="text-xl font-extrabold text-sand-900 mb-2">لوحة التحكم محمية</h1>
        <p className="text-sm text-sand-500 mb-6">أدخل الرمز السري للمتابعة</p>
        <input
          type="password"
          inputMode="numeric"
          autoFocus
          value={pinInput}
          onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
          placeholder="• • • •"
          className="w-full h-14 rounded-2xl border border-sand-200 bg-white px-4 text-center text-2xl tracking-[0.5em] outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          dir="ltr"
        />
        <button
          type="submit"
          className="mt-5 w-full h-12 rounded-full bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm transition-colors shadow-soft flex items-center justify-center gap-2"
        >
          <ArrowRight size={18} />
          دخول
        </button>
        <button
          type="button"
          onClick={() => navigate('store')}
          className="mt-3 text-sm text-sand-500 hover:text-sand-800 transition-colors"
        >
          العودة للمتجر
        </button>
      </form>
    </div>
  );
}
