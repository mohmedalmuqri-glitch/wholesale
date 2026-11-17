import { ClipboardList, MoreHorizontal, type LucideIcon } from 'lucide-react';

export type DriverTab = 'orders' | 'more';

export const DRIVER_TAB_LABELS: Record<DriverTab, string> = {
  orders: 'الطلبات',
  more: 'المزيد',
};

const DRIVER_TABS: Array<{ id: DriverTab; icon: LucideIcon }> = [
  { id: 'orders', icon: ClipboardList },
  { id: 'more', icon: MoreHorizontal },
];

type DriverBottomNavProps = {
  activeTab: DriverTab;
  onChange: (tab: DriverTab) => void;
};

export function DriverBottomNav({ activeTab, onChange }: DriverBottomNavProps) {
  return (
    <nav
      aria-label="التنقل الرئيسي للمندوب"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-sand-200 bg-white/95 shadow-[0_-8px_28px_rgba(28,25,23,0.08)] backdrop-blur-md"
    >
      <div className="mx-auto grid max-w-3xl grid-cols-2 px-2 pb-[max(10px,env(safe-area-inset-bottom))] pt-2">
        {DRIVER_TABS.map(({ id, icon: Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              aria-current={active ? 'page' : undefined}
              className={`flex min-h-[60px] flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-bold transition-all active:scale-95 ${
                active ? 'text-brand-700' : 'text-sand-400 hover:text-brand-700'
              }`}
            >
              <Icon size={24} strokeWidth={active ? 2.5 : 1.9} />
              <span>{DRIVER_TAB_LABELS[id]}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
