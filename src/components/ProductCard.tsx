import { Minus, Package, Plus } from 'lucide-react';
import type { Product } from '@/types';
import { formatSAR } from '@/utils';

type ProductCardOptions = {
  layout: 'grid' | 'list';
  showBadge: boolean;
  showUnitLabel: boolean;
  showQtyControls: boolean;
};

type ProductCardProps = ProductCardOptions & {
  product: Product;
  fullQty: number;
  onAddClick: () => void;
  onInc: () => void;
  onDec: () => void;
};

export function ProductCard({
  product,
  fullQty,
  onAddClick,
  onInc,
  onDec,
  layout,
  showBadge,
  showUnitLabel,
  showQtyControls,
}: ProductCardProps) {
  const badge =
    showBadge && product.half_carton_enabled ? (
      <span className="absolute top-2 left-2 rounded-full bg-theme-badge px-2 py-0.5 text-[10px] font-bold text-white shadow-soft">
        متاح نصف كرتون
      </span>
    ) : null;

  const image = product.image ? (
    <img
      src={product.image}
      alt={product.name}
      loading="lazy"
      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
    />
  ) : (
    <div className="flex h-full w-full items-center justify-center text-sand-200">
      <Package size={layout === 'grid' ? 64 : 36} strokeWidth={1} />
    </div>
  );

  const priceBlock = (
    <div>
      <span className="block text-base font-extrabold leading-none text-brand-700">{formatSAR(product.price)}</span>
      {showUnitLabel && (
        <span className="mt-1 block text-[11px] text-sand-400">
          {product.full_carton_units ? `السعر للكرتون (${product.full_carton_units} حبة)` : 'السعر للكرتون'}
        </span>
      )}
    </div>
  );

  const action = (
    <CardAction
      fullQty={fullQty}
      showQtyControls={showQtyControls}
      onAddClick={onAddClick}
      onInc={onInc}
      onDec={onDec}
    />
  );

  if (layout === 'list') {
    return (
      <article className="group animate-fade-in flex gap-3 overflow-hidden rounded-2xl border border-sand-200 bg-white p-3 shadow-card transition-all duration-300 hover:shadow-soft">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-white">
          {image}
          {badge}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <h3 className="line-clamp-2 text-sm font-bold leading-snug text-sand-800">{product.name}</h3>
          <div className="mt-auto flex items-end justify-between gap-2">
            {priceBlock}
            <div className="w-32 shrink-0">{action}</div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="group animate-fade-in flex flex-col overflow-hidden rounded-2xl border border-sand-200 bg-white shadow-card transition-all duration-300 hover:shadow-soft">
      <div className="relative aspect-square overflow-hidden bg-white">
        {image}
        {badge}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-bold leading-snug text-sand-800">{product.name}</h3>
        <div className="mt-auto">{priceBlock}</div>
        {action}
      </div>
    </article>
  );
}

function CardAction({
  fullQty,
  showQtyControls,
  onAddClick,
  onInc,
  onDec,
}: {
  fullQty: number;
  showQtyControls: boolean;
  onAddClick: () => void;
  onInc: () => void;
  onDec: () => void;
}) {
  if (showQtyControls && fullQty > 0) {
    return (
      <div className="flex h-9 items-center justify-between rounded-full bg-theme-button px-1 text-white shadow-soft">
        <button
          type="button"
          onClick={onDec}
          aria-label="إنقاص الكمية"
          className="flex h-7 w-7 items-center justify-center rounded-full transition hover:bg-white/20 active:scale-90"
        >
          <Minus size={14} />
        </button>
        <span className="min-w-[1.5rem] text-center text-xs font-extrabold">{fullQty}</span>
        <button
          type="button"
          onClick={onInc}
          aria-label="زيادة الكمية"
          className="flex h-7 w-7 items-center justify-center rounded-full transition hover:bg-white/20 active:scale-90"
        >
          <Plus size={14} />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onAddClick}
      className="h-9 w-full rounded-full bg-theme-button text-xs font-bold text-white shadow-soft transition-all hover:brightness-110 active:scale-95"
    >
      إضافة للسلة
    </button>
  );
}
