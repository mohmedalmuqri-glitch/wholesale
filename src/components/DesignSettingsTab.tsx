import { useEffect, useState, type ReactNode } from 'react';
import { ArrowDown, ArrowUp, Check, Eye, EyeOff, Loader2, Palette, RotateCcw, Type, LayoutTemplate, Package } from 'lucide-react';
import {
  ALL_COMPONENT_LABELS,
  DEFAULT_DESIGN_SETTINGS,
  FONT_OPTIONS,
  HOME_SECTION_LABELS,
  NAV_TAB_LABELS,
  type BottomTab,
  type ComponentId,
  type DesignSettings,
  type HomeSectionId,
} from '@/types';
import { fetchDesignSettings, updateDesignSettings } from '@/lib/db';
import { useToast } from './Toast';

type DesignSection = 'colors' | 'typography' | 'layout' | 'products';

const SECTION_TABS: Array<{ id: DesignSection; label: string; icon: typeof Palette }> = [
  { id: 'colors', label: 'الألوان', icon: Palette },
  { id: 'typography', label: 'الخطوط', icon: Type },
  { id: 'layout', label: 'الترتيب والأقسام', icon: LayoutTemplate },
  { id: 'products', label: 'البطاقات', icon: Package },
];

const COLOR_FIELDS: Array<{ key: 'primary_color' | 'active_color' | 'button_color' | 'badge_color'; label: string; hint: string }> = [
  { key: 'primary_color', label: 'اللون الرئيسي للتطبيق', hint: 'يُستخدم في العناوين والأسعار وخلفيات التدرج.' },
  { key: 'active_color', label: 'لون القسم النشط', hint: 'يظهر على التبويب الحالي وعلى التصنيف المختار.' },
  { key: 'button_color', label: 'لون الأزرار', hint: 'أزرار الإضافة للسلة والشراء وتسوّق الآن.' },
  { key: 'badge_color', label: 'لون شارات العروض', hint: 'شارة نصف الكرتون وعدادات الإشعارات.' },
];

const BODY_WEIGHTS: Array<{ value: DesignSettings['body_weight']; label: string }> = [
  { value: 400, label: 'عادي' },
  { value: 500, label: 'متوسط' },
  { value: 600, label: 'شبه عريض' },
];

const BOLD_WEIGHTS: Array<{ value: DesignSettings['bold_weight']; label: string }> = [
  { value: 700, label: 'عريض' },
  { value: 800, label: 'عريض جداً' },
  { value: 900, label: 'أثقل' },
];

const SCALE_FIELDS: Array<{ key: 'heading_scale' | 'body_scale' | 'button_scale'; label: string }> = [
  { key: 'heading_scale', label: 'حجم العناوين' },
  { key: 'body_scale', label: 'حجم النصوص' },
  { key: 'button_scale', label: 'حجم الأزرار' },
];

function moveItem<T>(items: T[], index: number, direction: -1 | 1): T[] {
  const target = index + direction;
  if (target < 0 || target >= items.length) return items;
  const next = [...items];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export function DesignSettingsTab() {
  const { notify } = useToast();
  const [saved, setSaved] = useState<DesignSettings | null>(null);
  const [draft, setDraft] = useState<DesignSettings | null>(null);
  const [section, setSection] = useState<DesignSection>('colors');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchDesignSettings()
      .then((value) => {
        setSaved(value);
        setDraft(value);
      })
      .catch(() => notify('تعذر تحميل إعدادات التصميم', 'error'))
      .finally(() => setLoading(false));
  }, [notify]);

  if (loading) {
    return (
      <div className="min-h-[360px] flex items-center justify-center text-brand-600">
        <Loader2 size={30} className="animate-spin" />
      </div>
    );
  }

  if (!draft || !saved) {
    return <p className="text-center text-sm font-bold text-red-500">تعذر تحميل إعدادات التصميم، حاول تحديث الصفحة.</p>;
  }

  const update = <K extends keyof DesignSettings>(key: K, value: DesignSettings[K]) =>
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));

  const toggleHidden = (id: ComponentId) =>
    update(
      'hidden_components',
      draft.hidden_components.includes(id)
        ? draft.hidden_components.filter((item) => item !== id)
        : [...draft.hidden_components, id]
    );

  const isDirty = JSON.stringify(draft) !== JSON.stringify(saved);

  const save = async () => {
    setSaving(true);
    try {
      const updated = await updateDesignSettings(draft);
      setSaved(updated);
      setDraft(updated);
      notify('تم حفظ التصميم وتطبيقه على التطبيق');
    } catch {
      notify('تعذر حفظ التصميم', 'error');
    } finally {
      setSaving(false);
    }
  };

  const sharedProps = { draft, update, toggleHidden };

  return (
    <div className="max-w-3xl mx-auto space-y-5" dir="rtl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-sand-900">التصميم والمظهر</h2>
          <p className="text-sm text-sand-500 mt-1">غيّر ألوان التطبيق وخطوطه وترتيب أقسامه. تُطبَّق التغييرات فوراً عند الحفظ.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setDraft({ ...DEFAULT_DESIGN_SETTINGS, id: saved.id, updated_at: saved.updated_at })}
            className="h-11 px-4 rounded-full border border-sand-300 text-sand-700 font-bold text-sm hover:bg-sand-100 transition-colors flex items-center gap-2"
          >
            <RotateCcw size={16} />
            الافتراضي
          </button>
          <button
            type="button"
            onClick={save}
            disabled={!isDirty || saving}
            className="h-11 px-5 rounded-full bg-green-600 hover:bg-green-700 disabled:bg-sand-300 text-white font-bold text-sm transition-colors flex items-center gap-2"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            حفظ التصميم
          </button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto rounded-2xl bg-sand-100 p-1.5" role="tablist">
        {SECTION_TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={section === id}
            onClick={() => setSection(id)}
            className={`flex h-10 flex-1 shrink-0 items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold transition-all ${
              section === id ? 'bg-white text-brand-700 shadow-card' : 'text-sand-500 hover:text-sand-800'
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {section === 'colors' && <ColorsSection {...sharedProps} />}
      {section === 'typography' && <TypographySection {...sharedProps} />}
      {section === 'layout' && <LayoutSection {...sharedProps} />}
      {section === 'products' && <ProductsSection {...sharedProps} />}
    </div>
  );
}

type SectionProps = {
  draft: DesignSettings;
  update: <K extends keyof DesignSettings>(key: K, value: DesignSettings[K]) => void;
  toggleHidden: (id: ComponentId) => void;
};

function ColorsSection({ draft, update }: SectionProps) {
  return (
    <SectionCard title="ألوان التطبيق" description="اختر الألوان وسيتم توليد درجاتها تلقائياً.">
      <div className="grid gap-4 sm:grid-cols-2">
        {COLOR_FIELDS.map((field) => (
          <label key={field.key} className="flex items-center gap-3 rounded-2xl border border-sand-200 bg-sand-50 p-3">
            <input
              type="color"
              value={draft[field.key]}
              onChange={(e) => update(field.key, e.target.value)}
              className="h-12 w-14 shrink-0 cursor-pointer rounded-xl border-0 bg-transparent p-0"
              aria-label={field.label}
            />
            <span className="min-w-0">
              <span className="block text-sm font-bold text-sand-800">{field.label}</span>
              <span className="mt-0.5 block text-xs text-sand-500">{field.hint}</span>
              <span className="mt-1 block text-[11px] font-mono text-sand-400" dir="ltr">{draft[field.key]}</span>
            </span>
          </label>
        ))}
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-3 rounded-2xl border border-sand-200 p-4">
        <span className="rounded-full px-5 py-2 text-sm font-bold text-white" style={{ backgroundColor: draft.button_color }}>
          زر تجريبي
        </span>
        <span className="text-sm font-bold" style={{ color: draft.active_color }}>قسم نشط</span>
        <span className="rounded-full px-3 py-1 text-[11px] font-bold text-white" style={{ backgroundColor: draft.badge_color }}>
          متاح نصف كرتون
        </span>
        <span className="text-base font-extrabold" style={{ color: draft.primary_color }}>عنوان رئيسي</span>
      </div>
    </SectionCard>
  );
}

function TypographySection({ draft, update }: SectionProps) {
  return (
    <div className="space-y-5">
      <SectionCard title="نوع الخط" description="يُطبَّق الخط على التطبيق كله.">
        <div className="grid gap-2 sm:grid-cols-2">
          {FONT_OPTIONS.map((font) => (
            <button
              key={font.value}
              type="button"
              onClick={() => update('font_family', font.value)}
              className={`flex h-12 items-center justify-between rounded-2xl border-2 px-4 text-sm transition-all ${
                draft.font_family === font.value ? 'border-brand-500 bg-brand-50 font-bold text-brand-700' : 'border-sand-200 text-sand-700 hover:border-sand-300'
              }`}
            >
              <span>{font.label}</span>
              {draft.font_family === font.value && <Check size={16} />}
            </button>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="أوزان الخط" description="الوزن العادي للنصوص والوزن العريض للعناوين والأزرار.">
        <div className="grid gap-5 sm:grid-cols-2">
          <ChoiceGroup
            label="الوزن العادي"
            options={BODY_WEIGHTS}
            value={draft.body_weight}
            onChange={(value) => update('body_weight', value)}
          />
          <ChoiceGroup
            label="الوزن العريض"
            options={BOLD_WEIGHTS}
            value={draft.bold_weight}
            onChange={(value) => update('bold_weight', value)}
          />
        </div>
      </SectionCard>

      <SectionCard title="أحجام النصوص" description="نسبة تكبير أو تصغير من الحجم الأساسي (80% إلى 140%).">
        <div className="space-y-5">
          {SCALE_FIELDS.map((field) => (
            <label key={field.key} className="block">
              <span className="flex items-center justify-between text-sm font-bold text-sand-700">
                {field.label}
                <span className="text-brand-700">{Math.round(draft[field.key] * 100)}%</span>
              </span>
              <input
                type="range"
                min={0.8}
                max={1.4}
                step={0.05}
                value={draft[field.key]}
                onChange={(e) => update(field.key, Number(e.target.value))}
                className="mt-2 w-full accent-brand-600"
              />
            </label>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

function LayoutSection({ draft, update, toggleHidden }: SectionProps) {
  const hidden = new Set<ComponentId>(draft.hidden_components);

  return (
    <div className="space-y-5">
      <SectionCard title="ترتيب الشريط السفلي" description="رتّب التبويبات. موقع زر العروض يتغير مع ترتيبه هنا.">
        <OrderList<BottomTab>
          items={draft.nav_order}
          labelOf={(id) => NAV_TAB_LABELS[id]}
          onMove={(index, direction) => update('nav_order', moveItem(draft.nav_order, index, direction))}
        />
      </SectionCard>

      <SectionCard title="أقسام الصفحة الرئيسية" description="رتّب الأقسام وأخفِ ما لا تريده.">
        <OrderList<HomeSectionId>
          items={draft.home_section_order}
          labelOf={(id) => HOME_SECTION_LABELS[id]}
          hidden={hidden}
          onToggle={toggleHidden}
          onMove={(index, direction) => update('home_section_order', moveItem(draft.home_section_order, index, direction))}
        />
      </SectionCard>

      <SectionCard title="عناصر الواجهة" description="إظهار أو إخفاء العناصر بنقرة واحدة.">
        <VisibilityList
          ids={(['search_bar', 'category_rail'] as const)}
          labelOf={(id) => ALL_COMPONENT_LABELS[id]}
          hidden={hidden}
          onToggle={toggleHidden}
        />
      </SectionCard>
    </div>
  );
}

function ProductsSection({ draft, update, toggleHidden }: SectionProps) {
  const hidden = new Set<ComponentId>(draft.hidden_components);
  const layouts: Array<{ value: DesignSettings['product_layout']; label: string; hint: string }> = [
    { value: 'grid', label: 'شبكي', hint: 'بطاقات متجاورة بصورة كبيرة' },
    { value: 'list', label: 'قائمة', hint: 'صف لكل منتج مع صورة صغيرة' },
  ];

  return (
    <div className="space-y-5">
      <SectionCard title="نمط عرض المنتجات" description="اختر طريقة عرض بطاقات المنتجات في المتجر.">
        <div className="grid gap-3 sm:grid-cols-2">
          {layouts.map((layout) => (
            <button
              key={layout.value}
              type="button"
              onClick={() => update('product_layout', layout.value)}
              className={`rounded-2xl border-2 p-4 text-right transition-all ${
                draft.product_layout === layout.value ? 'border-brand-500 bg-brand-50' : 'border-sand-200 hover:border-sand-300'
              }`}
            >
              <span className="block text-sm font-bold text-sand-800">{layout.label}</span>
              <span className="mt-1 block text-xs text-sand-500">{layout.hint}</span>
            </button>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="عناصر البطاقة" description="أظهر أو أخفِ أجزاء البطاقة.">
        <VisibilityList
          ids={(['product_badge', 'product_unit_label', 'product_qty_controls'] as const)}
          labelOf={(id) => ALL_COMPONENT_LABELS[id]}
          hidden={hidden}
          onToggle={toggleHidden}
        />
      </SectionCard>
    </div>
  );
}

function SectionCard({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className="bg-white rounded-3xl border border-sand-200 shadow-card p-5 sm:p-7">
      <h3 className="text-lg font-extrabold text-sand-900">{title}</h3>
      <p className="text-xs text-sand-500 mt-1 mb-5">{description}</p>
      {children}
    </section>
  );
}

function ChoiceGroup<T extends number>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div>
      <p className="text-sm font-bold text-sand-700 mb-2">{label}</p>
      <div className="flex flex-col gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`h-10 rounded-xl border-2 px-4 text-sm text-right transition-all ${
              value === option.value ? 'border-brand-500 bg-brand-50 font-bold text-brand-700' : 'border-sand-200 text-sand-700 hover:border-sand-300'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function OrderList<T extends string>({
  items,
  labelOf,
  hidden,
  onMove,
  onToggle,
}: {
  items: T[];
  labelOf: (id: T) => string;
  hidden?: Set<ComponentId>;
  onMove: (index: number, direction: -1 | 1) => void;
  onToggle?: (id: ComponentId) => void;
}) {
  return (
    <ol className="space-y-2">
      {items.map((id, index) => {
        const isHidden = hidden?.has(id as ComponentId) ?? false;
        return (
          <li
            key={id}
            className={`flex items-center justify-between gap-3 rounded-2xl border border-sand-200 px-3 py-2 ${isHidden ? 'bg-sand-50 opacity-60' : 'bg-white'}`}
          >
            <span className="text-sm font-bold text-sand-800">{labelOf(id)}</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onMove(index, -1)}
                disabled={index === 0}
                aria-label="تحريك للأعلى"
                className="flex h-9 w-9 items-center justify-center rounded-full text-sand-600 hover:bg-sand-100 disabled:opacity-30"
              >
                <ArrowUp size={16} />
              </button>
              <button
                type="button"
                onClick={() => onMove(index, 1)}
                disabled={index === items.length - 1}
                aria-label="تحريك للأسفل"
                className="flex h-9 w-9 items-center justify-center rounded-full text-sand-600 hover:bg-sand-100 disabled:opacity-30"
              >
                <ArrowDown size={16} />
              </button>
              {onToggle && (
                <button
                  type="button"
                  onClick={() => onToggle(id as ComponentId)}
                  aria-label={isHidden ? 'إظهار' : 'إخفاء'}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-sand-600 hover:bg-sand-100"
                >
                  {isHidden ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function VisibilityList({
  ids,
  labelOf,
  hidden,
  onToggle,
}: {
  ids: readonly ComponentId[];
  labelOf: (id: ComponentId) => string;
  hidden: Set<ComponentId>;
  onToggle: (id: ComponentId) => void;
}) {
  return (
    <ul className="space-y-2">
      {ids.map((id) => {
        const visible = !hidden.has(id);
        return (
          <li key={id} className="flex items-center justify-between gap-3 rounded-2xl border border-sand-200 px-4 py-3">
            <span className="text-sm font-bold text-sand-800">{labelOf(id)}</span>
            <button
              type="button"
              onClick={() => onToggle(id)}
              aria-label={`تبديل ${labelOf(id)}`}
              aria-pressed={visible}
              className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${visible ? 'bg-brand-600' : 'bg-sand-300'}`}
            >
              <span
                className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all ${visible ? 'right-1' : 'right-7'}`}
              />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
