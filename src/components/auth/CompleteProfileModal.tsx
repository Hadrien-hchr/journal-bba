import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile, useUpdateProfile } from '@/hooks/useFriends';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Loader2, User } from 'lucide-react';
import { toast } from 'sonner';

export function CompleteProfileModal() {
  const navigate = useNavigate();
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  
  const [isOpen, setIsOpen] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  useEffect(() => {
    // Check if profile needs completion
    if (!isLoading && profile && !profile.profile_completed) {
      // Pre-fill from full_name if available
      if (profile.full_name) {
        const parts = profile.full_name.split(' ');
        if (parts.length >= 2) {
          setFirstName(parts[0]);
          setLastName(parts.slice(1).join(' '));
        } else {
          setFirstName(profile.full_name);
        }
      }
      setIsOpen(true);
    }
  }, [profile, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!firstName.trim() || !lastName.trim()) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    try {
      await updateProfile.mutateAsync({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        full_name: `${firstName.trim()} ${lastName.trim()}`,
        profile_completed: true,
      });
      
      toast.success('Profil complété !');
      setIsOpen(false);
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du profil');
    }
  };

  if (isLoading) return null;

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="mx-auto w-12 h-12 rounded-full gradient-red flex items-center justify-center mb-2">
            <User className="h-6 w-6 text-primary-foreground" />
          </div>
          <DialogTitle className="text-center text-xl font-display">
            Bienvenue sur Journal BBA !
          </DialogTitle>
          <DialogDescription className="text-center">
            Pour commencer, complétez votre profil
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">Prénom</Label>
            <Input
              id="firstName"
              placeholder="Jean"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="lastName">Nom</Label>
            <Input
              id="lastName"
              placeholder="Dupont"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>

          <Button 
            type="submit" 
            className="w-full gradient-red shadow-red"
            disabled={updateProfile.isPending}
          >
            {updateProfile.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Continuer
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
