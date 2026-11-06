import { ClipboardList, Home, Percent, Store, UserRound, type LucideIcon } from 'lucide-react';
import { NAV_TAB_LABELS, type BottomTab } from '@/types';

type BottomNavProps = {
  activeTab: BottomTab;
  onChange: (tab: BottomTab) => void;
  order: BottomTab[];
  hideOffers?: boolean;
};

const TAB_ICONS: Record<BottomTab, LucideIcon> = {
  home: Home,
  offers: Percent,
  store: Store,
  orders: ClipboardList,
  profile: UserRound,
};

export function BottomNav({ activeTab, onChange, order, hideOffers = false }: BottomNavProps) {
  const tabs = order.filter((id) => !(hideOffers && id === 'offers'));

  return (
    <nav
      aria-label="التنقل الرئيسي"
      className="fixed bottom-0 inset-x-0 z-30 border-t border-sand-200 bg-white/95 shadow-[0_-8px_28px_rgba(28,25,23,0.08)] backdrop-blur-md"
    >
      <div
        className="mx-auto grid max-w-5xl px-2 pb-[max(10px,env(safe-area-inset-bottom))] pt-2"
        style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
      >
        {tabs.map((id) => {
          const Icon = TAB_ICONS[id];
          const active = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              aria-current={active ? 'page' : undefined}
              className={`flex min-h-[66px] flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-bold transition-all active:scale-95 ${
                active ? 'text-theme-active' : 'text-sand-400 hover:text-theme-active'
              }`}
            >
              <Icon size={25} strokeWidth={active ? 2.5 : 1.9} />
              <span>{NAV_TAB_LABELS[id]}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
