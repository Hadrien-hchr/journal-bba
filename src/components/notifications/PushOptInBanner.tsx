import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Share, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { initOneSignal, requestPushPermission, syncPlayerIdOnReady } from '@/lib/onesignal';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

const DISMISS_KEY = 'bba_push_dismissed_at';

function detectEnv() {
  if (typeof window === 'undefined') {
    return { isIOS: false, isStandalone: false, supportsPush: false };
  }
  const ua = window.navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
  const isStandalone =
    (window.matchMedia?.('(display-mode: standalone)').matches) ||
    // iOS-specific
    (window.navigator as any).standalone === true;
  const supportsPush =
    'Notification' in window &&
    'serviceWorker' in navigator &&
    'PushManager' in window;
  return { isIOS, isStandalone, supportsPush };
}

export function PushOptInBanner() {
  const { user } = useAuth();
  const { t } = useTranslation('common');
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showIOSHelp, setShowIOSHelp] = useState(false);
  const [env] = useState(detectEnv);

  useEffect(() => {
    // Only init OneSignal where push is actually usable
    if (env.supportsPush && (!env.isIOS || env.isStandalone)) {
      initOneSignal();
      // Re-sync the player ID into the profile (fixes users whose ID never got saved)
      if (user) {
        syncPlayerIdOnReady(async (playerId) => {
          await supabase
            .from('profiles')
            .update({ onesignal_player_id: playerId, push_enabled: true })
            .eq('id', user.id);
        });
      }
    }
  }, [env, user]);

  useEffect(() => {
    if (!user) return;
    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0);
    if (Date.now() - dismissedAt < 1000 * 60 * 60 * 24 * 7) return;

    // Already granted? Skip.
    if ('Notification' in window && Notification.permission === 'granted') return;

    // iOS non-installé : on affiche quand même le banner mais avec instructions PWA
    const t = setTimeout(() => setVisible(true), 2500);
    return () => clearTimeout(t);
  }, [user]);

  const handleEnable = async () => {
    // iOS Safari hors PWA : impossible, on montre les instructions d'installation
    if (env.isIOS && !env.isStandalone) {
      setShowIOSHelp(true);
      return;
    }

    if (!env.supportsPush) {
      toast.error(t('push.unsupported'));
      return;
    }

    setLoading(true);
    // Safety: always release loading even if SDK never resolves
    const timeout = setTimeout(() => setLoading(false), 8000);

    try {
      const playerId = await requestPushPermission();
      clearTimeout(timeout);

      if (playerId && user) {
        await supabase
          .from('profiles')
          .update({ onesignal_player_id: playerId, push_enabled: true })
          .eq('id', user.id);
        toast.success(t('push.success'));
        setVisible(false);
      } else if ('Notification' in window && Notification.permission === 'denied') {
        toast.error(t('push.denied'));
      } else {
        toast.error(t('push.failed'));
      }
    } catch (e) {
      console.error(e);
      toast.error(t('push.error'));
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
    setShowIOSHelp(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 22 }}
          className="fixed bottom-24 inset-x-4 z-50 max-w-md mx-auto rounded-2xl glass shadow-elevated border border-primary/20 p-4"
        >
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
            aria-label={t('push.close')}
          >
            <X className="h-4 w-4" />
          </button>

          {showIOSHelp ? (
            <div className="pr-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="rounded-xl gradient-red p-2 shadow-red">
                  <Bell className="h-5 w-5 text-primary-foreground" />
                </div>
                <p className="font-semibold text-sm">{t('push.iosTitle')}</p>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                {t('push.iosIntro')}
              </p>
              <ol className="text-xs space-y-2 text-foreground/90">
                <li className="flex items-center gap-2">
                  <span className="font-semibold">1.</span>
                  {t('push.iosStep1a')} <Share className="inline h-4 w-4 mx-1 text-primary" /> {t('push.iosStep1b')}
                </li>
                <li className="flex items-center gap-2">
                  <span className="font-semibold">2.</span>
                  {t('push.iosStep2a')} <Plus className="inline h-4 w-4 mx-1 text-primary" /> {t('push.iosStep2b')}
                </li>
                <li className="flex items-center gap-2">
                  <span className="font-semibold">3.</span>
                  {t('push.iosStep3')}
                </li>
              </ol>
              <Button size="sm" variant="ghost" className="mt-3" onClick={handleDismiss}>
                {t('push.gotIt')}
              </Button>
            </div>
          ) : (
            <div className="flex items-start gap-3 pr-6">
              <div className="rounded-xl gradient-red p-2 shadow-red">
                <Bell className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">{t('push.title')}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {env.isIOS && !env.isStandalone
                    ? t('push.descIOS')
                    : t('push.desc')}
                </p>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" className="gradient-red shadow-red" onClick={handleEnable} disabled={loading}>
                    {env.isIOS && !env.isStandalone ? t('push.seeHow') : loading ? '...' : t('push.enable')}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={handleDismiss}>
                    {t('push.later')}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
