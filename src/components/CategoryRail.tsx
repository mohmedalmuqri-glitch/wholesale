import { useEffect, useState } from 'react';
import { Boxes, Grid3x3, X } from 'lucide-react';
import type { Category } from '@/types';

type Props = {
  categories: Category[];
  activeCat: string;
  onSelect: (id: string) => void;
};

export function CategoryRail({ categories, activeCat, onSelect }: Props) {
  const [showGrid, setShowGrid] = useState(false);
  const [pressedId, setPressedId] = useState<string | null>(null);

  const sorted = [...categories].sort((a, b) => a.sort_order - b.sort_order);
  const railItems = sorted.slice(0, 8);

  useEffect(() => {
    if (!pressedId) return;
    const timer = window.setTimeout(() => setPressedId(null), 600);
    return () => window.clearTimeout(timer);
  }, [pressedId]);

  const handleSelect = (id: string) => {
    setPressedId(id);
    onSelect(id);
  };

  if (categories.length === 0) return null;

  return (
    <div className="flex items-center gap-2" dir="ltr">
      <button
        type="button"
        onClick={() => setShowGrid(true)}
        className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-2xl border border-sand-200 bg-white text-sand-600 transition hover:border-brand-300 hover:text-brand-700 active:scale-95"
        aria-label="كل التصنيفات"
      >
        <Grid3x3 size={18} />
      </button>

      <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-0.5" dir="ltr">
        {railItems.map((cat) => {
          const isActive = activeCat === cat.id;
          const isPressed = pressedId === cat.id;
          const img = isPressed && cat.active_image ? cat.active_image : cat.image;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleSelect(cat.id)}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border-2 bg-white transition-all active:scale-90"
              style={{
                borderColor: isActive ? '#059669' : isPressed ? '#f97316' : '#e7e5e4',
                backgroundColor: isActive ? '#ecfdf5' : '#ffffff',
              }}
              aria-label={cat.name}
            >
              {img ? (
                <img
                  src={img}
                  alt={cat.name}
                  className="h-8 w-8 object-contain transition-opacity duration-200"
                />
              ) : (
                <Boxes size={20} className="text-sand-400" />
              )}
            </button>
          );
        })}
      </div>

      {showGrid && (
        <CategoryGridPopup
          categories={sorted}
          activeCat={activeCat}
          onSelect={(id) => {
            handleSelect(id);
            setShowGrid(false);
          }}
          onClose={() => setShowGrid(false)}
        />
      )}
    </div>
  );
}

function CategoryGridPopup({
  categories,
  activeCat,
  onSelect,
  onClose,
}: {
  categories: Category[];
  activeCat: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  const [pressedId, setPressedId] = useState<string | null>(null);

  useEffect(() => {
    if (!pressedId) return;
    const timer = window.setTimeout(() => setPressedId(null), 600);
    return () => window.clearTimeout(timer);
  }, [pressedId]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4" dir="rtl">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-t-3xl bg-white shadow-2xl animate-pop-in sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-sand-200 px-5 py-4">
          <h3 className="font-extrabold text-sand-900">كل التصنيفات</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-sand-400 hover:bg-sand-100"
            aria-label="إغلاق"
          >
            <X size={20} />
          </button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-4">
          <button
            type="button"
            onClick={() => {
              onSelect('all');
              onClose();
            }}
            className="flex h-20 w-full items-center justify-center gap-2 rounded-2xl border-2 bg-brand-50 text-sm font-bold text-brand-700 transition active:scale-95"
            style={{ borderColor: activeCat === 'all' ? '#059669' : '#d1fae5' }}
          >
            <Boxes size={20} />
            عرض الكل
          </button>
          <div className="mt-3 grid grid-cols-4 gap-3">
            {categories.map((cat) => {
              const isActive = activeCat === cat.id;
              const isPressed = pressedId === cat.id;
              const img = isPressed && cat.active_image ? cat.active_image : cat.image;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setPressedId(cat.id);
                    onSelect(cat.id);
                  }}
                  className="flex flex-col items-center gap-1.5 rounded-2xl border-2 bg-white p-2 transition-all active:scale-90"
                  style={{
                    borderColor: isActive ? '#059669' : '#e7e5e4',
                    backgroundColor: isActive ? '#ecfdf5' : '#ffffff',
                  }}
                  aria-label={cat.name}
                >
                  <div className="flex h-12 w-12 items-center justify-center">
                    {img ? (
                      <img src={img} alt={cat.name} className="h-12 w-12 object-contain" />
                    ) : (
                      <Boxes size={22} className="text-sand-400" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
