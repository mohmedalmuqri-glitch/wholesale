import { useCallback, useEffect, useState } from 'react';
import { Bell, CheckCheck, Loader2, X } from 'lucide-react';
import type { Notification } from '@/types';
import { fetchNotifications, fetchReadNotificationIds, markAllNotificationsRead } from '@/lib/db';

type NotificationsPanelProps = {
  open: boolean;
  onClose: () => void;
  customerId: string | null;
  onUnreadChange: (count: number) => void;
};

export function NotificationsPanel({ open, onClose, customerId, onUnreadChange }: NotificationsPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [notifs, readSet] = await Promise.all([
        fetchNotifications(),
        customerId ? fetchReadNotificationIds(customerId) : Promise.resolve(new Set<string>()),
      ]);
      setNotifications(notifs);
      setReadIds(readSet);
      onUnreadChange(notifs.filter((n) => !readSet.has(n.id)).length);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [customerId, onUnreadChange]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  const handleMarkAllRead = async () => {
    const unreadIds = notifications.filter((n) => !readIds.has(n.id)).map((n) => n.id);
    if (unreadIds.length === 0) return;
    try {
      if (customerId) {
        await markAllNotificationsRead(unreadIds, customerId);
      }
      setReadIds((prev) => {
        const next = new Set(prev);
        unreadIds.forEach((id) => next.add(id));
        return next;
      });
      onUnreadChange(0);
    } catch {
      // silent
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative bg-sand-50 w-full sm:max-w-md max-h-[85vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl shadow-2xl animate-pop-in">
        <div className="sticky top-0 bg-white border-b border-sand-200 px-5 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <Bell size={20} className="text-orange-500" />
            <h2 className="font-extrabold text-lg text-sand-900">الإشعارات</h2>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full text-sand-400 hover:bg-sand-100 flex items-center justify-center transition-colors"
            aria-label="إغلاق"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-brand-600">
              <Loader2 size={28} className="animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-sand-400">
              <Bell size={44} strokeWidth={1.2} className="mb-3" />
              <p className="font-medium text-sand-600">لا توجد إشعارات</p>
              <p className="text-sm mt-1">ستظهر الإشعارات والعروض الجديدة هنا</p>
            </div>
          ) : (
            <>
              {notifications.some((n) => !readIds.has(n.id)) && (
                <button
                  onClick={handleMarkAllRead}
                  className="w-full flex items-center justify-center gap-2 h-10 rounded-full bg-white border border-sand-200 text-brand-700 font-bold text-xs hover:border-brand-300 transition-colors"
                >
                  <CheckCheck size={16} />
                  تحديد الكل كمقروء
                </button>
              )}
              {notifications.map((n) => {
                const isUnread = !readIds.has(n.id);
                return (
                  <div
                    key={n.id}
                    className={`rounded-2xl border p-4 transition-all ${
                      isUnread
                        ? 'border-orange-200 bg-orange-50/60'
                        : 'border-sand-200 bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isUnread ? 'bg-orange-100 text-orange-600' : 'bg-sand-100 text-sand-400'
                      }`}>
                        <Bell size={17} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sand-800 text-sm">{n.title}</p>
                          {isUnread && (
                            <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-sand-600 mt-1 leading-relaxed">{n.body}</p>
                        <p className="text-[10px] text-sand-400 mt-2">
                          {new Date(n.created_at).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
