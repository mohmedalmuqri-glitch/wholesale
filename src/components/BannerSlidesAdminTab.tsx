import { useEffect, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  ImagePlus,
  Loader2,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import type { AppBanner, BannerId } from '@/types';
import {
  deleteBannerImage,
  deleteBannerSlide,
  fetchBanners,
  insertBannerSlide,
  updateBannerSlide,
  uploadBannerImage,
} from '@/lib/db';
import { useToast } from './Toast';

type BannerGroup = Record<BannerId, AppBanner[]>;
const EMPTY_GROUP: BannerGroup = { home: [], offers: [] };
const LABELS: Record<BannerId, string> = { home: 'الصفحة الرئيسية', offers: 'صفحة العروض' };

function groupRows(rows: AppBanner[]): BannerGroup {
  return {
    home: rows.filter((row) => row.placement === 'home'),
    offers: rows.filter((row) => row.placement === 'offers'),
  };
}

export function BannerSlidesAdminTab() {
  const { notify } = useToast();
  const [groups, setGroups] = useState<BannerGroup>(EMPTY_GROUP);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [replaceId, setReplaceId] = useState<string | null>(null);
  const [placement, setPlacement] = useState<BannerId>('home');
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    try {
      setGroups(groupRows(await fetchBanners()));
    } catch {
      notify('تعذر تحميل البانرات', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const selected = Array.from(files);
    const invalid = selected.find((file) => !file.type.startsWith('image/') || file.size > 10 * 1024 * 1024);
    if (invalid) {
      notify('اختر صوراً فقط، على ألا يتجاوز حجم الصورة 10 ميجابايت', 'error');
      return;
    }

    setBusy(true);
    try {
      const replacement = replaceId ? groups[placement].find((row) => row.id === replaceId) : null;
      if (replacement) {
        const { url, path } = await uploadBannerImage(placement, selected[0]);
        try {
          await updateBannerSlide(replacement.id, { image_url: url, storage_path: path });
        } catch (error) {
          await deleteBannerImage(path).catch(() => undefined);
          throw error;
        }
        if (replacement.storage_path) await deleteBannerImage(replacement.storage_path).catch(() => undefined);
        setGroups((prev) => ({
          ...prev,
          [placement]: prev[placement].map((row) => row.id === replacement.id ? { ...row, image_url: url, storage_path: path } : row),
        }));
        notify('تم تغيير صورة البانر');
        return;
      }

      let nextOrder = groups[placement].length;
      for (const file of selected) {
        const { url, path } = await uploadBannerImage(placement, file);
        try {
          await insertBannerSlide(placement, url, path, nextOrder, file.name.replace(/\.[^.]+$/, ''));
        } catch (error) {
          await deleteBannerImage(path).catch(() => undefined);
          throw error;
        }
        nextOrder += 1;
      }
      await load();
      notify(selected.length === 1 ? 'تمت إضافة البانر' : `تمت إضافة ${selected.length} بانرات`);
    } catch (error) {
      notify(error instanceof Error ? error.message : 'فشل رفع البانرات', 'error');
    } finally {
      setBusy(false);
      setReplaceId(null);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const updateOrder = async (id: string, direction: -1 | 1) => {
    const current = groups[placement];
    const index = current.findIndex((row) => row.id === id);
    const targetIndex = index + direction;
    if (index < 0 || targetIndex < 0 || targetIndex >= current.length) return;

    const reordered = [...current];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
    setBusyId(id);
    try {
      await Promise.all(
        reordered.map((row, order) => updateBannerSlide(row.id, { sort_order: order }))
      );
      setGroups((prev) => ({ ...prev, [placement]: reordered.map((row, order) => ({ ...row, sort_order: order })) }));
    } catch (error) {
      notify(error instanceof Error ? error.message : 'تعذر تغيير ترتيب البانر', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const moveBanner = async (banner: AppBanner, nextPlacement: BannerId) => {
    if (banner.placement === nextPlacement) return;
    setBusyId(banner.id);
    try {
      await updateBannerSlide(banner.id, {
        placement: nextPlacement,
        sort_order: groups[nextPlacement].length,
      });
      setGroups((prev) => ({
        ...prev,
        [banner.placement]: prev[banner.placement].filter((row) => row.id !== banner.id),
        [nextPlacement]: [...prev[nextPlacement], { ...banner, placement: nextPlacement, sort_order: prev[nextPlacement].length }],
      }));
      notify(`تم نقل البانر إلى ${LABELS[nextPlacement]}`);
    } catch (error) {
      notify(error instanceof Error ? error.message : 'تعذر نقل البانر', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const toggleActive = async (banner: AppBanner) => {
    setBusyId(banner.id);
    try {
      await updateBannerSlide(banner.id, { is_active: !banner.is_active });
      setGroups((prev) => ({
        ...prev,
        [banner.placement]: prev[banner.placement].map((row) =>
          row.id === banner.id ? { ...row, is_active: !row.is_active } : row
        ),
      }));
    } catch (error) {
      notify(error instanceof Error ? error.message : 'تعذر تحديث حالة البانر', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (banner: AppBanner) => {
    if (!window.confirm('حذف هذا البانر نهائياً؟')) return;
    setBusyId(banner.id);
    try {
      if (banner.storage_path) await deleteBannerImage(banner.storage_path);
      await deleteBannerSlide(banner.id);
      setGroups((prev) => ({
        ...prev,
        [banner.placement]: prev[banner.placement]
          .filter((row) => row.id !== banner.id)
          .map((row, order) => ({ ...row, sort_order: order })),
      }));
      notify('تم حذف البانر', 'info');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'فشل حذف البانر', 'error');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return <div className="flex min-h-[360px] items-center justify-center text-brand-600"><Loader2 size={30} className="animate-spin" /></div>;
  }

  const slides = groups[placement];
  return (
    <div className="mx-auto max-w-4xl space-y-5" dir="rtl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-sand-900">إدارة البانرات المتحركة</h2>
          <p className="mt-1 text-sm text-sand-500">أضف عدداً غير محدود من الصور، ثم رتّبها أو أوقف ظهور أي صورة مؤقتاً.</p>
        </div>
        <div className="flex rounded-full border border-sand-200 bg-white p-1 shadow-card">
          {(['home', 'offers'] as BannerId[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setPlacement(item)}
              className={`rounded-full px-4 py-2 text-sm font-bold transition ${placement === item ? 'bg-brand-600 text-white' : 'text-sand-600 hover:bg-sand-100'}`}
            >
              {LABELS[item]}
            </button>
          ))}
        </div>
      </div>

      <section className="rounded-3xl border border-sand-200 bg-white p-4 shadow-card sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h3 className="font-extrabold text-sand-900">بانرات {LABELS[placement]}</h3>
            <p className="mt-1 text-xs text-sand-500">{slides.length} صورة · تظهر بالترتيب من الأعلى إلى الأسفل</p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={(event) => handleFiles(event.target.files)}
          />
          <button
            type="button"
            onClick={() => { setReplaceId(null); fileRef.current?.click(); }}
            disabled={busy}
            className="flex h-11 shrink-0 items-center gap-2 rounded-full bg-brand-600 px-4 text-sm font-bold text-white shadow-soft transition hover:bg-brand-700 disabled:opacity-50"
          >
            {busy ? <Loader2 size={17} className="animate-spin" /> : <ImagePlus size={17} />}
            إضافة صور
          </button>
        </div>

        {slides.length === 0 ? (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-sand-300 py-14 text-sand-400 transition hover:border-brand-400 hover:text-brand-600"
          >
            <Upload size={30} />
            <span className="mt-2 text-sm font-bold text-sand-600">أضف أول صورة للبانر</span>
            <span className="mt-1 text-xs">يمكن اختيار عدة صور مرة واحدة</span>
          </button>
        ) : (
          <div className="space-y-3">
            {slides.map((banner, index) => {
              const isBusy = busyId === banner.id;
              return (
                <article key={banner.id} className={`flex items-center gap-3 rounded-2xl border p-3 transition ${banner.is_active ? 'border-sand-200 bg-sand-50' : 'border-sand-200 bg-sand-100 opacity-65'}`}>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-sm font-extrabold text-sand-500">{index + 1}</span>
                  <div className="h-20 w-32 shrink-0 overflow-hidden rounded-xl border border-sand-200 bg-white sm:h-24 sm:w-44">
                    <img src={banner.image_url} alt={banner.alt_text || `بانر ${index + 1}`} className="h-full w-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-sand-800">{banner.alt_text || `بانر ${index + 1}`}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-xs text-sand-500">{banner.is_active ? 'مفعّل ويظهر للعملاء' : 'متوقف مؤقتاً'}</span>
                      <select
                        value={banner.placement}
                        onChange={(event) => moveBanner(banner, event.target.value as BannerId)}
                        disabled={isBusy}
                        className="h-7 rounded-lg border border-sand-200 bg-white px-2 text-[11px] font-bold text-sand-600 outline-none focus:border-brand-400"
                        aria-label="مكان ظهور البانر"
                      >
                        <option value="home">الرئيسية</option>
                        <option value="offers">العروض</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button type="button" onClick={() => { setReplaceId(banner.id); fileRef.current?.click(); }} disabled={isBusy || busy} className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-600 transition hover:bg-blue-100 disabled:opacity-50" aria-label="تغيير صورة البانر"><ImagePlus size={17} /></button>
                    <button type="button" onClick={() => toggleActive(banner)} disabled={isBusy} className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-green-600 transition hover:bg-green-50 disabled:opacity-50" aria-label={banner.is_active ? 'إيقاف البانر' : 'تفعيل البانر'}>
                      {banner.is_active ? <Eye size={17} /> : <EyeOff size={17} />}
                    </button>
                    <button type="button" onClick={() => updateOrder(banner.id, -1)} disabled={isBusy || index === 0} className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-sand-600 transition hover:bg-sand-200 disabled:opacity-35" aria-label="تحريك للأعلى"><ArrowUp size={17} /></button>
                    <button type="button" onClick={() => updateOrder(banner.id, 1)} disabled={isBusy || index === slides.length - 1} className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-sand-600 transition hover:bg-sand-200 disabled:opacity-35" aria-label="تحريك للأسفل"><ArrowDown size={17} /></button>
                    <button type="button" onClick={() => remove(banner)} disabled={isBusy} className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-red-500 transition hover:bg-red-50 disabled:opacity-50" aria-label="حذف البانر">{isBusy ? <Loader2 size={17} className="animate-spin" /> : <Trash2 size={17} />}</button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <div className="flex items-start gap-2 rounded-2xl border border-orange-200 bg-orange-50 p-4 text-xs leading-6 text-orange-800">
        <X size={16} className="mt-1 shrink-0" />
        <p>يفضّل استخدام صور بنفس الأبعاد حتى ينتقل السلايدر بسلاسة. الصور الموقوفة تبقى محفوظة ويمكن إعادتها للعرض في أي وقت.</p>
      </div>
    </div>
  );
}
