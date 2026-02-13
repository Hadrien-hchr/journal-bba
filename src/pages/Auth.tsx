import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Shield, User, Eye, EyeOff, Loader2 } from 'lucide-react';
import { z } from 'zod';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';

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

  // Form fields
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

    // Admin authentication - role is validated server-side via database
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

  // Show forgot password form
  if (showForgotPassword) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="mb-8 text-center animate-fade-in">
          <h1 className="text-4xl font-display font-bold text-gradient mb-2">
            Journal BBA
          </h1>
          <p className="text-muted-foreground">
            Votre source d'informations
          </p>
        </div>
        <div className="w-full max-w-md">
          <ForgotPasswordForm onBack={() => setShowForgotPassword(false)} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      {/* Logo / Header */}
      <div className="mb-8 text-center animate-fade-in">
        <h1 className="text-4xl font-display font-bold text-gradient mb-2">
          Journal BBA
        </h1>
        <p className="text-muted-foreground">
          Votre source d'informations
        </p>
      </div>

      {/* Auth Type Selection */}
      <Tabs
        value={authMode}
        onValueChange={(v) => setAuthMode(v as 'user' | 'admin')}
        className="w-full max-w-md animate-slide-up"
      >
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="user" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Utilisateur
          </TabsTrigger>
          <TabsTrigger value="admin" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Administrateur
          </TabsTrigger>
        </TabsList>

        {/* User Auth */}
        <TabsContent value="user">
          <Card className="shadow-medium border-0">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-display">
                {isSignUp ? 'Créer un compte' : 'Se connecter'}
              </CardTitle>
              <CardDescription>
                {isSignUp 
                  ? 'Remplissez les informations pour créer votre compte' 
                  : 'Connectez-vous avec vos identifiants'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUserAuth} className="space-y-4">
                {isSignUp && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Prénom</Label>
                      <Input
                        id="firstName"
                        placeholder="Jean"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required={isSignUp}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Nom</Label>
                      <Input
                        id="lastName"
                        placeholder="Dupont"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required={isSignUp}
                      />
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="vous@exemple.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Mot de passe</Label>
                  <div className="relative">
                    <Input
                      id="password"
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

                {!isSignUp && (
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-sm text-primary hover:underline"
                    >
                      Mot de passe oublié ?
                    </button>
                  </div>
                )}

                <Button type="submit" className="w-full gradient-red shadow-red" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  {isSignUp ? 'Créer mon compte' : 'Se connecter'}
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="text-sm text-primary hover:underline"
                  >
                    {isSignUp 
                      ? 'Déjà un compte ? Se connecter' 
                      : 'Pas de compte ? S\'inscrire'}
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Admin Auth */}
        <TabsContent value="admin">
          <Card className="shadow-medium border-0">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full gradient-red flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-primary-foreground" />
              </div>
              <CardTitle className="text-2xl font-display">
                Accès Administrateur
              </CardTitle>
              <CardDescription>
                Connectez-vous avec vos identifiants administrateur
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAdminAuth} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="adminEmail">Email</Label>
                  <Input
                    id="adminEmail"
                    type="email"
                    placeholder="admin@bba.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adminPassword">Mot de passe</Label>
                  <div className="relative">
                    <Input
                      id="adminPassword"
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

                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm text-primary hover:underline"
                  >
                    Mot de passe oublié ?
                  </button>
                </div>

                <Button type="submit" className="w-full gradient-red shadow-red" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Se connecter
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
