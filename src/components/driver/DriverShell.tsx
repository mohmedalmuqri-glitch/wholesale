import { useState } from 'react';
import { Bike, LogOut } from 'lucide-react';
import type { DriverSession } from '@/types';
import { DRIVER_TAB_LABELS, DriverBottomNav, type DriverTab } from './DriverBottomNav';

type DriverShellProps = {
  session: DriverSession;
  onLogout: () => void;
};

export function DriverShell({ session, onLogout }: DriverShellProps) {
  const [tab, setTab] = useState<DriverTab>('orders');

  return (
    <div className="min-h-screen bg-sand-50 pb-28" dir="rtl">
      <header className="sticky top-0 z-20 border-b border-sand-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white">
              <Bike size={20} />
            </span>
            <div className="min-w-0">
              <p className="text-xs text-sand-500">مرحباً</p>
              <p className="truncate text-sm font-extrabold text-sand-900">{session.name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onLogout}
            aria-label="تسجيل الخروج"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sand-500 transition-colors hover:bg-sand-100 hover:text-sand-800"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="text-xl font-extrabold text-sand-900">{DRIVER_TAB_LABELS[tab]}</h1>
        <div className="mt-6 flex min-h-[320px] items-center justify-center rounded-3xl border border-dashed border-sand-300 bg-white" />
      </main>

      <DriverBottomNav activeTab={tab} onChange={setTab} />
    </div>
  );
}
