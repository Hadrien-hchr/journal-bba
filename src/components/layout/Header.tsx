import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Bell, LogOut, Shield, User } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import logoJ from '@/assets/logo-j.jpeg';
import { useTranslation } from 'react-i18next';

export default function Header() {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation('common');

  const handleSignOut = async () => {
    await signOut();
    toast.success(t('header.signOutSuccess'));
    navigate('/auth');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-strong border-b border-border/50">
      <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
        <div className="flex items-center gap-2.5">
          <img src={logoJ} alt="Journal BBA" className="w-8 h-8 rounded-lg object-cover shadow-sm" />
          <h1 className="text-lg font-display font-bold tracking-tight text-foreground">
            Journal <span className="text-gradient">BBA</span>
          </h1>
          {isAdmin && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
              <Shield className="h-2.5 w-2.5" />
              {t('admin')}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-0.5">
          {user && (
            <>
              {isAdmin && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate('/admin/notifications')}
                  className="text-muted-foreground hover:text-primary h-9 w-9 rounded-xl"
                  title={t('header.notifications')}
                >
                  <Bell className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/account')}
                title={t('header.account')}
                className="text-muted-foreground hover:text-foreground h-9 w-9 rounded-xl"
              >
                <User className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSignOut}
                title={t('header.signOut')}
                className="text-muted-foreground hover:text-foreground h-9 w-9 rounded-xl"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
