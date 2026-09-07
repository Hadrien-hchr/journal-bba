import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Shield, User, Eye, EyeOff, Loader2, ArrowRight, Lock, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';
import { EmailVerificationPending } from '@/components/auth/EmailVerificationPending';

import { motion, AnimatePresence } from 'framer-motion';
import logoJ from '@/assets/logo-j.jpeg';
import { supabase } from '@/integrations/supabase/client';

export default function Auth() {
  const navigate = useNavigate();
  const { t } = useTranslation('auth');
  const { user, signIn, signUp, signInAsAdmin, loading } = useAuth();
  const emailSchema = z.string().email(t('validation.invalidEmail'));
  const passwordSchema = z.string().min(6, t('validation.passwordMinLength'));

  const [authMode, setAuthMode] = useState<'user' | 'admin'>('user');
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [recoveryStep, setRecoveryStep] = useState<'idle' | 'verifying' | 'form' | 'invalid'>('idle');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const verifyingRef = useRef(false);
  const passwordRecoveryReceived = useRef(false);

  useEffect(() => {
    const isRecoveryUrl = window.location.search.includes('type=recovery') ||
      window.location.hash.includes('type=recovery') ||
      window.location.search.includes('view=reset-password');
    if (user && !loading && !isRecoveryMode && !isRecoveryUrl) {
      navigate('/');
    }
  }, [user, loading, isRecoveryMode, navigate]);

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const queryParams = new URLSearchParams(window.location.search);
    const tokenHash = queryParams.get('token_hash') || hashParams.get('token_hash') || null;
    const type = queryParams.get('type') || hashParams.get('type') || null;
    const isRecoveryHash = hashParams.get('type') === 'recovery';
    const isRecoveryQuery = queryParams.get('type') === 'recovery';
    const isResetView = queryParams.get('view') === 'reset-password';

    if (isRecoveryHash || isRecoveryQuery || isResetView) {
      setIsRecoveryMode(true);
    }

    if (tokenHash && type === 'recovery') {
      setRecoveryStep('verifying');

      const verify = async () => {
        if (verifyingRef.current) return;
        verifyingRef.current = true;

        try {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: 'recovery',
          });

          if (error) {
            console.error('verifyOtp error:', error);
            const { data: { session } } = await supabase.auth.getSession();
            if (session || passwordRecoveryReceived.current) {
              setRecoveryStep('form');
            } else {
              setRecoveryStep('invalid');
            }
          } else {
            setRecoveryStep('form');
          }
        } catch (err) {
          console.error('verifyOtp exception:', err);
          const { data: { session } } = await supabase.auth.getSession();
          setRecoveryStep(session || passwordRecoveryReceived.current ? 'form' : 'invalid');
        }
      };

      verify();
    } else if (isResetView) {
      setRecoveryStep('form');
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        passwordRecoveryReceived.current = true;
        setIsRecoveryMode(true);
        setRecoveryStep('form');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleUserAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
        setIsSubmitting(false);
        return;
      }
    }

    if (isSignUp) {
      if (!firstName.trim() || !lastName.trim()) {
        toast.error(t('validation.fillAllFields'));
        setIsSubmitting(false);
        return;
      }

      if (!email.endsWith('@edu.em-lyon.com')) {
        toast.error(t('validation.emlyonOnly'));
        setIsSubmitting(false);
        return;
      }

      const fullName = `${firstName.trim()} ${lastName.trim()}`;
      const { error } = await signUp(email, password, fullName);
      if (error) {
        if (error.message.includes('already registered') || error.message.includes('already been registered')) {
          toast.error(t('errors.emailAlreadyUsed'));
        } else {
          toast.error(error.message);
        }
      } else {
        setPendingEmail(email);
        setPassword('');
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) {
        if (error.message.toLowerCase().includes('email not confirmed')) {
          toast.error(t('errors.verifyEmailBeforeLogin'));
          setPendingEmail(email);
        } else if (error.message.includes('Invalid login')) {
          toast.error(t('errors.invalidCredentials'));
        } else {
          toast.error(error.message);
        }
      } else {
        toast.success(t('success.loginSuccess'));
        navigate('/');
      }
    }

    setIsSubmitting(false);
  };

  const handleAdminAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
        setIsSubmitting(false);
        return;
      }
    }

    const { error } = await signInAsAdmin(email, password);
    if (error) {
      if (error.message.toLowerCase().includes('email not confirmed')) {
        toast.error(t('errors.verifyEmailBeforeLogin'));
        setPendingEmail(email);
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success(t('success.adminLoginSuccess'));
      navigate('/');
    }

    setIsSubmitting(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsResetting(true);

    try {
      passwordSchema.parse(newPassword);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
        setIsResetting(false);
        return;
      }
    }

    if (newPassword !== confirmNewPassword) {
      toast.error(t('validation.passwordsMismatch'));
      setIsResetting(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) {
        toast.error(error.message || t('errors.updatePasswordFailed'));
      } else {
        toast.success(t('success.passwordChanged'));
        setResetSuccess(true);
        setTimeout(() => navigate('/'), 1500);
      }
    } catch (error) {
      toast.error(t('errors.updatePasswordError'));
    } finally {
      setIsResetting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (recoveryStep === 'verifying') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (recoveryStep === 'invalid') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md shadow-medium border-0">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center py-6">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                <Lock className="h-8 w-8 text-destructive" />
              </div>
              <h3 className="text-xl font-display font-bold mb-2">{t('invalidLink.title')}</h3>
              <p className="text-muted-foreground text-sm mb-4">
                {t('invalidLink.description')}
              </p>
              <Button onClick={() => navigate('/auth')}>
                {t('invalidLink.backToLogin')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (recoveryStep === 'form' || resetSuccess) {
    if (resetSuccess) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
          <Card className="w-full max-w-md shadow-medium border-0 animate-scale-in">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center py-6">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-display font-bold mb-2">{t('resetSuccess.title')}</h3>
                <p className="text-muted-foreground text-sm mb-6">
                  {t('resetSuccess.description')}
                </p>
                <Button className="gradient-red shadow-red" onClick={() => navigate('/')}>
                  {t('resetSuccess.continue')}
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
            {t('page.appName')}
          </h1>
        </div>

        <Card className="w-full max-w-md shadow-medium border-0 animate-slide-up">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full gradient-red flex items-center justify-center mb-4">
              <Lock className="h-6 w-6 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl font-display">{t('resetForm.title')}</CardTitle>
            <CardDescription>
              {t('resetForm.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">{t('resetForm.newPasswordLabel')}</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-new-password">{t('resetForm.confirmPasswordLabel')}</Label>
                <Input
                  id="confirm-new-password"
                  type="password"
                  placeholder="••••••••"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full gradient-red shadow-red"
                disabled={isResetting}
              >
                {isResetting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {t('resetForm.submit')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (pendingEmail) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 relative overflow-hidden">
        <div className="absolute inset-0 dot-pattern opacity-50" />
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-primary/5 blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10 mb-8 text-center">
          <h1 className="text-4xl font-display font-bold text-gradient mb-2">{t('page.appName')}</h1>
          <p className="text-muted-foreground">{t('page.schoolName')}</p>
        </div>
        <div className="w-full max-w-md relative z-10">
          <EmailVerificationPending
            email={pendingEmail}
            onBack={() => {
              setPendingEmail(null);
              setIsSignUp(false);
            }}
          />
        </div>
      </div>
    );
  }

  if (showForgotPassword) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 relative overflow-hidden">
        <div className="absolute inset-0 dot-pattern opacity-50" />
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-primary/5 blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10 mb-8 text-center">
          <h1 className="text-4xl font-display font-bold text-gradient mb-2">
            {t('page.appName')}
          </h1>
          <p className="text-muted-foreground">{t('page.infoSourceTagline')}</p>
        </div>
        <div className="w-full max-w-md relative z-10">
          <ForgotPasswordForm onBack={() => setShowForgotPassword(false)} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 dot-pattern opacity-40" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-primary/3 blur-3xl translate-y-1/2 -translate-x-1/3" />

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="mb-10 text-center relative z-10"
      >
        <img src={logoJ} alt={t('page.appName')} className="w-20 h-20 rounded-2xl object-cover shadow-red mx-auto mb-4" />
        <h1 className="text-5xl font-display font-bold text-gradient mb-1">
          {t('page.appName')}
        </h1>
        <p className="text-muted-foreground text-sm tracking-wide uppercase">
          {t('page.schoolName')}
        </p>
      </motion.div>

      {/* Auth card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md relative z-10"
      >
        <Tabs
          value={authMode}
          onValueChange={(v) => setAuthMode(v as 'user' | 'admin')}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 mb-4 h-12 bg-secondary/80 p-1">
            <TabsTrigger value="user" className="flex items-center gap-2 h-full rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-soft font-medium">
              <User className="h-4 w-4" />
              {t('page.userTab')}
            </TabsTrigger>
            <TabsTrigger value="admin" className="flex items-center gap-2 h-full rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-soft font-medium">
              <Shield className="h-4 w-4" />
              {t('page.adminTab')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="user">
            <Card className="shadow-elevated border-0 glass overflow-hidden">
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-2xl font-display">
                  {isSignUp ? t('page.signUpTitle') : t('page.signInTitle')}
                </CardTitle>
                <CardDescription className="text-sm">
                  {isSignUp
                    ? t('page.signUpDescription')
                    : t('page.signInDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUserAuth} className="space-y-4">
                  <AnimatePresence mode="wait">
                    {isSignUp && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="grid grid-cols-2 gap-3 overflow-hidden"
                      >
                        <div className="space-y-1.5">
                          <Label htmlFor="firstName" className="text-xs font-medium">{t('page.firstNameLabel')}</Label>
                          <Input
                            id="firstName"
                            placeholder={t('page.firstNamePlaceholder')}
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            required={isSignUp}
                            className="h-11"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="lastName" className="text-xs font-medium">{t('page.lastNameLabel')}</Label>
                          <Input
                            id="lastName"
                            placeholder={t('page.lastNamePlaceholder')}
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            required={isSignUp}
                            className="h-11"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs font-medium">{t('page.emailLabel')}</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder={t('page.emailPlaceholder')}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-xs font-medium">{t('page.passwordLabel')}</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="h-11 pr-10"
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

                  {!isSignUp && (
                    <div className="text-right">
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(true)}
                        className="text-xs text-primary hover:underline font-medium"
                      >
                        {t('page.forgotPasswordLink')}
                      </button>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-12 gradient-red shadow-red text-base font-semibold group"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        {isSignUp ? t('page.signUpSubmit') : t('page.signInSubmit')}
                        <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </Button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => setIsSignUp(!isSignUp)}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {isSignUp
                        ? t('page.hasAccount')
                        : t('page.noAccount')}
                      <span className="text-primary font-semibold">{isSignUp ? t('page.signInAction') : t('page.signUpAction')}</span>
                    </button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="admin">
            <Card className="shadow-elevated border-0 glass overflow-hidden">
              <CardHeader className="text-center pb-2">
                <div className="mx-auto w-14 h-14 rounded-2xl gradient-red flex items-center justify-center mb-3 shadow-red">
                  <Shield className="h-7 w-7 text-primary-foreground" />
                </div>
                <CardTitle className="text-2xl font-display">{t('page.adminTitle')}</CardTitle>
                <CardDescription className="text-sm">
                  {t('page.adminDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAdminAuth} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="adminEmail" className="text-xs font-medium">{t('page.emailLabel')}</Label>
                    <Input
                      id="adminEmail"
                      type="email"
                      placeholder={t('page.adminEmailPlaceholder')}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="adminPassword" className="text-xs font-medium">{t('page.passwordLabel')}</Label>
                    <div className="relative">
                      <Input
                        id="adminPassword"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="h-11 pr-10"
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

                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-xs text-primary hover:underline font-medium"
                    >
                      {t('page.forgotPasswordLink')}
                    </button>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 gradient-red shadow-red text-base font-semibold group"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        {t('page.signInSubmit')}
                        <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Footer */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 text-xs text-muted-foreground relative z-10"
      >
        {t('page.footer')}
      </motion.p>
    </div>
  );
}
