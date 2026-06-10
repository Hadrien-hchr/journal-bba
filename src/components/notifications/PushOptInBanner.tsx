import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { initOneSignal, requestPushPermission } from '@/lib/onesignal';
import { toast } from 'sonner';

const DISMISS_KEY = 'bba_push_dismissed_at';

export function PushOptInBanner() {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    initOneSignal();
  }, []);

  useEffect(() => {
    if (!user) return;
    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0);
    // Re-show after 7 days
    if (Date.now() - dismissedAt < 1000 * 60 * 60 * 24 * 7) return;

    if ('Notification' in window && Notification.permission === 'granted') return;
    const t = setTimeout(() => setVisible(true), 2500);
    return () => clearTimeout(t);
  }, [user]);

  const handleEnable = async () => {
    setLoading(true);
    try {
      const playerId = await requestPushPermission();
      if (playerId && user) {
        await supabase
          .from('profiles')
          .update({ onesignal_player_id: playerId, push_enabled: true })
          .eq('id', user.id);
        toast.success('Notifications activées 🔔');
      } else if (Notification.permission === 'denied') {
        toast.error('Notifications bloquées par le navigateur');
      }
      setVisible(false);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
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
          <div className="flex items-start gap-3 pr-6">
            <div className="rounded-xl gradient-red p-2 shadow-red">
              <Bell className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">Ne rate plus rien !</p>
              <p className="text-xs text-muted-foreground mt-1">
                Active les notifications pour être alerté·e des nouveaux événements et interviews.
              </p>
              <div className="flex gap-2 mt-3">
                <Button size="sm" className="gradient-red shadow-red" onClick={handleEnable} disabled={loading}>
                  Activer
                </Button>
                <Button size="sm" variant="ghost" onClick={handleDismiss}>
                  Plus tard
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
