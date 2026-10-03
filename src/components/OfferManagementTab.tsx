import { useMemo, useRef, useState } from 'react';
import { Edit3, ImagePlus, Loader2, Pencil, Plus, Search, Tag, Trash2, X } from 'lucide-react';
import type { OfferCategory, Product } from '@/types';
import { fileToResizedDataURL } from '@/utils';
import { useToast } from './Toast';
import { deleteOfferCategory, deleteOfferProduct, insertOfferCategory, insertOfferProduct, updateOfferCategory, updateOfferProduct } from '@/lib/offerDb';

type OfferManagementTabProps = {
  categories: OfferCategory[];
  products: Product[];
  onRefresh: () => Promise<void>;
};

type OfferDraft = {
  id?: string;
  image: string;
  name: string;
  categoryId: string;
  discount: string;
  oldPrice: string;
  newPrice: string;
};

const EMPTY_DRAFT: OfferDraft = { image: '', name: '', categoryId: '', discount: '', oldPrice: '', newPrice: '' };

export function OfferManagementTab({ categories, products, onRefresh }: OfferManagementTabProps) {
  const { notify } = useToast();
  const [categoryName, setCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [draft, setDraft] = useState<OfferDraft>(EMPTY_DRAFT);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [categorySaving, setCategorySaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const offerProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return products
      .filter((product) => product.is_offer)
      .filter((product) => !query || product.name.toLowerCase().includes(query));
  }, [products, search]);

  const openAdd = () => {
    setDraft({ ...EMPTY_DRAFT, categoryId: categories[0]?.id ?? '' });
    setShowForm(true);
  };

  const openEdit = (product: Product) => {
    setDraft({
      id: product.id,
      image: product.image,
      name: product.name,
      categoryId: product.offer_category_id ?? '',
      discount: String(product.discount_percentage ?? 0),
      oldPrice: String(product.old_price ?? ''),
      newPrice: String(product.price),
    });
    setShowForm(true);
  };

  const handleImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      notify('الرجاء اختيار ملف صورة فقط', 'error');
      return;
    }
    try {
      const image = await fileToResizedDataURL(file);
      setDraft((current) => ({ ...current, image }));
    } catch {
      notify('تعذر معالجة الصورة', 'error');
    } finally {
      event.target.value = '';
    }
  };

  const saveCategory = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!categoryName.trim()) return;
    setCategorySaving(true);
    try {
      await insertOfferCategory(categoryName);
      setCategoryName('');
      await onRefresh();
      notify('تمت إضافة قسم العرض');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'تعذر إضافة قسم العرض', 'error');
    } finally {
      setCategorySaving(false);
    }
  };

  const saveCategoryEdit = async (id: string) => {
    if (!editingCategoryName.trim()) return;
    try {
      await updateOfferCategory(id, editingCategoryName);
      setEditingCategory(null);
      await onRefresh();
      notify('تم تعديل قسم العرض');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'تعذر تعديل القسم', 'error');
    }
  };

  const removeCategory = async (category: OfferCategory) => {
    if (!window.confirm(`حذف قسم "${category.name}"؟ ستبقى المنتجات محفوظة بدون قسم.`)) return;
    try {
      await deleteOfferCategory(category.id);
      await onRefresh();
      notify('تم حذف قسم العرض', 'info');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'تعذر حذف القسم', 'error');
    }
  };

  const saveOffer = async () => {
    if (!draft.image) return notify('الرجاء رفع صورة المنتج', 'error');
    if (!draft.name.trim()) return notify('الرجاء إدخال اسم المنتج', 'error');
    if (!draft.categoryId) return notify('الرجاء اختيار قسم العرض', 'error');
    const discount = Number(draft.discount);
    const oldPrice = Number(draft.oldPrice);
    const newPrice = Number(draft.newPrice);
    if (!Number.isFinite(discount) || discount < 0 || discount > 100) return notify('نسبة الخصم يجب أن تكون بين 0 و100', 'error');
    if (!Number.isFinite(oldPrice) || oldPrice <= 0) return notify('السعر القديم غير صحيح', 'error');
    if (!Number.isFinite(newPrice) || newPrice < 0) return notify('السعر الجديد غير صحيح', 'error');
    setSaving(true);
    try {
      const data = { name: draft.name, image: draft.image, offerCategoryId: draft.categoryId, discountPercentage: discount, oldPrice, price: newPrice };
      if (draft.id) {
        await updateOfferProduct(draft.id, data);
        notify('تم تحديث منتج العرض');
      } else {
        await insertOfferProduct(data);
        notify('تمت إضافة منتج العرض');
      }
      await onRefresh();
      setShowForm(false);
      setDraft(EMPTY_DRAFT);
    } catch (error) {
      notify(error instanceof Error ? error.message : 'تعذر حفظ منتج العرض', 'error');
    } finally {
      setSaving(false);
    }
  };

  const removeOffer = async (product: Product) => {
    if (!window.confirm(`حذف العرض "${product.name}"؟`)) return;
    try {
      await deleteOfferProduct(product.id);
      await onRefresh();
      notify('تم حذف منتج العرض', 'info');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'تعذر حذف العرض', 'error');
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6" dir="rtl">
      <div>
        <h2 className="text-xl font-extrabold text-sand-900">إدارة العروض والأقسام</h2>
        <p className="mt-1 text-sm text-sand-500">أنشئ أقساماً للعروض وأضف المنتجات المخفّضة التي ستظهر للعملاء.</p>
      </div>

      <section className="rounded-3xl border border-sand-200 bg-white p-5 shadow-card sm:p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-orange-600"><Tag size={21} /></div>
          <div><h3 className="font-extrabold text-sand-900">أقسام العروض</h3><p className="mt-1 text-xs text-sand-500">قسّم عروضك إلى مجموعات واضحة للعميل.</p></div>
        </div>
        <form onSubmit={saveCategory} className="mb-4 flex max-w-xl gap-2">
          <input value={categoryName} onChange={(event) => setCategoryName(event.target.value)} placeholder="اسم قسم جديد مثل: عروض الأسبوع" className="h-11 min-w-0 flex-1 rounded-xl border border-sand-200 bg-sand-50 px-3 text-sm outline-none focus:border-brand-400" />
          <button type="submit" disabled={categorySaving || !categoryName.trim()} className="flex h-11 items-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-bold text-white transition hover:bg-brand-700 disabled:bg-sand-300"><Plus size={17} /> إضافة</button>
        </form>
        {categories.length === 0 ? <p className="rounded-2xl bg-sand-50 p-4 text-sm text-sand-500">أضف أول قسم لتتمكن من إنشاء منتج عرض.</p> : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <div key={category.id} className="flex items-center gap-2 rounded-2xl border border-sand-200 bg-sand-50 p-3">
                {editingCategory === category.id ? (
                  <input autoFocus value={editingCategoryName} onChange={(event) => setEditingCategoryName(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') saveCategoryEdit(category.id); }} className="h-9 min-w-0 flex-1 rounded-lg border border-brand-300 bg-white px-2 text-sm outline-none" />
                ) : <span className="min-w-0 flex-1 truncate text-sm font-bold text-sand-800">{category.name}</span>}
                {editingCategory === category.id ? <button type="button" onClick={() => saveCategoryEdit(category.id)} className="text-xs font-bold text-brand-600">حفظ</button> : <button type="button" onClick={() => { setEditingCategory(category.id); setEditingCategoryName(category.name); }} className="rounded-lg p-2 text-sand-500 hover:bg-white hover:text-brand-600" aria-label="تعديل القسم"><Pencil size={15} /></button>}
                <button type="button" onClick={() => removeCategory(category)} className="rounded-lg p-2 text-sand-400 hover:bg-red-50 hover:text-red-500" aria-label="حذف القسم"><Trash2 size={15} /></button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-sand-200 bg-white p-5 shadow-card sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div><h3 className="font-extrabold text-sand-900">منتجات العروض</h3><p className="mt-1 text-xs text-sand-500">{offerProducts.length} منتج مطابق</p></div>
          <button type="button" onClick={openAdd} disabled={categories.length === 0} className="flex h-11 items-center gap-2 rounded-full bg-orange-500 px-5 text-sm font-bold text-white transition hover:bg-orange-600 disabled:bg-sand-300"><Plus size={17} /> إضافة منتج عرض</button>
        </div>
        <div className="relative mb-4"><Search size={18} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sand-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ابحث عن منتج عرض..." className="h-11 w-full rounded-xl border border-sand-200 bg-sand-50 pr-10 pl-4 text-sm outline-none focus:border-brand-400" /></div>
        {offerProducts.length === 0 ? <div className="rounded-2xl border border-dashed border-sand-300 py-14 text-center text-sm text-sand-500">لا توجد منتجات عروض مطابقة.</div> : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {offerProducts.map((product) => {
              const category = categories.find((item) => item.id === product.offer_category_id);
              return <article key={product.id} className="overflow-hidden rounded-2xl border border-sand-200 bg-sand-50">
                <div className="relative aspect-[16/9] bg-white"><img src={product.image} alt={product.name} className="h-full w-full object-cover" /><span className="absolute right-2 top-2 rounded-full bg-red-500 px-2 py-1 text-[11px] font-extrabold text-white">-{product.discount_percentage}%</span></div>
                <div className="p-3"><p className="font-bold text-sand-800">{product.name}</p><p className="mt-1 text-xs text-sand-500">{category?.name ?? 'بدون قسم'}</p><div className="mt-2 flex items-center gap-2"><span className="text-sm text-sand-400 line-through">{product.old_price} ر.ي</span><strong className="text-base text-brand-700">{product.price} ر.ي</strong></div><div className="mt-3 flex gap-2"><button type="button" onClick={() => openEdit(product)} className="flex h-9 flex-1 items-center justify-center gap-1 rounded-full bg-white text-xs font-bold text-brand-700 hover:bg-brand-50"><Edit3 size={14} /> تعديل</button><button type="button" onClick={() => removeOffer(product)} className="flex h-9 w-10 items-center justify-center rounded-full bg-red-50 text-red-500 hover:bg-red-100" aria-label="حذف العرض"><Trash2 size={15} /></button></div></div>
              </article>;
            })}
          </div>
        )}
      </section>

      {showForm && <OfferForm draft={draft} categories={categories} saving={saving} fileRef={fileRef} onDraftChange={setDraft} onFileChange={handleImage} onSave={saveOffer} onClose={() => { setShowForm(false); setDraft(EMPTY_DRAFT); }} />}
    </div>
  );
}

function OfferForm({ draft, categories, saving, fileRef, onDraftChange, onFileChange, onSave, onClose }: { draft: OfferDraft; categories: OfferCategory[]; saving: boolean; fileRef: React.RefObject<HTMLInputElement>; onDraftChange: (draft: OfferDraft) => void; onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void; onSave: () => void; onClose: () => void }) {
  const set = (patch: Partial<OfferDraft>) => onDraftChange({ ...draft, ...patch });
  return <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4"><div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} /><div className="relative max-h-[94vh] w-full overflow-y-auto rounded-t-3xl bg-sand-50 shadow-2xl sm:max-w-xl sm:rounded-3xl"><div className="sticky top-0 z-10 flex items-center justify-between border-b border-sand-200 bg-white px-5 py-4"><h2 className="font-extrabold text-sand-900">{draft.id ? 'تعديل منتج العرض' : 'إضافة منتج عرض'}</h2><button type="button" onClick={onClose} className="rounded-full p-2 text-sand-400 hover:bg-sand-100" aria-label="إغلاق"><X size={20} /></button></div><div className="space-y-4 p-5">
    <div><label className="mb-2 block text-sm font-bold text-sand-700">صورة المنتج</label><input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} /><button type="button" onClick={() => fileRef.current?.click()} className="flex w-full items-center gap-3 rounded-2xl border-2 border-dashed border-sand-300 bg-white p-3 text-right hover:border-brand-400"><div className="h-24 w-32 overflow-hidden rounded-xl bg-sand-100">{draft.image ? <img src={draft.image} alt="معاينة المنتج" className="h-full w-full object-cover" /> : <ImagePlus className="mx-auto mt-7 text-sand-400" size={25} />}</div><span className="text-sm font-bold text-sand-600">اختيار صورة من الجهاز</span></button></div>
    <label className="block text-sm font-bold text-sand-700">اسم المنتج<input value={draft.name} onChange={(event) => set({ name: event.target.value })} className="mt-1.5 h-11 w-full rounded-xl border border-sand-200 bg-white px-3 font-normal outline-none focus:border-brand-400" placeholder="مثال: مشروب منعش" /></label>
    <label className="block text-sm font-bold text-sand-700">قسم العرض<select value={draft.categoryId} onChange={(event) => set({ categoryId: event.target.value })} className="mt-1.5 h-11 w-full rounded-xl border border-sand-200 bg-white px-3 font-normal outline-none focus:border-brand-400">{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
    <div className="grid grid-cols-2 gap-3"><label className="block text-sm font-bold text-sand-700">نسبة الخصم %<input type="number" min="0" max="100" value={draft.discount} onChange={(event) => set({ discount: event.target.value })} className="mt-1.5 h-11 w-full rounded-xl border border-sand-200 bg-white px-3 font-normal outline-none focus:border-brand-400" /></label><label className="block text-sm font-bold text-sand-700">السعر القديم<input type="number" min="0" step="0.01" value={draft.oldPrice} onChange={(event) => set({ oldPrice: event.target.value })} className="mt-1.5 h-11 w-full rounded-xl border border-sand-200 bg-white px-3 font-normal outline-none focus:border-brand-400" /></label></div>
    <label className="block text-sm font-bold text-sand-700">السعر الجديد بعد الخصم<input type="number" min="0" step="0.01" value={draft.newPrice} onChange={(event) => set({ newPrice: event.target.value })} className="mt-1.5 h-11 w-full rounded-xl border border-sand-200 bg-white px-3 font-normal outline-none focus:border-brand-400" /></label>
  </div><div className="sticky bottom-0 flex gap-2 border-t border-sand-200 bg-white px-5 py-3"><button type="button" onClick={onClose} className="h-11 flex-1 rounded-full border border-sand-300 font-bold text-sand-700">إلغاء</button><button type="button" onClick={onSave} disabled={saving} className="flex h-11 flex-[2] items-center justify-center gap-2 rounded-full bg-brand-600 font-bold text-white hover:bg-brand-700 disabled:bg-sand-300">{saving ? <Loader2 size={17} className="animate-spin" /> : <Plus size={17} />} حفظ</button></div></div></div>;
}
