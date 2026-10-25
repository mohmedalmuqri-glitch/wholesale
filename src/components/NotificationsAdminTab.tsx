import { useCallback, useEffect, useState } from 'react';
import { Bell, Loader2, Send, Trash2 } from 'lucide-react';
import type { Notification } from '@/types';
import { fetchNotifications, deleteNotification, sendPushNotification } from '@/lib/db';
import { useToast } from './Toast';

export function NotificationsAdminTab() {
  const { notify } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchNotifications();
      setNotifications(data);
    } catch (err) {
      console.error('Failed to load notifications:', err);
      notify('تعذر تحميل الإشعارات', 'error');
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      notify('الرجاء إدخال العنوان والرسالة', 'error');
      return;
    }
    setSending(true);
    try {
      const result = await sendPushNotification(title.trim(), body.trim());
      if (!result.success) {
        console.error('Push notification failed:', result.detail);
        notify(`فشل الإرسال: ${result.detail}`, 'error');
        return;
      }
      const detail = result.detail ? ` (${result.detail})` : '';
      notify(`تم إرسال الإشعار بنجاح${detail}`);
      setTitle('');
      setBody('');
      await load();
    } catch (err) {
      console.error('Failed to send notification:', err);
      const msg = err instanceof Error ? err.message : 'تعذر إرسال الإشعار';
      notify(msg, 'error');
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('حذف هذا الإشعار؟')) return;
    try {
      await deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      notify('تم حذف الإشعار', 'info');
    } catch (err) {
      console.error('Failed to delete notification:', err);
      notify('تعذر حذف الإشعار', 'error');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5" dir="rtl">
      <div>
        <h2 className="text-xl font-extrabold text-sand-900">إرسال الإشعارات</h2>
        <p className="text-sm text-sand-500 mt-1">أرسل إشعارات وعروض للعملاء تظهر على أجهزتهم وفي التطبيق.</p>
      </div>

      <section className="bg-white rounded-3xl border border-sand-200 shadow-card p-5 sm:p-7">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center">
            <Send size={22} />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-sand-900">إنشاء إشعار جديد</h3>
            <p className="text-xs text-sand-500 mt-1">سيظهر الإشعار فوراً لجميع العملاء</p>
          </div>
        </div>

        <div className="space-y-4">
          <label className="block">
            <span className="text-sm font-bold text-sand-700">عنوان الإشعار</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: عرض خاص على البسكويت"
              className="mt-2 w-full h-12 rounded-2xl border border-sand-200 bg-sand-50 px-4 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
          </label>
          <label className="block">
            <span className="text-sm font-bold text-sand-700">نص الرسالة</span>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
              placeholder="اكتب نص الإشعار هنا..."
              className="mt-2 w-full rounded-2xl border border-sand-200 bg-sand-50 px-4 py-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 resize-none"
            />
          </label>
          <button
            onClick={handleSend}
            disabled={sending}
            className="h-11 px-5 rounded-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-bold text-sm transition-colors flex items-center gap-2"
          >
            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            إرسال الإشعار
          </button>
        </div>
      </section>

      <section className="bg-white rounded-3xl border border-sand-200 shadow-card p-5 sm:p-7">
        <h3 className="text-lg font-extrabold text-sand-900 mb-4">الإشعارات المرسلة</h3>

        {loading ? (
          <div className="flex items-center justify-center py-10 text-brand-600">
            <Loader2 size={26} className="animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-sand-400">
            <Bell size={40} strokeWidth={1.2} className="mb-2" />
            <p className="font-medium text-sand-600">لا توجد إشعارات مرسلة بعد</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => (
              <div
                key={n.id}
                className="flex items-start gap-3 rounded-2xl border border-sand-200 bg-sand-50 p-4"
              >
                <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                  <Bell size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sand-800 text-sm">{n.title}</p>
                  <p className="text-xs text-sand-500 mt-1 leading-relaxed">{n.body}</p>
                  <p className="text-[10px] text-sand-400 mt-2">
                    {new Date(n.created_at).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(n.id)}
                  className="w-8 h-8 rounded-lg text-sand-400 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-colors shrink-0"
                  aria-label="حذف الإشعار"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
