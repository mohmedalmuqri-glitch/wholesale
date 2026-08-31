import { ClipboardList, Store, UserRound } from 'lucide-react';

export type BottomTab = 'store' | 'orders' | 'profile';

type BottomNavProps = {
  activeTab: BottomTab;
  onChange: (tab: BottomTab) => void;
};

const tabs: Array<{ id: BottomTab; label: string; icon: typeof Store }> = [
  { id: 'store', label: 'المتجر', icon: Store },
  { id: 'orders', label: 'الطلبات', icon: ClipboardList },
  { id: 'profile', label: 'صفحتي', icon: UserRound },
];

export function BottomNav({ activeTab, onChange }: BottomNavProps) {
  return (
    <nav
      aria-label="التنقل الرئيسي"
      className="fixed bottom-0 inset-x-0 z-30 border-t border-sand-200 bg-white/95 shadow-[0_-8px_28px_rgba(28,25,23,0.08)] backdrop-blur-md"
    >
      <div className="mx-auto grid max-w-5xl grid-cols-3 px-3 pb-[max(10px,env(safe-area-inset-bottom))] pt-2">
        {tabs.map(({ id, label, icon: Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              aria-current={active ? 'page' : undefined}
              className={`flex min-h-[66px] flex-col items-center justify-center gap-1 rounded-2xl text-xs font-bold transition-all active:scale-95 ${
                active ? 'text-violet-600' : 'text-sand-300 hover:text-sand-500'
              }`}
            >
              <Icon size={25} strokeWidth={active ? 2.5 : 1.9} />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
