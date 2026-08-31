import { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import {
  ArrowRight,
  Boxes,
  FolderPlus,
  LayoutGrid,
  Pencil,
  Plus,
  Save,
  Search,
  Receipt,
  Printer,
  Trash2,
  Upload,
  X,
  ImageIcon,
  Package,
  AlertTriangle,
  Check,
  Loader2,
  Layers,
  ClipboardList,
  Users,
  MapPin,
  ExternalLink,
  Phone,
  Store,
  BarChart3,
  Download,
  MessageCircle,
  Minus,
} from 'lucide-react';
import type { Category, Customer, Order, OrderItem, OrderStatus, PaymentMethod, Product } from '@/types';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, PAYMENT_METHOD_LABELS } from '@/types';
import { useToast } from './Toast';
import { fileToResizedDataURL, formatSAR } from '@/utils';
import { navigate } from '@/hooks/useHashRoute';
import { supabase } from '@/lib/supabase';
import {
  insertProduct,
  insertProductsBatch,
  updateProduct,
  deleteProduct as dbDeleteProduct,
  insertCategory,
  deleteCategory as dbDeleteCategory,
  fetchAllOrders,
  fetchAllCustomers,
  updateOrderStatus,
  updateOrder,
} from '@/lib/db';

type AdminProps = {
  categories: Category[];
  products: Product[];
  onRefresh: () => Promise<void>;
};

type ProductDraft = {
  id?: string;
  name: string;
  categoryId: string;
  price: string;
  image: string;
  description: string;
  fullCartonUnits: string;
  halfCartonEnabled: boolean;
  halfCartonPrice: string;
  halfCartonUnits: string;
  stock: string;
};

const EMPTY_DRAFT: ProductDraft = {
  name: '',
  categoryId: '',
  price: '',
  image: '',
  description: '',
  fullCartonUnits: '',
  halfCartonEnabled: false,
  halfCartonPrice: '',
  halfCartonUnits: '',
  stock: '',
};

export function Admin({ categories, products, onRefresh }: AdminProps) {
  const [tab, setTab] = useState<'products' | 'batch' | 'categories' | 'orders' | 'customers'>('products');
  const [draft, setDraft] = useState<ProductDraft>(EMPTY_DRAFT);
  const [editing, setEditing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showBatch, setShowBatch] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { notify } = useToast();

  const sortedProducts = useMemo(
    () => [...products].sort((a, b) => (b.created_at > a.created_at ? 1 : -1)),
    [products]
  );

  const openAdd = () => {
    setDraft({ ...EMPTY_DRAFT, categoryId: categories[0]?.id ?? '' });
    setEditing(false);
    setShowForm(true);
  };

  const openEdit = (product: Product) => {
    setDraft({
      id: product.id,
      name: product.name,
      categoryId: product.category_id ?? '',
      price: String(product.price),
      image: product.image,
      description: product.description,
      fullCartonUnits: product.full_carton_units ? String(product.full_carton_units) : '',
      halfCartonEnabled: product.half_carton_enabled,
      halfCartonPrice: product.half_carton_price ? String(product.half_carton_price) : '',
      halfCartonUnits: product.half_carton_units ? String(product.half_carton_units) : '',
      stock: String(product.stock),
    });
    setEditing(true);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(false);
    setDraft(EMPTY_DRAFT);
  };

  const pickImage = () => fileRef.current?.click();

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      notify('الرجاء اختيار ملف صورة فقط', 'error');
      return;
    }
    try {
      const dataUrl = await fileToResizedDataURL(file);
      setDraft((d) => ({ ...d, image: dataUrl }));
      notify('تم تحميل الصورة');
    } catch {
      notify('تعذر معالجة الصورة', 'error');
    } finally {
      e.target.value = '';
    }
  };

  const saveProduct = async () => {
    if (!draft.name.trim()) return notify('الرجاء إدخال اسم المنتج', 'error');
    if (!draft.categoryId) return notify('الرجاء اختيار القسم', 'error');
    const price = Number(draft.price);
    if (Number.isNaN(price) || price < 0) return notify('السعر غير صحيح', 'error');

    const fullCartonUnits = draft.fullCartonUnits ? Number(draft.fullCartonUnits) : null;
    if (fullCartonUnits !== null && (Number.isNaN(fullCartonUnits) || fullCartonUnits < 0)) {
      return notify('عدد حبات الكرتون الكامل غير صحيح', 'error');
    }
    const stock = draft.stock ? Number(draft.stock) : 0;
    if (Number.isNaN(stock) || stock < 0) return notify('الكمية المتوفرة غير صحيحة', 'error');

    let halfCartonPrice: number | null = null;
    let halfCartonUnits: number | null = null;
    if (draft.halfCartonEnabled) {
      halfCartonPrice = draft.halfCartonPrice ? Number(draft.halfCartonPrice) : null;
      halfCartonUnits = draft.halfCartonUnits ? Number(draft.halfCartonUnits) : null;
      if (halfCartonPrice === null || Number.isNaN(halfCartonPrice) || halfCartonPrice < 0) {
        return notify('الرجاء إدخال سعر نصف الكرتون', 'error');
      }
      if (halfCartonUnits === null || Number.isNaN(halfCartonUnits) || halfCartonUnits < 0) {
        return notify('الرجاء إدخال عدد حبات نصف الكرتون', 'error');
      }
    }

    setSaving(true);
    try {
      const payload = {
        name: draft.name.trim(),
        category_id: draft.categoryId,
        price,
        image: draft.image,
        description: draft.description.trim(),
        full_carton_units: fullCartonUnits,
        half_carton_enabled: draft.halfCartonEnabled,
        half_carton_price: draft.halfCartonEnabled ? halfCartonPrice : null,
        half_carton_units: draft.halfCartonEnabled ? halfCartonUnits : null,
        stock,
      };
      if (editing && draft.id) {
        await updateProduct(draft.id, payload);
        notify('تم تحديث المنتج');
      } else {
        await insertProduct(payload);
        notify('تمت إضافة المنتج');
      }
      await onRefresh();
      closeForm();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'فشل حفظ المنتج', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!window.confirm(`حذف المنتج "${name}"؟`)) return;
    try {
      await dbDeleteProduct(id);
      await onRefresh();
      notify('تم حذف المنتج', 'info');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'فشل حذف المنتج', 'error');
    }
  };

  const handleAddCategory = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      await insertCategory(trimmed);
      await onRefresh();
      notify(`تمت إضافة قسم "${trimmed}"`);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'فشل إضافة القسم', 'error');
    }
  };

  const handleDeleteCategory = async (cat: Category) => {
    const linked = products.filter((p) => p.category_id === cat.id).length;
    const msg = linked
      ? `القسم "${cat.name}" مرتبط بـ ${linked} منتج. حذف القسم سيجعل هذه المنتجات بدون قسم. متابعة؟`
      : `حذف القسم "${cat.name}"؟`;
    if (!window.confirm(msg)) return;
    try {
      await dbDeleteCategory(cat.id);
      await onRefresh();
      notify('تم حذف القسم', 'info');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'فشل حذف القسم', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-sand-100 flex flex-col">
      <header className="bg-sand-900 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-600 flex items-center justify-center">
              <LayoutGrid size={22} />
            </div>
            <div>
              <h1 className="font-display font-extrabold text-lg leading-none">لوحة التحكم</h1>
              <p className="text-[11px] text-sand-400 mt-1">تاجري - الإدارة</p>
            </div>
          </div>
          <button
            onClick={() => navigate('store')}
            className="flex items-center gap-1.5 text-sm font-medium bg-white/10 hover:bg-white/20 px-3 py-2 rounded-full transition-colors"
          >
            <ArrowRight size={16} />
            <span className="hidden sm:inline">العودة للمتجر</span>
          </button>
        </div>
      </header>

      <div className="bg-white border-b border-sand-200 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex gap-1">
          <TabButton active={tab === 'products'} onClick={() => setTab('products')} icon={<Package size={18} />}>
            المنتجات
          </TabButton>
          <TabButton active={tab === 'batch'} onClick={() => setTab('batch')} icon={<Layers size={18} />}>
            إضافة 10 منتجات
          </TabButton>
          <TabButton active={tab === 'categories'} onClick={() => setTab('categories')} icon={<Boxes size={18} />}>
            الأقسام
          </TabButton>
          <TabButton active={tab === 'orders'} onClick={() => setTab('orders')} icon={<ClipboardList size={18} />}>
            الطلبات
          </TabButton>
          <TabButton active={tab === 'customers'} onClick={() => setTab('customers')} icon={<Users size={18} />}>
            العملاء
          </TabButton>
        </div>
      </div>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6">
        {tab === 'products' ? (
          <ProductsTab
            products={sortedProducts}
            categories={categories}
            onAdd={openAdd}
            onEdit={openEdit}
            onDelete={handleDeleteProduct}
          />
        ) : tab === 'batch' ? (
          <BatchTab categories={categories} onRefresh={onRefresh} />
        ) : tab === 'orders' ? (
          <OrdersAdminTab onRefresh={onRefresh} />
        ) : tab === 'customers' ? (
          <CustomersAdminTab />
        ) : (
          <CategoriesTab
            categories={categories}
            products={products}
            onAdd={handleAddCategory}
            onDelete={handleDeleteCategory}
          />
        )}
      </main>

      {showForm && (
        <ProductFormModal
          draft={draft}
          editing={editing}
          saving={saving}
          categories={categories}
          fileRef={fileRef}
          onDraftChange={setDraft}
          onPickImage={pickImage}
          onFileChange={onFileChange}
          onSave={saveProduct}
          onClose={closeForm}
        />
      )}
    </div>
  );
}

/* ---------------- Products tab ---------------- */

function ProductsTab({
  products,
  categories,
  onAdd,
  onEdit,
  onDelete,
}: {
  products: Product[];
  categories: Category[];
  onAdd: () => void;
  onEdit: (p: Product) => void;
  onDelete: (id: string, name: string) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-extrabold text-sand-900">إدارة المنتجات</h2>
          <p className="text-sm text-sand-500 mt-0.5">{products.length} منتج</p>
        </div>
        <button
          onClick={onAdd}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm px-4 h-11 rounded-full transition-colors shadow-soft active:scale-95"
        >
          <Plus size={18} />
          إضافة منتج
        </button>
      </div>

      {products.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-sand-300 py-16 flex flex-col items-center text-sand-400">
          <Package size={56} strokeWidth={1.2} className="mb-3" />
          <p className="font-medium text-sand-600">لا توجد منتجات بعد</p>
          <p className="text-sm mt-1">اضغط "إضافة منتج" لإضافة أول منتج</p>
        </div>
      ) : (
        <>
          <div className="hidden md:block bg-white rounded-2xl border border-sand-200 overflow-hidden shadow-card">
            <table className="w-full text-sm">
              <thead className="bg-sand-50 text-sand-600 text-xs">
                <tr>
                  <th className="text-right font-bold px-4 py-3">المنتج</th>
                  <th className="text-right font-bold px-4 py-3">سعر الكرتون</th>
                  <th className="text-right font-bold px-4 py-3">نصف كرتون</th>
                  <th className="text-right font-bold px-4 py-3">الكمية</th>
                  <th className="text-center font-bold px-4 py-3">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-100">
                {products.map((p) => {
                  return (
                    <tr key={p.id} className="hover:bg-sand-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl bg-white border border-sand-200 overflow-hidden shrink-0 flex items-center justify-center">
                            {p.image ? (
                              <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              <ImageIcon size={18} className="text-sand-300" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-sand-800 line-clamp-1">{p.name}</p>
                            {p.description && (
                              <p className="text-xs text-sand-400 line-clamp-1">{p.description}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-bold text-brand-700">{formatSAR(p.price)}</td>
                      <td className="px-4 py-3">
                        {p.half_carton_enabled ? (
                          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full border border-blue-200">
                            {formatSAR(p.half_carton_price ?? 0)}
                          </span>
                        ) : (
                          <span className="text-xs text-sand-400">غير مفعّل</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-bold text-sand-700">{p.stock}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onEdit(p)}
                            className="w-8 h-8 rounded-lg text-sand-500 hover:bg-brand-50 hover:text-brand-700 flex items-center justify-center transition-colors"
                            aria-label="تعديل"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => onDelete(p.id, p.name)}
                            className="w-8 h-8 rounded-lg text-sand-500 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-colors"
                            aria-label="حذف"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-3">
            {products.map((p) => {
              return (
                <div key={p.id} className="bg-white rounded-2xl border border-sand-200 p-3 flex gap-3 shadow-card">
                  <div className="w-16 h-16 rounded-xl bg-white border border-sand-200 overflow-hidden shrink-0 flex items-center justify-center">
                    {p.image ? (
                      <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon size={22} className="text-sand-300" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sand-800 line-clamp-2">{p.name}</p>
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <span className="font-bold text-brand-700 text-sm">{formatSAR(p.price)}</span>
                      {p.half_carton_enabled && (
                        <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                          نصف: {formatSAR(p.half_carton_price ?? 0)}
                        </span>
                      )}
                      <span className="text-[11px] text-sand-500">الكمية: {p.stock}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 self-start">
                    <button
                      onClick={() => onEdit(p)}
                      className="w-9 h-9 rounded-lg text-sand-500 hover:bg-brand-50 hover:text-brand-700 flex items-center justify-center transition-colors"
                      aria-label="تعديل"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => onDelete(p.id, p.name)}
                      className="w-9 h-9 rounded-lg text-sand-500 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-colors"
                      aria-label="حذف"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

/* ---------------- Batch 10 products tab ---------------- */

type BatchRow = {
  image: string;
  name: string;
  price: string;
  halfEnabled: boolean;
};

function emptyBatchRows(): BatchRow[] {
  return Array.from({ length: 10 }, () => ({ image: '', name: '', price: '', halfEnabled: false }));
}

function BatchTab({
  categories,
  onRefresh,
}: {
  categories: Category[];
  onRefresh: () => Promise<void>;
}) {
  const [rows, setRows] = useState<BatchRow[]>(emptyBatchRows);
  const [sharedCat, setSharedCat] = useState(categories[0]?.id ?? '');
  const [saving, setSaving] = useState(false);
  const fileRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { notify } = useToast();

  const updateRow = (idx: number, patch: Partial<BatchRow>) => {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };

  const pickImage = (idx: number) => fileRefs.current[idx]?.click();

  const onFileChange = async (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      notify('الرجاء اختيار ملف صورة فقط', 'error');
      return;
    }
    try {
      const dataUrl = await fileToResizedDataURL(file);
      updateRow(idx, { image: dataUrl });
    } catch {
      notify('تعذر معالجة الصورة', 'error');
    } finally {
      e.target.value = '';
    }
  };

  const saveBatch = async () => {
    if (!sharedCat) {
      notify('الرجاء اختيار القسم المشترك', 'error');
      return;
    }
    const valid = rows.filter((r) => r.name.trim() && r.price);
    if (valid.length === 0) {
      notify('الرجاء إدخال اسم وسعر لمنتج واحد على الأقل', 'error');
      return;
    }
    for (const r of valid) {
      const p = Number(r.price);
      if (Number.isNaN(p) || p < 0) {
        notify(`السعر غير صحيح للمنتج "${r.name}"`, 'error');
        return;
      }
    }

    setSaving(true);
    try {
      const payload = valid.map((r) => {
        const price = Number(r.price);
        return {
          name: r.name.trim(),
          category_id: sharedCat,
          price,
          image: r.image,
          half_carton_enabled: r.halfEnabled,
          half_carton_price: r.halfEnabled ? Math.round(price / 2 * 100) / 100 : null,
        };
      });
      await insertProductsBatch(payload);
      await onRefresh();
      notify(`تم حفظ ${payload.length} منتج بنجاح`);
      setRows(emptyBatchRows());
    } catch (err) {
      notify(err instanceof Error ? err.message : 'فشل حفظ المنتجات', 'error');
    } finally {
      setSaving(false);
    }
  };

  const noCategories = categories.length === 0;
  const validCount = rows.filter((r) => r.name.trim() && r.price).length;

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-xl font-extrabold text-sand-900">إضافة 10 منتجات دفعة واحدة</h2>
        <p className="text-sm text-sand-500 mt-0.5">
          اختر قسماً مشتركاً واملأ بيانات المنتجات، ثم احفظها جميعاً دفعة واحدة
        </p>
      </div>

      {noCategories ? (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-2xl p-4 text-sm">
          <AlertTriangle size={18} className="shrink-0 mt-0.5" />
          <p>لا توجد أقسام بعد. الرجاء إضافة قسم من تبويب "الأقسام" أولاً.</p>
        </div>
      ) : (
        <>
          {/* Shared category selector */}
          <div className="bg-white rounded-2xl border border-sand-200 p-4 mb-4 shadow-card">
            <label className="block text-sm font-bold text-sand-700 mb-1.5">القسم المشترك لجميع المنتجات</label>
            <select
              value={sharedCat}
              onChange={(e) => setSharedCat(e.target.value)}
              className="w-full h-11 rounded-xl bg-white border border-sand-200 focus:border-brand-400 px-3 text-sm outline-none transition-all"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* 10 rows */}
          <div className="space-y-3">
            {rows.map((row, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-sand-200 p-3 shadow-card flex flex-col sm:flex-row sm:items-center gap-3 animate-fade-in"
              >
                {/* Row number */}
                <span className="shrink-0 w-7 h-7 rounded-full bg-sand-100 text-sand-600 text-xs font-bold flex items-center justify-center">
                  {idx + 1}
                </span>

                {/* Image picker */}
                <div className="shrink-0 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => pickImage(idx)}
                    className="relative w-12 h-12 rounded-xl bg-white border-2 border-dashed border-sand-300 overflow-hidden flex items-center justify-center hover:border-brand-400 transition-colors"
                    aria-label={`صورة المنتج ${idx + 1}`}
                  >
                    {row.image ? (
                      <img src={row.image} alt={`منتج ${idx + 1}`} className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon size={18} className="text-sand-300" />
                    )}
                  </button>
                  <input
                    ref={(el) => { fileRefs.current[idx] = el; }}
                    type="file"
                    accept="image/*"
                    onChange={(e) => onFileChange(idx, e)}
                    className="hidden"
                  />
                  {row.image && (
                    <button
                      type="button"
                      onClick={() => updateRow(idx, { image: '' })}
                      className="text-xs text-red-500 hover:underline"
                    >
                      إزالة
                    </button>
                  )}
                </div>

                {/* Name */}
                <input
                  type="text"
                  value={row.name}
                  onChange={(e) => updateRow(idx, { name: e.target.value })}
                  placeholder="اسم المنتج"
                  className="flex-1 min-w-0 h-11 rounded-xl bg-sand-50 border border-sand-200 focus:border-brand-400 px-3 text-sm outline-none transition-all"
                />

                {/* Price */}
                <div className="flex items-center gap-1 shrink-0">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={row.price}
                    onChange={(e) => updateRow(idx, { price: e.target.value })}
                    placeholder="السعر"
                    className="w-24 h-11 rounded-xl bg-sand-50 border border-sand-200 focus:border-brand-400 px-3 text-sm outline-none transition-all"
                  />
                  <span className="text-xs text-sand-400">ر.ي</span>
                </div>

                {/* Half carton checkbox */}
                <label className="flex items-center gap-2 shrink-0 cursor-pointer">
                  <button
                    type="button"
                    onClick={() => updateRow(idx, { halfEnabled: !row.halfEnabled })}
                    className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${
                      row.halfEnabled ? 'bg-blue-500 border-blue-500' : 'bg-white border-sand-300'
                    }`}
                    aria-pressed={row.halfEnabled}
                    aria-label="نصف كرتون"
                  >
                    {row.halfEnabled && <Check size={14} className="text-white" />}
                  </button>
                  <span className="text-xs font-bold text-sand-700 whitespace-nowrap">
                    نصف كرتون
                    {row.halfEnabled && row.price && (
                      <span className="block text-blue-600 text-[10px] font-normal">
                        {formatSAR(Math.round(Number(row.price) / 2 * 100) / 100)}
                      </span>
                    )}
                  </span>
                </label>
              </div>
            ))}
          </div>

          {/* Save button */}
          <div className="mt-5 flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={saveBatch}
              disabled={saving || validCount === 0}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:bg-sand-300 text-white font-bold text-sm px-6 h-12 rounded-full transition-colors shadow-soft active:scale-95"
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              حفظ الـ 10 منتجات
            </button>
            {validCount > 0 && (
              <span className="text-sm text-sand-500">
                {validCount} منتج جاهز للحفظ
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* ---------------- Orders admin tab ---------------- */

type AdminFilterTab = 'all' | 'pending' | 'preparing' | 'delivering' | 'delivered' | 'cancelled';

const ADMIN_FILTER_TABS: Array<{ id: AdminFilterTab; label: string }> = [
  { id: 'all', label: 'الكل' },
  { id: 'pending', label: 'الطلبات الجديدة' },
  { id: 'preparing', label: 'قيد التجهيز' },
  { id: 'delivering', label: 'جاري التوصيل' },
  { id: 'delivered', label: 'تم التسليم' },
  { id: 'cancelled', label: 'ملغى' },
];

const QUICK_STATUS_BUTTONS: Array<{ id: OrderStatus; label: string }> = [
  { id: 'pending', label: 'جديد' },
  { id: 'delivering', label: 'قيد التوصيل' },
  { id: 'delivered', label: 'تم التسليم' },
];

/* ---------------- CSV / Report utilities ---------------- */

function isToday(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function getTodayOrders(orders: Order[]): Order[] {
  return orders.filter((o) => isToday(o.created_at));
}

function escapeCSV(val: string | number): string {
  const s = String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function exportOrdersCSV(orders: Order[]): void {
  const headers = [
    'رقم الطلب',
    'التاريخ',
    'العميل',
    'الهاتف',
    'المنطقة',
    'طريقة الدفع',
    'المنتجات',
    'الإجمالي',
    'الحالة',
  ];

  const rows = orders.map((o) => {
    const itemsStr = o.items
      .map(
        (i) =>
          `${i.product_name} (${i.unit === 'half' ? 'نصف' : 'كامل'}) x${i.qty} = ${i.price * i.qty}`
      )
      .join(' | ');
    return [
      o.id,
      new Date(o.created_at).toLocaleString('ar-EG'),
      o.customer_name || '',
      o.customer_phone || '',
      o.area || '',
      PAYMENT_METHOD_LABELS[o.payment_method ?? 'cash'],
      itemsStr,
      o.total,
      ORDER_STATUS_LABELS[(o.status ?? 'pending') as OrderStatus],
    ].map(escapeCSV).join(',');
  });

  const csv = '\uFEFF' + headers.map(escapeCSV).join(',') + '\n' + rows.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `tajeri-orders-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function exportTodayCSV(orders: Order[]): void {
  exportOrdersCSV(getTodayOrders(orders));
}

function OrdersAdminTab({ onRefresh }: { onRefresh: () => Promise<void> }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [searchPhone, setSearchPhone] = useState('');
  const [filter, setFilter] = useState<AdminFilterTab>('all');
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [showReport, setShowReport] = useState(false);
  const { notify } = useToast();

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAllOrders();
      setOrders(data);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'فشل تحميل الطلبات', 'error');
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    loadOrders();
    const channel = supabase
      .channel('admin-orders-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        loadOrders();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadOrders]);

  const handleStatusChange = async (orderId: string, status: OrderStatus) => {
    setUpdating(orderId);
    try {
      await updateOrderStatus(orderId, status);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status } : o))
      );
      if (detailOrder?.id === orderId) {
        setDetailOrder((prev) => (prev ? { ...prev, status } : prev));
      }
      notify('تم تحديث حالة الطلب');
      await onRefresh();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'فشل تحديث الحالة', 'error');
    } finally {
      setUpdating(null);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const status = (o.status ?? 'pending') as OrderStatus;
    const matchesFilter = filter === 'all' || status === filter;
    const matchesPhone =
      !searchPhone.trim() ||
      (o.customer_phone ?? '').includes(searchPhone.trim());
    return matchesFilter && matchesPhone;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-sand-400">
        <Loader2 size={32} className="animate-spin text-brand-600" />
        <p className="text-sm font-medium">جارٍ تحميل الطلبات...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-sand-900">استلام الطلبات</h2>
          <p className="text-sm text-sand-500 mt-0.5">{orders.length} طلب إجمالي</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowReport(true)}
            className="flex items-center gap-1.5 text-white font-bold text-sm px-4 h-10 rounded-full transition-all shadow-soft active:scale-95"
            style={{ backgroundColor: '#8b2c4d' }}
          >
            <BarChart3 size={16} />
            تقرير اليوم
          </button>
          <button
            onClick={() => exportOrdersCSV(orders)}
            className="flex items-center gap-1.5 bg-white border border-sand-300 hover:border-sand-400 text-sand-700 font-bold text-sm px-4 h-10 rounded-full transition-all active:scale-95"
          >
            <Download size={16} />
            تصدير CSV
          </button>
        </div>
      </div>

      {/* Phone search */}
      <div className="relative mb-4">
        <Search
          size={18}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-sand-400 pointer-events-none"
        />
        <input
          type="tel"
          value={searchPhone}
          onChange={(e) => setSearchPhone(e.target.value)}
          placeholder="البحث برقم الجوال..."
          className="w-full h-11 rounded-xl bg-white border border-sand-200 focus:border-brand-400 pr-10 pl-4 text-sm outline-none transition-all"
        />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-3 -mx-1 px-1 scrollbar-thin mb-4">
        {ADMIN_FILTER_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setFilter(t.id)}
            className={`shrink-0 px-4 h-9 rounded-full text-sm font-bold transition-all whitespace-nowrap ${
              filter === t.id
                ? 'bg-brand-600 text-white shadow-soft'
                : 'bg-white text-sand-600 border border-sand-200 hover:border-brand-300 hover:text-brand-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-sand-300 py-16 flex flex-col items-center text-sand-400">
          <ClipboardList size={56} strokeWidth={1.2} className="mb-3" />
          <p className="font-medium text-sand-600">لا توجد طلبات</p>
          <p className="text-sm mt-1">
            {searchPhone.trim() ? 'لا نتائج لهذا الرقم' : 'لا توجد طلبات في هذا التبويب'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => (
            <AdminOrderCard
              key={order.id}
              order={order}
              updating={updating === order.id}
              onStatusChange={(s) => handleStatusChange(order.id, s)}
              onDetails={() => setDetailOrder(order)}
            />
          ))}
        </div>
      )}

      {detailOrder && (
        <OrderDetailModal
          order={detailOrder}
          updating={updating === detailOrder.id}
          onStatusChange={(s) => handleStatusChange(detailOrder.id, s)}
          onClose={() => setDetailOrder(null)}
          onOrderUpdated={(updated) => setDetailOrder(updated)}
        />
      )}

      {showReport && (
        <DailyReportModal orders={orders} onClose={() => setShowReport(false)} />
      )}
    </div>
  );
}

function AdminOrderCard({
  order,
  updating,
  onStatusChange,
  onDetails,
}: {
  order: Order;
  updating: boolean;
  onStatusChange: (s: OrderStatus) => void;
  onDetails: () => void;
}) {
  const status = (order.status ?? 'pending') as OrderStatus;
  const color = ORDER_STATUS_COLORS[status] ?? '#f59e0b';
  const date = new Date(order.created_at).toLocaleString('ar-EG', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  const areaLabel = order.area || order.customer_name || 'غير محدد';

  return (
    <div className="bg-white rounded-2xl border border-sand-200 shadow-card overflow-hidden animate-fade-in">
      {/* Card header: area name + details button + date/time */}
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-sand-100">
        <div className="flex items-center gap-2 min-w-0">
          <MapPin size={16} className="text-brand-600 shrink-0" />
          <span className="text-sm font-extrabold text-sand-900 truncate">{areaLabel}</span>
        </div>
        <button
          onClick={onDetails}
          className="shrink-0 flex items-center gap-1 bg-sand-100 hover:bg-sand-200 text-sand-700 font-bold text-xs px-3 h-8 rounded-full transition-colors"
        >
          التفاصيل
        </button>
      </div>
      <div className="px-4 pb-2 pt-1 text-[11px] text-sand-400">{date}</div>

      {/* Line details: phone, area, payment, map */}
      <div className="px-4 py-2 flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
        {order.customer_phone && (
          <a
            href={`tel:${order.customer_phone}`}
            className="flex items-center gap-1 text-brand-600 hover:underline"
          >
            <Phone size={12} />
            {order.customer_phone}
          </a>
        )}
        <span className="flex items-center gap-1 text-sand-500">
          <MapPin size={12} />
          {order.area || '—'}
        </span>
        <span className="flex items-center gap-1 text-sand-500">
          {(order.payment_method ?? 'cash') === 'wallet' ? 'محفظة إلكترونية' : 'نقداً'}
        </span>
      </div>

      {/* Product summary */}
      <div className="px-4 py-2 space-y-1.5 border-t border-sand-100">
        {order.items.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between text-sm">
            <span className="text-sand-700">
              {item.product_name}
              <span className="text-sand-400 text-xs mr-1">
                ({item.unit === 'half' ? 'نصف كرتون' : 'كرتون كامل'} × {item.qty})
              </span>
            </span>
            <span className="font-bold text-sand-800">{formatSAR(item.price * item.qty)}</span>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-sand-50 border-t border-sand-100">
        <span className="text-sm font-bold text-sand-600">الإجمالي</span>
        <span className="text-base font-extrabold text-brand-700">{formatSAR(order.total)}</span>
      </div>

      {/* Quick status buttons */}
      <div className="flex gap-2 px-4 py-3 border-t border-sand-100">
        {QUICK_STATUS_BUTTONS.map((btn) => {
          const isActive = status === btn.id;
          return (
            <button
              key={btn.id}
              onClick={() => onStatusChange(btn.id)}
              disabled={updating}
              className={`flex-1 h-9 rounded-full font-bold text-xs transition-all disabled:opacity-50 ${
                isActive
                  ? 'text-white shadow-soft'
                  : 'bg-sand-100 text-sand-600 hover:bg-sand-200'
              }`}
              style={isActive ? { backgroundColor: '#8b2c4d' } : undefined}
            >
              {updating ? <Loader2 size={12} className="animate-spin mx-auto" /> : btn.label}
            </button>
          );
        })}
      </div>

      {/* Current status badge */}
      <div className="px-4 pb-3 -mt-1.5">
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
          style={{ backgroundColor: color }}
        >
          {ORDER_STATUS_LABELS[status]}
        </span>
      </div>
    </div>
  );
}

/* ---------------- Order detail / invoice modal ---------------- */

function OrderDetailModal({
  order,
  updating,
  onStatusChange,
  onClose,
  onOrderUpdated,
}: {
  order: Order;
  updating: boolean;
  onStatusChange: (s: OrderStatus) => void;
  onClose: () => void;
  onOrderUpdated: (o: Order) => void;
}) {
  const { notify } = useToast();
  const [editing, setEditing] = useState(false);
  const [editArea, setEditArea] = useState(order.area ?? '');
  const [editName, setEditName] = useState(order.customer_name ?? '');
  const [editPhone, setEditPhone] = useState(order.customer_phone ?? '');
  const [editPayment, setEditPayment] = useState<PaymentMethod>(order.payment_method ?? 'cash');
  const [editItems, setEditItems] = useState<OrderItem[]>(order.items.map((i) => ({ ...i })));
  const [editTotal, setEditTotal] = useState<string>(String(order.total));

  const status = (order.status ?? 'pending') as OrderStatus;
  const date = new Date(order.created_at).toLocaleString('ar-EG', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const computedTotal = editItems.reduce((sum, i) => sum + i.price * i.qty, 0);

  const updateItemQty = (idx: number, delta: number) => {
    setEditItems((prev) =>
      prev.map((it, i) => (i === idx ? { ...it, qty: Math.max(1, it.qty + delta) } : it))
    );
  };

  const updateItemPrice = (idx: number, priceStr: string) => {
    const price = Number(priceStr);
    if (Number.isNaN(price) || price < 0) return;
    setEditItems((prev) => prev.map((it, i) => (i === idx ? { ...it, price } : it)));
  };

  const removeItem = (idx: number) => {
    setEditItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSaveEdit = async () => {
    if (editItems.length === 0) {
      notify('لا يمكن حفظ فاتورة بدون منتجات', 'error');
      return;
    }
    const totalNum = Number(editTotal);
    const finalTotal = Number.isNaN(totalNum) || totalNum < 0 ? computedTotal : totalNum;
    try {
      await updateOrder(order.id, {
        area: editArea.trim(),
        customer_name: editName.trim(),
        customer_phone: editPhone.trim(),
        payment_method: editPayment,
        items: editItems,
        total: finalTotal,
      });
      notify('تم تعديل الفاتورة');
      onOrderUpdated({ ...order, area: editArea.trim(), customer_name: editName.trim(), customer_phone: editPhone.trim(), payment_method: editPayment, items: editItems, total: finalTotal });
      setEditing(false);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'فشل التعديل', 'error');
    }
  };

  const buildInvoiceText = (): string => {
    const lines: string[] = [
      '*** فاتورة الطلب ***',
      '',
      `المنطقة: ${order.area || order.customer_name || '—'}`,
      `العميل: ${order.customer_name || '—'}`,
      `الهاتف: ${order.customer_phone || '—'}`,
      `طريقة الدفع: ${PAYMENT_METHOD_LABELS[order.payment_method ?? 'cash']}`,
      `التاريخ: ${date}`,
      '',
      '--- المنتجات ---',
      ...order.items.map(
        (item) =>
          `${item.product_name} (${item.unit === 'half' ? 'نصف' : 'كامل'}) × ${item.qty} = ${formatSAR(item.price * item.qty)}`
      ),
      '',
      `الإجمالي: ${formatSAR(order.total)}`,
      '',
      'شكراً لطلبكم',
    ];
    return lines.join('\n');
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(buildInvoiceText());
    const phone = (order.customer_phone || '').replace(/[^0-9]/g, '');
    const waUrl = phone
      ? `https://wa.me/${phone}?text=${text}`
      : `https://wa.me/?text=${text}`;
    window.open(waUrl, '_blank');
  };

  const handlePrint80mm = () => {
    const text = buildInvoiceText();
    const win = window.open('', '_blank', 'width=400,height=600');
    if (!win) {
      notify('الرجاء السماح بالنوافذ المنبثقة', 'error');
      return;
    }
    win.document.write(`<!DOCTYPE html><html dir="rtl"><head><meta charset="utf-8"><title>فاتورة</title>
      <style>
        @page { width: 80mm; margin: 2mm; }
        body { font-family: monospace; font-size: 12px; width: 76mm; white-space: pre-wrap; }
      </style></head><body>${text.replace(/</g, '&lt;')}</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 300);
  };

  const handlePrintPDF = () => {
    const win = window.open('', '_blank');
    if (!win) {
      notify('الرجاء السماح بالنوافذ المنبثقة', 'error');
      return;
    }
    win.document.write(`<!DOCTYPE html><html dir="rtl"><head><meta charset="utf-8"><title>فاتورة PDF</title>
      <style>
        @page { size: A4; margin: 15mm; }
        body { font-family: 'Segoe UI', sans-serif; font-size: 14px; line-height: 1.8; max-width: 600px; margin: 0 auto; }
        h1 { text-align: center; color: #1c1917; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { padding: 6px 8px; text-align: right; border-bottom: 1px solid #e7e5e4; }
        th { background: #f5f5f4; }
        .total { font-size: 18px; font-weight: bold; text-align: left; margin-top: 10px; }
      </style></head><body>
      <h1>فاتورة الطلب</h1>
      <p><strong>المنطقة:</strong> ${order.area || '—'}</p>
      <p><strong>العميل:</strong> ${order.customer_name || '—'}</p>
      <p><strong>الهاتف:</strong> ${order.customer_phone || '—'}</p>
      <p><strong>طريقة الدفع:</strong> ${PAYMENT_METHOD_LABELS[order.payment_method ?? 'cash']}</p>
      <p><strong>التاريخ:</strong> ${date}</p>
      <table><thead><tr><th>المنتج</th><th>النوع</th><th>الكمية</th><th>السعر</th></tr></thead><tbody>
      ${order.items.map((item) => `<tr><td>${item.product_name}</td><td>${item.unit === 'half' ? 'نصف كرتون' : 'كرتون كامل'}</td><td>${item.qty}</td><td>${formatSAR(item.price * item.qty)}</td></tr>`).join('')}
      </tbody></table>
      <p class="total">الإجمالي: ${formatSAR(order.total)}</p>
      <p style="text-align:center;color:#78716c;margin-top:20px;">شكراً لطلبكم</p>
      </body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative bg-sand-50 w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl shadow-2xl animate-pop-in">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-sand-200 px-5 py-4 flex items-center justify-between z-10">
          <h2 className="font-extrabold text-lg text-sand-900">تفاصيل الطلب</h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full text-sand-400 hover:bg-sand-100 flex items-center justify-center transition-colors"
            aria-label="إغلاق"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Status badge */}
          <div className="flex items-center justify-between">
            <span
              className="text-xs font-bold px-3 py-1 rounded-full text-white"
              style={{ backgroundColor: ORDER_STATUS_COLORS[status] ?? '#f59e0b' }}
            >
              {ORDER_STATUS_LABELS[status]}
            </span>
            <span className="text-xs text-sand-400">{date}</span>
          </div>

          {editing ? (
            <div className="space-y-3 bg-white rounded-2xl border border-sand-200 p-4">
              <div>
                <label className="block text-xs font-bold text-sand-600 mb-1">اسم المنطقة</label>
                <input
                  type="text"
                  value={editArea}
                  onChange={(e) => setEditArea(e.target.value)}
                  className="w-full h-10 rounded-lg bg-sand-50 border border-sand-200 focus:border-brand-400 px-3 text-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-sand-600 mb-1">اسم العميل</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full h-10 rounded-lg bg-sand-50 border border-sand-200 focus:border-brand-400 px-3 text-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-sand-600 mb-1">رقم الهاتف</label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full h-10 rounded-lg bg-sand-50 border border-sand-200 focus:border-brand-400 px-3 text-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-sand-600 mb-1">طريقة الدفع</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditPayment('cash')}
                    className={`flex-1 h-10 rounded-lg font-bold text-sm ${editPayment === 'cash' ? 'bg-brand-600 text-white' : 'bg-sand-50 border border-sand-200 text-sand-600'}`}
                  >
                    نقداً
                  </button>
                  <button
                    onClick={() => setEditPayment('wallet')}
                    className={`flex-1 h-10 rounded-lg font-bold text-sm ${editPayment === 'wallet' ? 'bg-brand-600 text-white' : 'bg-sand-50 border border-sand-200 text-sand-600'}`}
                  >
                    محفظة إلكترونية
                  </button>
                </div>
              </div>

              {/* Editable items */}
              <div>
                <label className="block text-xs font-bold text-sand-600 mb-2">المنتجات</label>
                <div className="space-y-2">
                  {editItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-sand-50 rounded-lg p-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-sand-800 truncate">{item.product_name}</p>
                        <p className="text-[10px] text-sand-400">{item.unit === 'half' ? 'نصف كرتون' : 'كرتون كامل'}</p>
                      </div>
                      <div className="flex items-center gap-1 bg-white rounded-full p-0.5 shrink-0">
                        <button
                          onClick={() => updateItemQty(idx, -1)}
                          className="w-6 h-6 rounded-full bg-sand-100 hover:bg-sand-200 flex items-center justify-center"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-6 text-center text-xs font-bold">{item.qty}</span>
                        <button
                          onClick={() => updateItemQty(idx, 1)}
                          className="w-6 h-6 rounded-full bg-brand-600 text-white hover:bg-brand-700 flex items-center justify-center"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.price}
                        onChange={(e) => updateItemPrice(idx, e.target.value)}
                        className="w-16 h-8 rounded-lg bg-white border border-sand-200 px-1 text-xs text-center outline-none"
                      />
                      <span className="text-xs font-bold text-sand-700 w-16 text-left">{formatSAR(item.price * item.qty)}</span>
                      <button
                        onClick={() => removeItem(idx)}
                        className="w-7 h-7 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-500 flex items-center justify-center shrink-0"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  {editItems.length === 0 && (
                    <p className="text-xs text-red-500 text-center py-2">لا توجد منتجات</p>
                  )}
                </div>
              </div>

              {/* Editable total */}
              <div>
                <label className="block text-xs font-bold text-sand-600 mb-1">الإجمالي (ر.ي)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editTotal}
                    onChange={(e) => setEditTotal(e.target.value)}
                    className="w-32 h-10 rounded-lg bg-sand-50 border border-sand-200 focus:border-brand-400 px-3 text-sm outline-none"
                  />
                  <button
                    onClick={() => setEditTotal(String(computedTotal))}
                    className="text-xs font-bold text-brand-600 hover:underline"
                  >
                    حساب تلقائي: {formatSAR(computedTotal)}
                  </button>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => {
                    setEditing(false);
                    setEditItems(order.items.map((i) => ({ ...i })));
                    setEditTotal(String(order.total));
                  }}
                  className="flex-1 h-10 rounded-full border border-sand-300 text-sand-700 font-bold text-sm hover:bg-sand-100 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="flex-[2] h-10 rounded-full text-white font-bold text-sm transition-colors"
                  style={{ backgroundColor: '#8b2c4d' }}
                >
                  حفظ التعديلات
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Order info */}
              <div className="bg-white rounded-2xl border border-sand-200 p-4 space-y-2">
                <InfoRow label="المنطقة" value={order.area || '—'} />
                <InfoRow label="العميل" value={order.customer_name || '—'} />
                <InfoRow label="الهاتف" value={order.customer_phone || '—'} />
                <InfoRow
                  label="طريقة الدفع"
                  value={PAYMENT_METHOD_LABELS[order.payment_method ?? 'cash']}
                />
              </div>

              {/* Products */}
              <div className="bg-white rounded-2xl border border-sand-200 overflow-hidden">
                <div className="px-4 py-2.5 bg-sand-50 border-b border-sand-100">
                  <span className="text-sm font-bold text-sand-700">المنتجات</span>
                </div>
                <div className="px-4 py-3 space-y-2">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <span className="text-sand-700">
                        {item.product_name}
                        <span className="text-sand-400 text-xs mr-1">
                          ({item.unit === 'half' ? 'نصف كرتون' : 'كرتون كامل'} × {item.qty})
                        </span>
                      </span>
                      <span className="font-bold text-sand-800">{formatSAR(item.price * item.qty)}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-2 border-t border-sand-100">
                    <span className="text-sm font-bold text-sand-600">الإجمالي</span>
                    <span className="text-base font-extrabold text-brand-700">{formatSAR(order.total)}</span>
                  </div>
                </div>
              </div>

              {/* Quick status buttons in modal */}
              <div className="flex gap-2">
                {QUICK_STATUS_BUTTONS.map((btn) => {
                  const isActive = status === btn.id;
                  return (
                    <button
                      key={btn.id}
                      onClick={() => onStatusChange(btn.id)}
                      disabled={updating}
                      className={`flex-1 h-10 rounded-full font-bold text-xs transition-all disabled:opacity-50 ${
                        isActive ? 'text-white shadow-soft' : 'bg-sand-100 text-sand-600 hover:bg-sand-200'
                      }`}
                      style={isActive ? { backgroundColor: '#8b2c4d' } : undefined}
                    >
                      {updating ? <Loader2 size={12} className="animate-spin mx-auto" /> : btn.label}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Bottom action buttons */}
        {!editing && (
          <div className="sticky bottom-0 bg-white border-t border-sand-200 px-5 py-3 space-y-2">
            <div className="flex gap-2">
              <button
                onClick={() => setEditing(true)}
                className="flex-1 h-11 rounded-full text-white font-bold text-sm transition-colors flex items-center justify-center gap-1.5"
                style={{ backgroundColor: '#8b2c4d' }}
              >
                <Pencil size={16} />
                تعديل الفاتورة
              </button>
              <button
                onClick={handleShareWhatsApp}
                className="flex-1 h-11 rounded-full bg-green-600 hover:bg-green-700 text-white font-bold text-sm transition-colors flex items-center justify-center gap-1.5"
              >
                <MessageCircle size={16} />
                مشاركة واتساب
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handlePrint80mm}
                className="flex-1 h-11 rounded-full bg-sand-800 hover:bg-sand-900 text-white font-bold text-sm transition-colors flex items-center justify-center gap-1.5"
              >
                <Receipt size={16} />
                طباعة حرارية 80mm
              </button>
              <button
                onClick={handlePrintPDF}
                className="flex-1 h-11 rounded-full bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm transition-colors flex items-center justify-center gap-1.5"
              >
                <Printer size={16} />
                طباعة PDF
              </button>
            </div>
            <button
              onClick={onClose}
              className="w-full h-11 rounded-full border border-sand-300 text-sand-700 font-bold text-sm hover:bg-sand-100 transition-colors"
            >
              إغلاق
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-sand-400">{label}</span>
      <span className="font-bold text-sand-800">{value}</span>
    </div>
  );
}

/* ---------------- Daily report modal ---------------- */

function DailyReportModal({ orders, onClose }: { orders: Order[]; onClose: () => void }) {
  const todayOrders = getTodayOrders(orders);
  const totalOrders = todayOrders.length;
  const totalRevenue = todayOrders.reduce((sum, o) => sum + o.total, 0);
  const deliveredOrders = todayOrders.filter((o) => (o.status ?? 'pending') === 'delivered');
  const deliveredRevenue = deliveredOrders.reduce((sum, o) => sum + o.total, 0);
  const todayDate = new Date().toLocaleDateString('ar-EG', { dateStyle: 'full' });

  const handlePrintReport = () => {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html dir="rtl"><head><meta charset="utf-8"><title>تقرير اليوم</title>
      <style>
        @page { size: A4; margin: 15mm; }
        body { font-family: 'Segoe UI', sans-serif; font-size: 14px; line-height: 1.8; max-width: 700px; margin: 0 auto; }
        h1 { text-align: center; color: #8b2c4d; }
        .date { text-align: center; color: #78716c; margin-bottom: 20px; }
        .stat { display: flex; justify-content: space-between; padding: 10px 15px; border-bottom: 1px solid #e7e5e4; }
        .stat-label { color: #57534e; }
        .stat-value { font-weight: bold; font-size: 18px; color: #1c1917; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { padding: 6px 8px; text-align: right; border-bottom: 1px solid #e7e5e4; }
        th { background: #f5f5f4; }
      </style></head><body>
      <h1>تقرير مبيعات اليوم</h1>
      <p class="date">${todayDate}</p>
      <div class="stat"><span class="stat-label">إجمالي عدد الطلبات</span><span class="stat-value">${totalOrders}</span></div>
      <div class="stat"><span class="stat-label">إجمالي المبالغ</span><span class="stat-value">${formatSAR(totalRevenue)}</span></div>
      <div class="stat"><span class="stat-label">المبالغ المستلمة (مكتملة)</span><span class="stat-value">${formatSAR(deliveredRevenue)}</span></div>
      <div class="stat"><span class="stat-label">عدد الطلبات المكتملة</span><span class="stat-value">${deliveredOrders.length}</span></div>
      <table><thead><tr><th>العميل</th><th>الهاتف</th><th>المنطقة</th><th>الإجمالي</th><th>الحالة</th></tr></thead><tbody>
      ${todayOrders.map((o) => `<tr><td>${o.customer_name || '—'}</td><td>${o.customer_phone || '—'}</td><td>${o.area || '—'}</td><td>${formatSAR(o.total)}</td><td>${ORDER_STATUS_LABELS[(o.status ?? 'pending') as OrderStatus]}</td></tr>`).join('')}
      </tbody></table>
      </body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative bg-sand-50 w-full sm:max-w-md max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl shadow-2xl animate-pop-in">
        <div className="sticky top-0 bg-white border-b border-sand-200 px-5 py-4 flex items-center justify-between z-10">
          <h2 className="font-extrabold text-lg text-sand-900">تقرير اليوم</h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full text-sand-400 hover:bg-sand-100 flex items-center justify-center transition-colors"
            aria-label="إغلاق"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-center text-sm text-sand-500">{todayDate}</p>

          <div className="bg-white rounded-2xl border border-sand-200 p-4 space-y-3">
            <ReportStat label="إجمالي عدد الطلبات" value={String(totalOrders)} />
            <ReportStat label="إجمالي المبالغ" value={formatSAR(totalRevenue)} />
            <ReportStat label="المبالغ المستلمة (مكتملة)" value={formatSAR(deliveredRevenue)} />
            <ReportStat label="عدد الطلبات المكتملة" value={String(deliveredOrders.length)} />
          </div>

          {todayOrders.length > 0 && (
            <div className="bg-white rounded-2xl border border-sand-200 overflow-hidden">
              <div className="px-4 py-2.5 bg-sand-50 border-b border-sand-100">
                <span className="text-sm font-bold text-sand-700">طلبات اليوم ({todayOrders.length})</span>
              </div>
              <div className="px-4 py-3 space-y-2 max-h-48 overflow-y-auto">
                {todayOrders.map((o) => (
                  <div key={o.id} className="flex items-center justify-between text-sm">
                    <div className="min-w-0">
                      <p className="font-bold text-sand-800 truncate">{o.area || o.customer_name || '—'}</p>
                      <p className="text-[11px] text-sand-400">{o.customer_phone || ''}</p>
                    </div>
                    <div className="text-left shrink-0">
                      <p className="font-bold text-brand-700">{formatSAR(o.total)}</p>
                      <span
                        className="text-[10px] font-bold text-white px-1.5 py-0.5 rounded-full"
                        style={{ backgroundColor: ORDER_STATUS_COLORS[(o.status ?? 'pending') as OrderStatus] ?? '#f59e0b' }}
                      >
                        {ORDER_STATUS_LABELS[(o.status ?? 'pending') as OrderStatus]}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white border-t border-sand-200 px-5 py-3 flex gap-2">
          <button
            onClick={handlePrintReport}
            className="flex-1 h-11 rounded-full text-white font-bold text-sm transition-colors flex items-center justify-center gap-1.5"
            style={{ backgroundColor: '#8b2c4d' }}
          >
            <Printer size={16} />
            طباعة التقرير
          </button>
          <button
            onClick={() => exportTodayCSV(orders)}
            className="flex-1 h-11 rounded-full bg-white border border-sand-300 text-sand-700 font-bold text-sm hover:bg-sand-100 transition-colors flex items-center justify-center gap-1.5"
          >
            <Download size={16} />
            تصدير CSV
          </button>
        </div>
      </div>
    </div>
  );
}

function ReportStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-sand-500">{label}</span>
      <span className="text-base font-extrabold text-sand-900">{value}</span>
    </div>
  );
}

/* ---------------- Customers admin tab ---------------- */

function CustomersAdminTab() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Customer | null>(null);
  const { notify } = useToast();

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAllCustomers();
      setCustomers(data);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'فشل تحميل العملاء', 'error');
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    loadCustomers();
    const channel = supabase
      .channel('admin-customers-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, () => {
        loadCustomers();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadCustomers]);

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-sand-400">
        <Loader2 size={32} className="animate-spin text-brand-600" />
        <p className="text-sm font-medium">جارٍ تحميل العملاء...</p>
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-dashed border-sand-300 py-16 flex flex-col items-center text-sand-400">
        <Users size={56} strokeWidth={1.2} className="mb-3" />
        <p className="font-medium text-sand-600">لا يوجد عملاء مسجلون بعد</p>
        <p className="text-sm mt-1">سيظهر العملاء الذين سجلوا بياناتهم من المتجر هنا</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-xl font-extrabold text-sand-900">جميع العملاء والمنشآت</h2>
        <p className="text-sm text-sand-500 mt-0.5">{customers.length} عميل</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {customers.map((c) => (
          <div
            key={c.id}
            className="bg-white rounded-2xl border border-sand-200 p-4 shadow-card hover:shadow-soft transition-all flex items-center gap-3 animate-fade-in"
          >
            <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
              <Store size={22} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sand-800 truncate">{c.business_name || c.user_name}</p>
              <p className="text-xs text-sand-400 mt-0.5 truncate">
                {c.user_name && c.business_name ? c.user_name : c.phone || 'لا يوجد رقم'}
              </p>
              {c.latitude != null && c.longitude != null && (
                <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                  <MapPin size={10} />
                  موقع محدد
                </span>
              )}
            </div>
            <button
              onClick={() => setSelected(c)}
              className="shrink-0 flex items-center gap-1 bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold text-xs px-3 h-9 rounded-full transition-colors"
            >
              بيانات المنشأة
            </button>
          </div>
        ))}
      </div>

      {selected && (
        <CustomerDetailModal customer={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

function CustomerDetailModal({
  customer,
  onClose,
}: {
  customer: Customer;
  onClose: () => void;
}) {
  const hasLocation = customer.latitude != null && customer.longitude != null;
  const mapsUrl = hasLocation
    ? `https://www.google.com/maps?q=${customer.latitude},${customer.longitude}`
    : '';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative bg-sand-50 w-full sm:max-w-md max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl shadow-2xl animate-pop-in">
        <div className="sticky top-0 bg-white border-b border-sand-200 px-5 py-4 flex items-center justify-between z-10">
          <h2 className="font-extrabold text-lg text-sand-900">بيانات المنشأة</h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full text-sand-400 hover:bg-sand-100 flex items-center justify-center transition-colors"
            aria-label="إغلاق"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <DetailRow icon={<Store size={18} />} label="اسم النشاط التجاري" value={customer.business_name || '—'} />
          <DetailRow icon={<Users size={18} />} label="اسم المستخدم" value={customer.user_name || '—'} />
          <DetailRow icon={<Phone size={18} />} label="رقم الهاتف" value={customer.phone || '—'} />

          <div className="bg-white rounded-2xl border border-sand-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <MapPin size={18} className="text-brand-600" />
              <span className="text-sm font-bold text-sand-700">الموقع</span>
            </div>
            {hasLocation ? (
              <>
                <p className="text-xs text-sand-500 mb-3 font-mono">
                  {customer.latitude!.toFixed(6)}, {customer.longitude!.toFixed(6)}
                </p>
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 h-11 rounded-full bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm transition-colors shadow-soft"
                >
                  <ExternalLink size={16} />
                  فتح الموقع على Google Maps
                </a>
              </>
            ) : (
              <p className="text-sm text-sand-400">لم يتم تحديد موقع لهذا العميل</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 bg-white rounded-2xl border border-sand-200 p-3.5">
      <div className="w-10 h-10 rounded-xl bg-sand-50 text-sand-500 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-sand-400">{label}</p>
        <p className="text-sm font-bold text-sand-800 truncate">{value}</p>
      </div>
    </div>
  );
}

/* ---------------- Categories tab ---------------- */

function CategoriesTab({
  categories,
  products,
  onAdd,
  onDelete,
}: {
  categories: Category[];
  products: Product[];
  onAdd: (name: string) => void;
  onDelete: (c: Category) => void;
}) {
  const [name, setName] = useState('');
  const [adding, setAdding] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setAdding(true);
    try {
      await onAdd(name);
      setName('');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-xl font-extrabold text-sand-900">إدارة الأقسام</h2>
        <p className="text-sm text-sand-500 mt-0.5">
          الأقسام تظهر فوراً كخيارات عند إضافة منتج جديد
        </p>
      </div>

      <form onSubmit={submit} className="flex gap-2 mb-6 max-w-md">
        <div className="relative flex-1">
          <FolderPlus
            size={18}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-sand-400 pointer-events-none"
          />
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="اسم القسم الجديد..."
            className="w-full h-12 rounded-2xl bg-white border border-sand-200 focus:border-brand-400 pr-10 pl-4 text-sm outline-none transition-all"
          />
        </div>
        <button
          type="submit"
          disabled={!name.trim() || adding}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:bg-sand-300 text-white font-bold text-sm px-5 h-12 rounded-2xl transition-colors shadow-soft active:scale-95"
        >
          {adding ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
          إضافة قسم
        </button>
      </form>

      {categories.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-sand-300 py-16 flex flex-col items-center text-sand-400">
          <Boxes size={56} strokeWidth={1.2} className="mb-3" />
          <p className="font-medium text-sand-600">لا توجد أقسام بعد</p>
          <p className="text-sm mt-1">أضف أول قسم باستخدام الحقل أعلاه</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {categories.map((cat) => {
            const count = products.filter((p) => p.category_id === cat.id).length;
            return (
              <div
                key={cat.id}
                className="group bg-white rounded-2xl border border-sand-200 p-4 shadow-card hover:shadow-soft transition-all flex items-center gap-3 animate-fade-in"
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0"
                  style={{ backgroundColor: cat.color ?? '#059669' }}
                >
                  <Boxes size={22} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sand-800 truncate">{cat.name}</p>
                  <p className="text-xs text-sand-400 mt-0.5">{count} منتج</p>
                </div>
                <button
                  onClick={() => onDelete(cat)}
                  className="w-9 h-9 rounded-lg text-sand-400 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                  aria-label="حذف القسم"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------------- Product form modal ---------------- */

function ProductFormModal({
  draft,
  editing,
  saving,
  categories,
  fileRef,
  onDraftChange,
  onPickImage,
  onFileChange,
  onSave,
  onClose,
}: {
  draft: ProductDraft;
  editing: boolean;
  saving: boolean;
  categories: Category[];
  fileRef: React.RefObject<HTMLInputElement>;
  onDraftChange: (d: ProductDraft) => void;
  onPickImage: () => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  const noCategories = categories.length === 0;
  const set = (patch: Partial<ProductDraft>) => onDraftChange({ ...draft, ...patch });

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative bg-sand-50 w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl shadow-2xl animate-pop-in">
        <div className="sticky top-0 bg-white border-b border-sand-200 px-5 py-4 flex items-center justify-between z-10">
          <h2 className="font-extrabold text-lg text-sand-900">
            {editing ? 'تعديل المنتج' : 'إضافة منتج جديد'}
          </h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full text-sand-400 hover:bg-sand-100 flex items-center justify-center transition-colors"
            aria-label="إغلاق"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {noCategories && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-2xl p-3 text-sm">
              <AlertTriangle size={18} className="shrink-0 mt-0.5" />
              <p>لا توجد أقسام بعد. الرجاء إضافة قسم من تبويب "الأقسام" أولاً.</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-sand-700 mb-2">صورة المنتج</label>
            <div className="flex items-center gap-4">
              <div className="w-28 h-28 rounded-2xl bg-white border-2 border-dashed border-sand-300 overflow-hidden flex items-center justify-center shrink-0">
                {draft.image ? (
                  <img src={draft.image} alt="معاينة" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon size={32} className="text-sand-300" />
                )}
              </div>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={onPickImage}
                  className="flex items-center gap-2 bg-white border border-sand-300 hover:border-brand-400 text-sand-700 font-bold text-sm px-4 h-10 rounded-full transition-colors"
                >
                  <Upload size={16} />
                  اختيار صورة من ملفاتي
                </button>
                {draft.image && (
                  <button
                    type="button"
                    onClick={() => set({ image: '' })}
                    className="text-xs text-red-500 hover:underline self-start"
                  >
                    إزالة الصورة
                  </button>
                )}
                <p className="text-xs text-sand-400">يُفضل صورة مربعة بخلفية بيضاء</p>
              </div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={onFileChange} className="hidden" />
          </div>

          <Field label="اسم المنتج">
            <input
              type="text"
              value={draft.name}
              onChange={(e) => set({ name: e.target.value })}
              placeholder="مثال: بسكويت بالشوكولاتة - كرتون"
              className="w-full h-11 rounded-xl bg-white border border-sand-200 focus:border-brand-400 px-3 text-sm outline-none transition-all"
            />
          </Field>

          <Field label="القسم">
            <select
              value={draft.categoryId}
              onChange={(e) => set({ categoryId: e.target.value })}
              disabled={noCategories}
              className="w-full h-11 rounded-xl bg-white border border-sand-200 focus:border-brand-400 px-3 text-sm outline-none transition-all disabled:bg-sand-100"
            >
              {categories.length === 0 && <option value="">لا توجد أقسام</option>}
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="سعر الكرتون الكامل (ر.ي)">
              <input
                type="number"
                min="0"
                step="0.01"
                value={draft.price}
                onChange={(e) => set({ price: e.target.value })}
                placeholder="0"
                className="w-full h-11 rounded-xl bg-white border border-sand-200 focus:border-brand-400 px-3 text-sm outline-none transition-all"
              />
            </Field>
            <Field label="عدد الحبات في الكرتون">
              <input
                type="number"
                min="0"
                step="1"
                value={draft.fullCartonUnits}
                onChange={(e) => set({ fullCartonUnits: e.target.value })}
                placeholder="مثال: 24"
                className="w-full h-11 rounded-xl bg-white border border-sand-200 focus:border-brand-400 px-3 text-sm outline-none transition-all"
              />
            </Field>
          </div>

          <Field label="الكمية المتوفرة">
            <input
              type="number"
              min="0"
              step="1"
              value={draft.stock}
              onChange={(e) => set({ stock: e.target.value })}
              placeholder="0"
              className="w-full h-11 rounded-xl bg-white border border-sand-200 focus:border-brand-400 px-3 text-sm outline-none transition-all"
            />
          </Field>

          <label className="flex items-center gap-3 bg-white border border-sand-200 rounded-2xl p-3.5 cursor-pointer hover:border-blue-300 transition-colors">
            <button
              type="button"
              onClick={() => set({ halfCartonEnabled: !draft.halfCartonEnabled })}
              className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${
                draft.halfCartonEnabled ? 'bg-blue-500 border-blue-500' : 'bg-white border-sand-300'
              }`}
              aria-pressed={draft.halfCartonEnabled}
              aria-label="تفعيل بيع نصف كرتون"
            >
              {draft.halfCartonEnabled && <Check size={16} className="text-white" />}
            </button>
            <span className="text-sm font-bold text-sand-800">تفعيل بيع نصف كرتون</span>
          </label>

          {draft.halfCartonEnabled && (
            <div className="grid grid-cols-2 gap-3 animate-fade-in">
              <Field label="سعر نصف الكرتون (ر.ي)">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={draft.halfCartonPrice}
                  onChange={(e) => set({ halfCartonPrice: e.target.value })}
                  placeholder="0"
                  className="w-full h-11 rounded-xl bg-white border border-sand-200 focus:border-brand-400 px-3 text-sm outline-none transition-all"
                />
              </Field>
              <Field label="عدد الحبات في نصف الكرتون">
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={draft.halfCartonUnits}
                  onChange={(e) => set({ halfCartonUnits: e.target.value })}
                  placeholder="مثال: 12"
                  className="w-full h-11 rounded-xl bg-white border border-sand-200 focus:border-brand-400 px-3 text-sm outline-none transition-all"
                />
              </Field>
            </div>
          )}

          <Field label="الوصف (اختياري)">
            <textarea
              value={draft.description}
              onChange={(e) => set({ description: e.target.value })}
              rows={2}
              placeholder="وصف مختصر للمنتج..."
              className="w-full rounded-xl bg-white border border-sand-200 focus:border-brand-400 px-3 py-2 text-sm outline-none transition-all resize-none"
            />
          </Field>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-sand-200 px-5 py-3 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 h-11 rounded-full border border-sand-300 text-sand-700 font-bold text-sm hover:bg-sand-100 transition-colors"
          >
            إلغاء
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="flex-[2] h-11 rounded-full bg-brand-600 hover:bg-brand-700 disabled:bg-brand-400 text-white font-bold text-sm transition-colors shadow-soft flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {editing ? 'حفظ التعديلات' : 'إضافة المنتج'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-bold text-sand-700 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-colors ${
        active ? 'border-brand-600 text-brand-700' : 'border-transparent text-sand-500 hover:text-sand-800'
      }`}
    >
      {icon}
      {children}
    </button>
  );
}
