import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Loader2, MailCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EmailVerificationPendingProps {
  email: string;
  onBack: () => void;
}

export function EmailVerificationPending({ email, onBack }: EmailVerificationPendingProps) {
  const [isResending, setIsResending] = useState(false);

  const handleResend = async () => {
    setIsResending(true);
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: `${window.location.origin}/` },
    });
    if (error) {
      toast.error("Impossible de renvoyer l'email pour le moment");
    } else {
      toast.success('Email de confirmation renvoyé !');
    }
    setIsResending(false);
  };

  return (
    <Card className="shadow-elevated border-0 glass animate-scale-in">
      <CardContent className="pt-6">
        <div className="flex flex-col items-center text-center py-6">
          <div className="w-16 h-16 rounded-2xl gradient-red flex items-center justify-center mb-5 shadow-red">
            <MailCheck className="h-8 w-8 text-primary-foreground" />
          </div>
          <h3 className="text-2xl font-display font-bold mb-3">Vérifiez votre email</h3>
          <p className="text-muted-foreground text-sm mb-2">
            Un email de confirmation a été envoyé à votre adresse em-lyon :
          </p>
          <p className="font-semibold text-sm mb-4 break-all">{email}</p>
          <p className="text-muted-foreground text-sm mb-6">
            Veuillez cliquer sur le lien pour activer votre compte. Tant que votre adresse
            n'est pas confirmée, l'accès à l'application reste bloqué.
          </p>

          <div className="w-full space-y-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleResend}
              disabled={isResending}
            >
              {isResending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Renvoyer l'email
            </Button>
            <Button variant="ghost" className="w-full" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à la connexion
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
