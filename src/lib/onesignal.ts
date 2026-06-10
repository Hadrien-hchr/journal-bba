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
        const playerId = OneSignal.User?.PushSubscription?.id ?? null;
        resolve(playerId);
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
