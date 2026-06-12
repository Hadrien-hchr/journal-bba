// Public OneSignal App ID (safe to expose)
export const ONESIGNAL_APP_ID = '1bda6e22-6202-4cc0-8856-3401ba221fe9';

declare global {
  interface Window {
    OneSignal?: any;
    OneSignalDeferred?: any[];
  }
}

let initStarted = false;

export function initOneSignal() {
  if (typeof window === 'undefined') return;
  if (initStarted) return;
  initStarted = true;

  // Skip in Lovable preview iframes (still works in published app)
  const host = window.location.hostname;
  if (host.startsWith('id-preview--') || host.startsWith('preview--')) return;

  // Inject SDK script once
  if (!document.querySelector('script[data-onesignal]')) {
    const s = document.createElement('script');
    s.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
    s.defer = true;
    s.setAttribute('data-onesignal', 'true');
    document.head.appendChild(s);
  }

  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(async (OneSignal: any) => {
    await OneSignal.init({
      appId: ONESIGNAL_APP_ID,
      serviceWorkerPath: '/OneSignalSDKWorker.js',
      notifyButton: { enable: false },
      allowLocalhostAsSecureOrigin: true,
    });
  });
}

export async function requestPushPermission(): Promise<string | null> {
  return new Promise((resolve) => {
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (OneSignal: any) => {
      try {
        await OneSignal.Notifications.requestPermission();

        // Player ID may not be available immediately — wait for it
        const getId = () => OneSignal.User?.PushSubscription?.id ?? null;
        let id = getId();
        if (id) return resolve(id);

        // Listen for subscription change (v16 API)
        const onChange = (ev: any) => {
          const newId = ev?.current?.id ?? getId();
          if (newId) {
            try { OneSignal.User.PushSubscription.removeEventListener('change', onChange); } catch {}
            resolve(newId);
          }
        };
        try {
          OneSignal.User.PushSubscription.addEventListener('change', onChange);
        } catch {}

        // Poll fallback (max ~6s)
        let tries = 0;
        const poll = setInterval(() => {
          tries += 1;
          const pid = getId();
          if (pid || tries > 30) {
            clearInterval(poll);
            try { OneSignal.User.PushSubscription.removeEventListener('change', onChange); } catch {}
            resolve(pid ?? null);
          }
        }, 200);
      } catch (e) {
        console.error('OneSignal permission error', e);
        resolve(null);
      }
    });
  });
}

export async function getPlayerId(): Promise<string | null> {
  return new Promise((resolve) => {
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push((OneSignal: any) => {
      resolve(OneSignal.User?.PushSubscription?.id ?? null);
    });
  });
}

// Re-sync the player ID into the profile on every app load (catches late subscriptions)
export function syncPlayerIdOnReady(onReady: (playerId: string) => void) {
  if (typeof window === 'undefined') return;
  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push((OneSignal: any) => {
    const current = OneSignal.User?.PushSubscription?.id;
    if (current) onReady(current);
    try {
      OneSignal.User.PushSubscription.addEventListener('change', (ev: any) => {
        const id = ev?.current?.id;
        if (id) onReady(id);
      });
    } catch {}
  });
}
