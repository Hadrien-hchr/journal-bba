import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { NotificationToggle } from '@/components/NotificationToggle';

export default function Header() {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    toast.success('Déconnexion réussie');
    navigate('/auth');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="flex items-center justify-between h-16 px-4 max-w-lg mx-auto">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-display font-bold text-gradient">
            Journal BBA
          </h1>
          {isAdmin && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent text-accent-foreground text-xs font-medium">
              <Shield className="h-3 w-3" />
              Admin
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          <NotificationToggle />
          {user && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
