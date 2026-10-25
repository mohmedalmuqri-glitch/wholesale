import { useCallback, useEffect, useRef, useState } from 'react';
import { upsertDeviceToken } from '@/lib/db';

type FcmState = {
  supported: boolean;
  permission: NotificationPermission | 'unsupported';
  token: string | null;
  error: string | null;
};

const FCM_VAPID_KEY = import.meta.env.VITE_FCM_VAPID_KEY ?? '';
const FCM_APP_SCRIPT = 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
const FCM_MESSAGING_SCRIPT = 'https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging.js';

let scriptsLoaded = false;
let messagingInstance: Record<string, unknown> | null = null;

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const s = document.createElement('script');
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });
}

async function getMessaging(): Promise<Record<string, unknown>> {
  if (!scriptsLoaded) {
    await loadScript(FCM_APP_SCRIPT);
    await loadScript(FCM_MESSAGING_SCRIPT);
    scriptsLoaded = true;
  }
  if (messagingInstance) return messagingInstance;

  const firebase = window as unknown as { firebase?: Record<string, unknown> };
  if (!firebase.firebase) throw new Error('Firebase SDK not loaded');

  const fb = firebase.firebase;
  const config = {
    apiKey: import.meta.env.VITE_FCM_API_KEY ?? '',
    authDomain: import.meta.env.VITE_FCM_AUTH_DOMAIN ?? '',
    projectId: import.meta.env.VITE_FCM_PROJECT_ID ?? '',
    messagingSenderId: import.meta.env.VITE_FCM_SENDER_ID ?? '',
    appId: import.meta.env.VITE_FCM_APP_ID ?? '',
  };
  const app = (fb.initializeApp as (c: typeof config) => unknown)(config);
  const messaging = (fb.messaging as (a: unknown) => Record<string, unknown>)(app);
  messagingInstance = messaging;

  (messaging.onMessage as (cb: (p: unknown) => void) => void)((payload: unknown) => {
    const data = payload as { notification?: { title?: string; body?: string } };
    const title = data?.notification?.title ?? 'إشعار جديد';
    const body = data?.notification?.body ?? '';
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.showNotification(title, { body, icon: '/Screenshot_٢٠٢٦٠٩٢٠-٠٠٠٨٠٢_Gallery.jpg' });
      });
    }
  });

  return messaging;
}

export function useFcm(customerId: string | null): FcmState {
  const [state, setState] = useState<FcmState>(() => ({
    supported: typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator,
    permission: typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported',
    token: null,
    error: null,
  }));
  const customerIdRef = useRef(customerId);
  customerIdRef.current = customerId;

  const register = useCallback(async () => {
    if (!state.supported) return;
    if (!FCM_VAPID_KEY) {
      setState((prev) => ({ ...prev, error: 'FCM_VAPID_KEY not configured' }));
      return;
    }
    try {
      const messaging = await getMessaging();
      const perm = await Notification.requestPermission();
      setState((prev) => ({ ...prev, permission: perm }));
      if (perm !== 'granted') return;

      const token = await (messaging.getToken as (key: string) => Promise<string>)(FCM_VAPID_KEY);
      if (!token) return;
      await upsertDeviceToken(token, customerIdRef.current, 'web');
      setState((prev) => ({ ...prev, token }));
    } catch (err) {
      setState((prev) => ({ ...prev, error: err instanceof Error ? err.message : 'FCM init failed' }));
    }
  }, [state.supported]);

  useEffect(() => {
    register();
  }, [register]);

  useEffect(() => {
    if (state.token && customerId) {
      upsertDeviceToken(state.token, customerId, 'web').catch(() => {});
    }
  }, [customerId, state.token]);

  return state;
}
