import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2, Mail, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';

const emailSchema = z.string().email('Email invalide');

interface ForgotPasswordFormProps {
  onBack: () => void;
}

export function ForgotPasswordForm({ onBack }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState('');
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Reset error state completely on each attempt
    setError(null);
    setIsSubmitting(true);

    const normalizedEmail = email.trim().toLowerCase();
    setSubmittedEmail(normalizedEmail);

    try {
      emailSchema.parse(normalizedEmail);
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
        setIsSubmitting(false);
        return;
      }
    }

    const redirectTo = 'https://journal-bba.com/auth?view=reset-password';

    try {
      const { data, error } = await supabase.functions.invoke('send-auth-email', {
        body: { email: normalizedEmail, redirectTo },
      });

      if (error) {
        const message = error.message || 'Une erreur est survenue';
        setError(message);
        toast.error(message);
      } else if (data?.error) {
        setError(data.error);
        toast.error(data.error);
      } else {
        setIsSuccess(true);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Une erreur est survenue';
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <Card className="shadow-medium border-0 animate-scale-in">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center py-6">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-display font-bold mb-2">Email envoyé !</h3>
            <p className="text-muted-foreground text-sm mb-2">
              Si un compte existe avec l'adresse <strong>{submittedEmail}</strong>, 
              vous recevrez un email avec les instructions pour réinitialiser votre mot de passe.
            </p>
            <p className="text-amber-600 text-sm font-medium mb-6">
              Pensez à vérifier votre dossier Courrier indésirable / Spams (notamment sur les adresses @edu.em-lyon.com).
            </p>
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à la connexion
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-medium border-0 animate-slide-up">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-4">
          <Mail className="h-6 w-6 text-foreground" />
        </div>
        <CardTitle className="text-2xl font-display">Mot de passe oublié</CardTitle>
        <CardDescription>
          Entrez votre email pour recevoir un lien de réinitialisation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reset-email">Email</Label>
            <Input
              id="reset-email"
              type="email"
              placeholder="vous@exemple.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
              }}
              required
              aria-invalid={!!error}
              aria-describedby={error ? 'reset-email-error' : undefined}
            />
            {error && (
              <p id="reset-email-error" className="text-sm text-destructive">
                {error}
              </p>
            )}
          </div>

          <Button 
            type="submit" 
            className="w-full gradient-red shadow-red" 
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            {'Envoyer le lien'}
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={onBack}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
