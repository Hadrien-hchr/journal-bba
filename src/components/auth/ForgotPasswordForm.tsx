import { useState } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2, Mail, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';

interface ForgotPasswordFormProps {
  onBack: () => void;
}

export function ForgotPasswordForm({ onBack }: ForgotPasswordFormProps) {
  const { t } = useTranslation('auth');
  const emailSchema = z.string().email(t('validation.invalidEmail'));
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

    const redirectTo = 'https://journal-bba.com/auth';

    try {
      const { data, error } = await supabase.functions.invoke('send-auth-email', {
        body: { email: normalizedEmail, redirectTo },
      });

      if (error) {
        const message = error.message || t('errors.genericError');
        setError(message);
        toast.error(message);
      } else if (data?.error) {
        setError(data.error);
        toast.error(data.error);
      } else {
        setIsSuccess(true);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : t('errors.genericError');
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
            <h3 className="text-xl font-display font-bold mb-2">{t('forgotPassword.successTitle')}</h3>
            <p className="text-muted-foreground text-sm mb-2">
              <Trans
                i18nKey="forgotPassword.successDescription"
                values={{ email: submittedEmail }}
                components={{ strong: <strong /> }}
              />
            </p>
            <p className="text-amber-600 text-sm font-medium mb-6">
              {t('forgotPassword.spamWarning')}
            </p>
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('forgotPassword.backToLogin')}
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
        <CardTitle className="text-2xl font-display">{t('forgotPassword.title')}</CardTitle>
        <CardDescription>
          {t('forgotPassword.description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reset-email">{t('forgotPassword.emailLabel')}</Label>
            <Input
              id="reset-email"
              type="email"
              placeholder={t('forgotPassword.emailPlaceholder')}
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
            {t('forgotPassword.sendLink')}
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={onBack}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('forgotPassword.back')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
