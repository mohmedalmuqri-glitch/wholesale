import { useHashRoute } from '@/hooks/useHashRoute';
import { ToastProvider } from '@/components/Toast';
import { Storefront } from '@/components/Storefront';
import { Admin } from '@/components/Admin';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { Loader2 } from 'lucide-react';

export default function App() {
  const route = useHashRoute();
  const { categories, products, loading, error, refresh } = useSupabaseData();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-sand-400">
        <Loader2 size={40} className="animate-spin text-brand-600" />
        <p className="text-sm font-medium">جارٍ تحميل البيانات...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-red-500 px-6 text-center">
        <p className="text-base font-bold">تعذر الاتصال بقاعدة البيانات</p>
        <p className="text-sm text-sand-500">{error}</p>
        <button
          onClick={refresh}
          className="mt-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm px-5 h-11 rounded-full transition-colors"
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  return (
    <ToastProvider>
      {route === 'admin' ? (
        <Admin categories={categories} products={products} onRefresh={refresh} />
      ) : (
        <Storefront categories={categories} products={products} />
      )}
    </ToastProvider>
  );
}
