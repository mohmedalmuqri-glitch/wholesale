import { Bike, ChevronLeft, Info, MapPin, Phone } from 'lucide-react';
import type { DriverSession } from '@/types';

type DriverMorePageProps = {
  session: DriverSession;
};

const MENU_ITEMS = [
  { id: 'zone', label: 'المربع الجغرافي', icon: MapPin },
  { id: 'contact', label: 'رقم التواصل', icon: Phone },
  { id: 'about', label: 'حول التطبيق', icon: Info },
] as const;

export function DriverMorePage({ session }: DriverMorePageProps) {
  return (
    <div className="space-y-5">
      <h2 className="text-lg font-extrabold text-sand-900">المزيد</h2>

      <section className="flex items-center gap-4 rounded-3xl border border-sand-200 bg-white p-5 shadow-card">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-600 text-white">
          <Bike size={26} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-base font-extrabold text-sand-900">{session.name}</p>
          <p className="mt-0.5 text-xs text-sand-500">مندوب توصيل</p>
        </div>
      </section>

      <nav className="overflow-hidden rounded-3xl border border-sand-200 bg-white shadow-card">
        {MENU_ITEMS.map(({ id, label, icon: Icon }, index) => (
          <button
            key={id}
            type="button"
            className={`flex w-full items-center gap-3 px-5 py-4 text-right transition-colors hover:bg-sand-50 ${
              index > 0 ? 'border-t border-sand-100' : ''
            }`}
          >
            <Icon size={20} className="shrink-0 text-sand-400" />
            <span className="flex-1 text-sm font-bold text-sand-800">{label}</span>
            <ChevronLeft size={18} className="text-sand-300" />
          </button>
        ))}
      </nav>

      <p className="text-center text-xs text-sand-400">هذه الصفحة جاهزة لإضافة المحتوى لاحقاً</p>
    </div>
  );
}
