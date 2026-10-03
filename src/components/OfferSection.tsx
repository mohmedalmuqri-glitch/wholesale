import { ShoppingCart, Tag } from 'lucide-react';
import type { OfferCategory, Product } from '@/types';
import { formatSAR } from '@/utils';

type OfferSectionProps = {
  category: OfferCategory;
  products: Product[];
  onAdd: (productId: string) => void;
};

export function OfferSection({ category, products, onAdd }: OfferSectionProps) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-extrabold text-sand-900">{category.name}</h3>
          <p className="mt-1 text-xs text-sand-400">{products.length} عروض متاحة</p>
        </div>
        <Tag size={20} className="text-orange-500" />
      </div>
      <div dir="ltr" className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-3 scrollbar-thin sm:-mx-6 sm:px-6">
        {products.map((product) => (
          <article dir="rtl" key={product.id} className="group w-[190px] shrink-0 overflow-hidden rounded-2xl border border-sand-200 bg-white shadow-card transition hover:-translate-y-0.5 hover:shadow-soft sm:w-[220px]">
            <div className="relative aspect-square overflow-hidden bg-sand-100">
              {product.image ? <img src={product.image} alt={product.name} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center text-sand-300">لا توجد صورة</div>}
              <span className="absolute right-2 top-2 rounded-full bg-red-500 px-2.5 py-1 text-[11px] font-extrabold text-white shadow-sm">-{product.discount_percentage ?? 0}%</span>
            </div>
            <div className="p-3">
              <h4 className="line-clamp-2 min-h-[2.75rem] text-sm font-bold leading-6 text-sand-800">{product.name}</h4>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-xs text-sand-400 line-through">{formatSAR(product.old_price ?? 0)}</span>
                <strong className="text-base font-extrabold text-brand-700">{formatSAR(product.price)}</strong>
              </div>
              <button type="button" onClick={() => onAdd(product.id)} className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-full bg-brand-600 text-xs font-bold text-white shadow-soft transition hover:bg-brand-700 active:scale-95">
                <ShoppingCart size={15} /> إضافة للسلة
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
