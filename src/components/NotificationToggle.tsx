import { Bell, BellOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useAuth } from '@/contexts/AuthContext';

export function NotificationToggle() {
  const { user } = useAuth();
  const { isSupported, isSubscribed, isLoading, toggleSubscription } = usePushNotifications();

  if (!user || !isSupported) return null;

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleSubscription}
      disabled={isLoading}
      title={isSubscribed ? 'Désactiver les notifications' : 'Activer les notifications'}
    >
      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : isSubscribed ? (
        <Bell className="h-5 w-5 text-primary" />
      ) : (
        <BellOff className="h-5 w-5 text-muted-foreground" />
      )}
    </Button>
  );
}
