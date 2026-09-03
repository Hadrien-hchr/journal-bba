import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2, Mail, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';

const emailSchema = z.string().email('Email invalide');
const RATE_LIMIT_SECONDS = 60;

interface ForgotPasswordFormProps {
  onBack: () => void;
}

function isRateLimitError(message: string): boolean {
  const lower = message.toLowerCase();
  return lower.includes('for security purposes') || lower.includes('60 seconds');
}

export function ForgotPasswordForm({ onBack }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState('');
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (countdown === null || countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Reset error state completely on each attempt
    setError(null);
    setCountdown(null);
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

    const redirectTo = `${window.location.origin}/auth?type=recovery`;

    try {
      const { error } = await supabase.functions.invoke('send-auth-email', {
        body: { email: normalizedEmail, redirectTo },
      });

      if (error) {
        // Fallback: built-in password recovery email
        const { error: fallbackError } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
          redirectTo,
        });
        if (fallbackError) {
          if (isRateLimitError(fallbackError.message)) {
            setCountdown(RATE_LIMIT_SECONDS);
          } else {
            setError(fallbackError.message);
            toast.error(fallbackError.message);
          }
        } else {
          setIsSuccess(true);
        }
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
                if (error && !isRateLimitError(error)) setError(null);
              }}
              required
              aria-invalid={!!error}
              aria-describedby={error ? 'reset-email-error' : undefined}
            />
            {error && !isRateLimitError(error) && (
              <p id="reset-email-error" className="text-sm text-destructive">
                {error}
              </p>
            )}
          </div>

          <Button 
            type="submit" 
            className="w-full gradient-red shadow-red" 
            disabled={isSubmitting || countdown !== null}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            {countdown !== null ? `Réessayer dans ${countdown}s` : 'Envoyer le lien'}
          </Button>

          {countdown !== null && (
            <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-700 flex items-start gap-3">
              <Clock className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Sécurité : merci de patienter</p>
                <p className="text-amber-700/80">
                  Pour éviter les abus, vous devez attendre {countdown}s avant de pouvoir renvoyer un email.
                </p>
              </div>
            </div>
          )}

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
