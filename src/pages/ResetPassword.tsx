import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Loader2, Lock, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

const passwordSchema = z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères');

function getRecoveryParams() {
  const hashParams = new URLSearchParams(window.location.hash.substring(1));
  const queryParams = new URLSearchParams(window.location.search);
  return {
    tokenHash: queryParams.get('token_hash') || hashParams.get('token_hash') || null,
    type: queryParams.get('type') || hashParams.get('type') || null,
  };
}

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);

  useEffect(() => {
    const verifyRecoverySession = async () => {
      const { tokenHash, type } = getRecoveryParams();

      // Explicit OTP verification when the recovery link carries a token_hash
      if (tokenHash && type === 'recovery') {
        try {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: 'recovery',
          });

          if (error) {
            console.error('verifyOtp error:', error);
            setSessionError(error.message || 'Le lien de réinitialisation est invalide ou a expiré.');
            setIsValidSession(false);
          } else {
            setIsValidSession(true);
          }
          setIsLoading(false);
          return;
        } catch (err) {
          console.error('verifyOtp exception:', err);
          setSessionError('Une erreur est survenue lors de la vérification du lien.');
          setIsValidSession(false);
          setIsLoading(false);
          return;
        }
      }

      // Fallback: rely on an existing recovery session
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsValidSession(true);
      }
      setIsLoading(false);
    };

    verifyRecoverySession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsValidSession(true);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      passwordSchema.parse(password);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
        setIsSubmitting(false);
        return;
      }
    }

    if (password !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      setIsSubmitting(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        toast.error(error.message || 'Impossible de mettre à jour le mot de passe.');
      } else {
        toast.success('Mot de passe modifié avec succès !');
        setIsSuccess(true);
        setTimeout(() => navigate('/'), 1500);
      }
    } catch (error) {
      toast.error('Une erreur est survenue lors de la mise à jour du mot de passe.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isValidSession) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md shadow-medium border-0">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center py-6">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                <Lock className="h-8 w-8 text-destructive" />
              </div>
              <h3 className="text-xl font-display font-bold mb-2">Lien invalide</h3>
              <p className="text-muted-foreground text-sm mb-4">
                {sessionError || "Ce lien de réinitialisation est invalide ou a expiré. Veuillez demander un nouveau lien."}
              </p>
              <Button onClick={() => navigate('/auth')}>
                Retour à la connexion
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md shadow-medium border-0 animate-scale-in">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center py-6">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-display font-bold mb-2">Mot de passe modifié !</h3>
              <p className="text-muted-foreground text-sm mb-6">
                Votre mot de passe a été mis à jour avec succès.
              </p>
              <Button className="gradient-red shadow-red" onClick={() => navigate('/')}>
                Continuer vers l'application
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="mb-8 text-center animate-fade-in">
        <h1 className="text-4xl font-display font-bold text-gradient mb-2">
          Journal BBA
        </h1>
      </div>

      <Card className="w-full max-w-md shadow-medium border-0 animate-slide-up">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full gradient-red flex items-center justify-center mb-4">
            <Lock className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-display">Nouveau mot de passe</CardTitle>
          <CardDescription>
            Choisissez un nouveau mot de passe sécurisé
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Nouveau mot de passe</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full gradient-red shadow-red" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Mettre à jour le mot de passe
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
