import { useState, type FormEvent } from 'react';
import { Bike, Loader2, Lock, Phone } from 'lucide-react';
import { loginDriver } from '@/lib/db';
import type { DriverSession } from '@/types';

type DriverLoginProps = {
  onLogin: (session: DriverSession) => void;
};

export function DriverLogin({ onLogin }: DriverLoginProps) {
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!phone.trim() || !pin) {
      setError('أدخل رقم الجوال والرمز السري');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const session = await loginDriver(phone.trim(), pin);
      if (session) {
        onLogin(session);
      } else {
        setError('رقم الجوال أو الرمز السري غير صحيح');
      }
    } catch {
      setError('تعذر تسجيل الدخول، حاول مرة أخرى');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-sand-50 flex items-center justify-center px-4 py-10" dir="rtl">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-card">
            <Bike size={32} />
          </span>
          <h1 className="text-2xl font-extrabold text-sand-900">تطبيق المناديب</h1>
          <p className="mt-1 text-sm text-sand-500">سجّل الدخول برقم جوالك والرمز السري</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-sand-200 bg-white p-6 shadow-card">
          <label className="block">
            <span className="mb-1.5 block text-sm font-bold text-sand-700">رقم الجوال</span>
            <div className="relative">
              <Phone size={18} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sand-400" />
              <input
                type="tel"
                inputMode="tel"
                autoComplete="username"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                dir="ltr"
                className="h-12 w-full rounded-xl border border-sand-200 bg-sand-50 pl-4 pr-10 text-right text-sm outline-none transition-colors focus:border-brand-500"
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-bold text-sand-700">الرمز السري</span>
            <div className="relative">
              <Lock size={18} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sand-400" />
              <input
                type="password"
                inputMode="numeric"
                autoComplete="current-password"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                dir="ltr"
                className="h-12 w-full rounded-xl border border-sand-200 bg-sand-50 pl-4 pr-10 text-right text-sm tracking-[0.3em] outline-none transition-colors focus:border-brand-500"
              />
            </div>
          </label>

          {error && (
            <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 text-sm font-bold text-white transition-colors hover:bg-brand-700 disabled:bg-sand-300"
          >
            {submitting && <Loader2 size={18} className="animate-spin" />}
            تسجيل الدخول
          </button>
        </form>
      </div>
    </div>
  );
}
