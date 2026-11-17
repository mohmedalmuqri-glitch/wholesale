import { ClipboardList } from 'lucide-react';
import type { DriverSession } from '@/types';

type DriverOrdersPageProps = {
  session: DriverSession;
};

export function DriverOrdersPage({ session }: DriverOrdersPageProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-extrabold text-sand-900">الطلبات</h2>
        <span className="rounded-full bg-sand-100 px-3 py-1 text-xs font-bold text-sand-600">
          {session.name}
        </span>
      </div>

      <div className="flex min-h-[280px] flex-col items-center justify-center rounded-3xl border border-dashed border-sand-300 bg-white px-6 py-10 text-center">
        <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-sand-100 text-sand-400">
          <ClipboardList size={28} strokeWidth={1.5} />
        </span>
        <p className="text-sm font-bold text-sand-700">لا توجد طلبات حالياً</p>
        <p className="mt-1 max-w-xs text-xs text-sand-500">
          ستظهر هنا الطلبات المسندة إليك. هذه الصفحة جاهزة لإضافة المحتوى لاحقاً.
        </p>
      </div>
    </div>
  );
}
