import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, Shield, User } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import logoJ from '@/assets/logo-j.jpeg';

export default function Header() {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    toast.success('Déconnexion réussie');
    navigate('/auth');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-strong border-b border-border/50">
      <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg gradient-red flex items-center justify-center shadow-sm">
            <span className="text-sm font-display font-black text-primary-foreground">B</span>
          </div>
          <h1 className="text-lg font-display font-bold tracking-tight text-foreground">
            Journal <span className="text-gradient">BBA</span>
          </h1>
          {isAdmin && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
              <Shield className="h-2.5 w-2.5" />
              Admin
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-0.5">
          {user && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/account')}
                className="text-muted-foreground hover:text-foreground h-9 w-9 rounded-xl"
              >
                <User className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSignOut}
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
