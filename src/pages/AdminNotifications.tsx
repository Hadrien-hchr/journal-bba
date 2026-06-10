import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useNotificationTemplates, useUpdateNotificationTemplate, triggerPush, type NotificationTemplate } from '@/hooks/useNotificationTemplates';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Bell, Save, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const LABELS: Record<string, { label: string; hint: string }> = {
  event: { label: 'Événements', hint: 'Envoyée à la création d\'un événement.' },
  interview: { label: 'Interviews', hint: 'Envoyée à la publication d\'une interview.' },
  information: { label: 'EM\'Book / Articles', hint: 'Envoyée à la publication d\'un article.' },
  home: { label: 'Accueil', hint: 'Envoyée pour les publications du flux d\'accueil.' },
};

function TemplateCard({ tpl }: { tpl: NotificationTemplate }) {
  const [title, setTitle] = useState(tpl.title);
  const [message, setMessage] = useState(tpl.message);
  const [enabled, setEnabled] = useState(tpl.enabled);
  const [testing, setTesting] = useState(false);
  const update = useUpdateNotificationTemplate();
  const meta = LABELS[tpl.category] ?? { label: tpl.category, hint: '' };

  useEffect(() => {
    setTitle(tpl.title); setMessage(tpl.message); setEnabled(tpl.enabled);
  }, [tpl.id]);

  const save = async () => {
    try {
      await update.mutateAsync({ id: tpl.id, title, message, enabled });
      toast.success('Modèle enregistré');
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const test = async () => {
    setTesting(true);
    try {
      const { data, error } = await triggerPush(tpl.category, 'Test notification');
      if (error) throw error;
      if ((data as any)?.ok) toast.success('Notification test envoyée 📲');
      else toast.error('Erreur OneSignal : ' + JSON.stringify((data as any)?.body));
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setTesting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-0 shadow-elevated glass">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-display flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" />
                {meta.label}
              </CardTitle>
              <CardDescription className="text-xs">{meta.hint}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs">Actif</Label>
              <Switch checked={enabled} onCheckedChange={setEnabled} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Titre de la notif</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Message ({'{title}'} = titre du contenu)</Label>
            <Textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} />
          </div>
          <div className="flex gap-2 pt-1">
            <Button onClick={save} disabled={update.isPending} className="gradient-red shadow-red">
              {update.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
              Enregistrer
            </Button>
            <Button variant="outline" onClick={test} disabled={testing}>
              {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
              Tester
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function AdminNotifications() {
  const { isAdmin, loading } = useAuth();
  const { data, isLoading } = useNotificationTemplates();

  if (loading || isLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }
  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="container max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-gradient">Gestion des notifications</h1>
        <p className="text-muted-foreground text-sm mt-1">Personnalise les messages push envoyés via OneSignal.</p>
      </div>
      <div className="space-y-4">
        {(data ?? []).map((t) => <TemplateCard key={t.id} tpl={t} />)}
      </div>
    </div>
  );
}
