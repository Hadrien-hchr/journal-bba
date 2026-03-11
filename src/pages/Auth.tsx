import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Shield, User, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';
import { z } from 'zod';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';
import { motion, AnimatePresence } from 'framer-motion';

const emailSchema = z.string().email('Email invalide');
const passwordSchema = z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères');

export default function Auth() {
  const navigate = useNavigate();
  const { user, signIn, signUp, signInAsAdmin, loading } = useAuth();

  const [authMode, setAuthMode] = useState<'user' | 'admin'>('user');
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  useEffect(() => {
    if (user && !loading) {
      navigate('/');
    }
  }, [user, loading, navigate]);

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
        toast.error('Veuillez remplir tous les champs');
        setIsSubmitting(false);
        return;
      }

      if (!email.endsWith('@edu.em-lyon.com')) {
        toast.error('Seules les adresses email @edu.em-lyon.com sont autorisées');
        setIsSubmitting(false);
        return;
      }

      const fullName = `${firstName.trim()} ${lastName.trim()}`;
      const { error } = await signUp(email, password, fullName);
      if (error) {
        if (error.message.includes('already registered')) {
          toast.error('Cet email est déjà utilisé');
        } else {
          toast.error(error.message);
        }
      } else {
        toast.success('Compte créé avec succès ! Vérifiez votre email pour confirmer votre inscription.');
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) {
        if (error.message.includes('Invalid login')) {
          toast.error('Email ou mot de passe incorrect');
        } else {
          toast.error(error.message);
        }
      } else {
        toast.success('Connexion réussie !');
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
      toast.error(error.message);
    } else {
      toast.success('Connexion administrateur réussie !');
      navigate('/');
    }

    setIsSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
            Journal BBA
          </h1>
          <p className="text-muted-foreground">Votre source d'informations</p>
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
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-red shadow-red mb-4">
          <span className="text-2xl font-display font-black text-primary-foreground">B</span>
        </div>
        <h1 className="text-5xl font-display font-black text-gradient mb-1 tracking-tighter">
          Journal BBA
        </h1>
        <p className="text-muted-foreground text-sm tracking-wide uppercase">
          EM Lyon Business School
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
              Utilisateur
            </TabsTrigger>
            <TabsTrigger value="admin" className="flex items-center gap-2 h-full rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-soft font-medium">
              <Shield className="h-4 w-4" />
              Admin
            </TabsTrigger>
          </TabsList>

          <TabsContent value="user">
            <Card className="shadow-elevated border-0 glass overflow-hidden">
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-2xl font-display">
                  {isSignUp ? 'Créer un compte' : 'Bon retour !'}
                </CardTitle>
                <CardDescription className="text-sm">
                  {isSignUp
                    ? 'Rejoignez la communauté BBA'
                    : 'Connectez-vous pour continuer'}
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
                          <Label htmlFor="firstName" className="text-xs font-medium">Prénom</Label>
                          <Input
                            id="firstName"
                            placeholder="Jean"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            required={isSignUp}
                            className="h-11"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="lastName" className="text-xs font-medium">Nom</Label>
                          <Input
                            id="lastName"
                            placeholder="Dupont"
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
                    <Label htmlFor="email" className="text-xs font-medium">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="vous@edu.em-lyon.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-xs font-medium">Mot de passe</Label>
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
                        Mot de passe oublié ?
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
                        {isSignUp ? 'Créer mon compte' : 'Se connecter'}
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
                        ? 'Déjà un compte ? '
                        : 'Pas de compte ? '}
                      <span className="text-primary font-semibold">{isSignUp ? 'Se connecter' : "S'inscrire"}</span>
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
                <CardTitle className="text-2xl font-display">Espace Admin</CardTitle>
                <CardDescription className="text-sm">
                  Accès réservé aux administrateurs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAdminAuth} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="adminEmail" className="text-xs font-medium">Email</Label>
                    <Input
                      id="adminEmail"
                      type="email"
                      placeholder="admin@bba.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="adminPassword" className="text-xs font-medium">Mot de passe</Label>
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
                      Mot de passe oublié ?
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
                        Se connecter
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
        © 2026 Journal BBA — EM Lyon
      </motion.p>
    </div>
  );
}
