import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Share, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { initOneSignal, requestPushPermission, syncPlayerIdOnReady } from '@/lib/onesignal';
import { toast } from 'sonner';

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
      toast.error("Ton navigateur ne supporte pas les notifications push.");
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
        toast.success('Notifications activées 🔔');
        setVisible(false);
      } else if ('Notification' in window && Notification.permission === 'denied') {
        toast.error('Notifications bloquées par le navigateur. Active-les dans les réglages du site.');
      } else {
        toast.error("Impossible d'activer les notifications. Réessaie depuis l'app installée.");
      }
    } catch (e) {
      console.error(e);
      toast.error("Erreur lors de l'activation des notifications.");
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
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>

          {showIOSHelp ? (
            <div className="pr-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="rounded-xl gradient-red p-2 shadow-red">
                  <Bell className="h-5 w-5 text-primary-foreground" />
                </div>
                <p className="font-semibold text-sm">Installe l'app pour recevoir les notifs</p>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Sur iPhone, les notifications ne fonctionnent qu'une fois Journal BBA ajouté à ton écran d'accueil :
              </p>
              <ol className="text-xs space-y-2 text-foreground/90">
                <li className="flex items-center gap-2">
                  <span className="font-semibold">1.</span>
                  Appuie sur <Share className="inline h-4 w-4 mx-1 text-primary" /> dans la barre Safari
                </li>
                <li className="flex items-center gap-2">
                  <span className="font-semibold">2.</span>
                  Choisis <Plus className="inline h-4 w-4 mx-1 text-primary" /> « Sur l'écran d'accueil »
                </li>
                <li className="flex items-center gap-2">
                  <span className="font-semibold">3.</span>
                  Ouvre l'app depuis l'icône et reviens activer les notifs
                </li>
              </ol>
              <Button size="sm" variant="ghost" className="mt-3" onClick={handleDismiss}>
                J'ai compris
              </Button>
            </div>
          ) : (
            <div className="flex items-start gap-3 pr-6">
              <div className="rounded-xl gradient-red p-2 shadow-red">
                <Bell className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">Ne rate plus rien !</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {env.isIOS && !env.isStandalone
                    ? "Sur iPhone, ajoute l'app à ton écran d'accueil pour recevoir les notifications."
                    : "Active les notifications pour être alerté·e des nouveaux événements et interviews."}
                </p>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" className="gradient-red shadow-red" onClick={handleEnable} disabled={loading}>
                    {env.isIOS && !env.isStandalone ? "Voir comment" : loading ? "..." : "Activer"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={handleDismiss}>
                    Plus tard
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
