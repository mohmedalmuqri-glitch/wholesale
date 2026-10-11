import { useRef, useState } from 'react';
import { Boxes, ImagePlus, Loader2, Pencil, Plus, Trash2, X } from 'lucide-react';
import type { Category, Product } from '@/types';
import { fileToResizedDataURL } from '@/utils';
import { deleteCategory, insertCategory, updateCategory } from '@/lib/db';
import { useToast } from './Toast';

type Props = { categories: Category[]; products: Product[]; onRefresh: () => Promise<void> };
type Draft = { id?: string; name: string; image: string; activeImage: string; parentId: string; sortOrder: string };
const EMPTY: Draft = { name: '', image: '', activeImage: '', parentId: '', sortOrder: '0' };

export function CategoriesManagementTab({ categories, products, onRefresh }: Props) {
  const { notify } = useToast();
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const imageRef = useRef<HTMLInputElement>(null);
  const activeImageRef = useRef<HTMLInputElement>(null);

  const pickImage = async (event: React.ChangeEvent<HTMLInputElement>, key: 'image' | 'activeImage') => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      notify('الرجاء اختيار ملف صورة فقط', 'error');
      return;
    }
    try {
      const image = await fileToResizedDataURL(file);
      setDraft((current) => ({ ...current, [key]: image }));
    } catch {
      notify('تعذر معالجة الصورة', 'error');
    } finally {
      event.target.value = '';
    }
  };

  const save = async () => {
    if (!draft.name.trim()) return notify('الرجاء إدخال اسم التصنيف', 'error');
    const sortOrder = Number(draft.sortOrder);
    if (!Number.isInteger(sortOrder) || sortOrder < 0) return notify('ترتيب التصنيف غير صحيح', 'error');
    if (draft.parentId === draft.id) return notify('لا يمكن جعل التصنيف تابعاً لنفسه', 'error');
    setSaving(true);
    try {
      if (draft.id) {
        await updateCategory(draft.id, {
          name: draft.name.trim(),
          image: draft.image,
          active_image: draft.activeImage,
          parent_id: draft.parentId || null,
          sort_order: sortOrder,
        });
        notify('تم تحديث التصنيف');
      } else {
        await insertCategory(draft.name, '#059669', draft.image, draft.activeImage, draft.parentId || null, sortOrder);
        notify('تمت إضافة التصنيف');
      }
      await onRefresh();
      setDraft(EMPTY);
      setOpen(false);
    } catch (error) {
      notify(error instanceof Error ? error.message : 'تعذر حفظ التصنيف', 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (category: Category) => {
    const linked = products.filter((product) => product.category_id === category.id).length;
    if (!window.confirm(linked ? `التصنيف مرتبط بـ ${linked} منتج. هل تريد حذفه؟` : `حذف التصنيف "${category.name}"؟`)) return;
    try {
      await deleteCategory(category.id);
      await onRefresh();
      notify('تم حذف التصنيف', 'info');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'تعذر حذف التصنيف', 'error');
    }
  };

  const startEdit = (category: Category) => {
    setDraft({ id: category.id, name: category.name, image: category.image, activeImage: category.active_image, parentId: category.parent_id ?? '', sortOrder: String(category.sort_order) });
    setOpen(true);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-5" dir="rtl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h2 className="text-xl font-extrabold text-sand-900">إدارة وتصميم التصنيفات</h2><p className="mt-1 text-sm text-sand-500">الاسم مرجع داخلي فقط، والصور هي التي تظهر للعملاء.</p></div>
        <button type="button" onClick={() => { setDraft(EMPTY); setOpen(true); }} className="flex h-11 items-center gap-2 rounded-full bg-brand-600 px-5 text-sm font-bold text-white shadow-soft hover:bg-brand-700"><Plus size={17} /> إضافة تصنيف</button>
      </div>

      {categories.length === 0 ? <div className="rounded-2xl border border-dashed border-sand-300 bg-white py-16 text-center text-sand-500"><Boxes size={42} className="mx-auto mb-3 text-sand-300" /><p>لا توجد تصنيفات بعد</p></div> : <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{[...categories].sort((a, b) => a.sort_order - b.sort_order).map((category) => {
        const parent = categories.find((item) => item.id === category.parent_id);
        const count = products.filter((product) => product.category_id === category.id).length;
        return <article key={category.id} className="rounded-2xl border border-sand-200 bg-white p-3 shadow-card">
          <div className="flex items-center gap-3"><div className="h-16 w-16 overflow-hidden rounded-2xl bg-sand-100">{category.image ? <img src={category.image} alt="" className="h-full w-full object-cover" /> : <Boxes className="mx-auto mt-5 text-sand-300" size={24} />}</div><div className="min-w-0 flex-1"><p className="truncate font-bold text-sand-800">{category.name}</p><p className="mt-1 text-xs text-sand-400">{count} منتج · ترتيب {category.sort_order}</p>{parent && <p className="mt-1 text-[11px] text-brand-600">تابع لـ: {parent.name}</p>}</div></div>
          <div className="mt-3 flex gap-2"><button type="button" onClick={() => startEdit(category)} className="flex h-9 flex-1 items-center justify-center gap-1 rounded-full bg-sand-100 text-xs font-bold text-sand-700 hover:bg-brand-50 hover:text-brand-700"><Pencil size={14} /> تعديل</button><button type="button" onClick={() => remove(category)} className="flex h-9 w-10 items-center justify-center rounded-full bg-red-50 text-red-500 hover:bg-red-100" aria-label="حذف التصنيف"><Trash2 size={15} /></button></div>
        </article>;
      })}</div>}

      {open && <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4"><div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} /><div className="relative max-h-[94vh] w-full overflow-y-auto rounded-t-3xl bg-sand-50 shadow-2xl sm:max-w-xl sm:rounded-3xl"><div className="sticky top-0 z-10 flex items-center justify-between border-b border-sand-200 bg-white px-5 py-4"><h3 className="font-extrabold text-sand-900">{draft.id ? 'تعديل التصنيف' : 'إضافة تصنيف'}</h3><button type="button" onClick={() => setOpen(false)} className="rounded-full p-2 text-sand-400 hover:bg-sand-100" aria-label="إغلاق"><X size={20} /></button></div><div className="space-y-4 p-5">
        <label className="block text-sm font-bold text-sand-700">اسم التصنيف <span className="font-normal text-sand-400">(للوحة التحكم فقط)</span><input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} className="mt-1.5 h-11 w-full rounded-xl border border-sand-200 bg-white px-3 font-normal outline-none focus:border-brand-400" /></label>
        <div className="grid gap-3 sm:grid-cols-2"><ImagePicker label="الصورة العادية" image={draft.image} inputRef={imageRef} onChange={(event) => pickImage(event, 'image')} /><ImagePicker label="صورة الضغط والتفاعل" image={draft.activeImage} inputRef={activeImageRef} onChange={(event) => pickImage(event, 'activeImage')} /></div>
        <label className="block text-sm font-bold text-sand-700">التصنيف الأب <span className="font-normal text-sand-400">(اختياري)</span><select value={draft.parentId} onChange={(event) => setDraft({ ...draft, parentId: event.target.value })} className="mt-1.5 h-11 w-full rounded-xl border border-sand-200 bg-white px-3 font-normal outline-none focus:border-brand-400"><option value="">تصنيف رئيسي</option>{categories.filter((category) => category.id !== draft.id).map((category) => <option key={category.id} value={category.id}>{category.parent_id ? '— ' : ''}{category.name}</option>)}</select></label>
        <label className="block text-sm font-bold text-sand-700">ترتيب الظهور<input type="number" min="0" step="1" value={draft.sortOrder} onChange={(event) => setDraft({ ...draft, sortOrder: event.target.value })} className="mt-1.5 h-11 w-full rounded-xl border border-sand-200 bg-white px-3 font-normal outline-none focus:border-brand-400" /></label>
      </div><div className="sticky bottom-0 flex gap-2 border-t border-sand-200 bg-white px-5 py-3"><button type="button" onClick={() => setOpen(false)} className="h-11 flex-1 rounded-full border border-sand-300 font-bold text-sand-700">إلغاء</button><button type="button" onClick={save} disabled={saving} className="flex h-11 flex-[2] items-center justify-center gap-2 rounded-full bg-brand-600 font-bold text-white hover:bg-brand-700 disabled:bg-sand-300">{saving ? <Loader2 size={17} className="animate-spin" /> : <Plus size={17} />} حفظ</button></div></div></div>}
    </div>
  );
}

function ImagePicker({ label, image, inputRef, onChange }: { label: string; image: string; inputRef: React.RefObject<HTMLInputElement>; onChange: (event: React.ChangeEvent<HTMLInputElement>) => void }) {
  return <div><span className="mb-1.5 block text-sm font-bold text-sand-700">{label}</span><input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onChange} /><button type="button" onClick={() => inputRef.current?.click()} className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-sand-300 bg-white hover:border-brand-400">{image ? <img src={image} alt="معاينة" className="h-full w-full object-cover" /> : <ImagePlus size={26} className="text-sand-300" />}</button></div>;
}
