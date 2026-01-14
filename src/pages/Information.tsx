import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useInformation, useCreateInformation, useDeleteInformation } from '@/hooks/useContent';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, Loader2, Info, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function Information() {
  const { isAdmin } = useAuth();
  const { information, isLoading } = useInformation();
  const createInfo = useCreateInformation();
  const deleteInfo = useDeleteInformation();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      toast.error('Le contenu est requis');
      return;
    }

    try {
      await createInfo.mutateAsync({
        title: title.trim() || undefined,
        content: content.trim(),
      });
      
      toast.success('Information ajoutée !');
      setIsDialogOpen(false);
      setTitle('');
      setContent('');
    } catch (error) {
      toast.error('Erreur lors de l\'ajout');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteInfo.mutateAsync(id);
      toast.success('Information supprimée');
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold">Informations</h2>
          <p className="text-muted-foreground text-sm">Actualités et annonces</p>
        </div>
        
        {isAdmin && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-red shadow-red">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-display">Nouvelle information</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="infoTitle">Titre (optionnel)</Label>
                  <Input
                    id="infoTitle"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Titre de l'annonce..."
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="infoContent">Contenu *</Label>
                  <Textarea
                    id="infoContent"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Rédigez votre information..."
                    rows={5}
                    required
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full gradient-red shadow-red"
                  disabled={createInfo.isPending}
                >
                  {createInfo.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Publier
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {information.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Info className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Aucune information pour le moment</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {information.map((info) => (
            <Card key={info.id} className="animate-scale-in shadow-soft">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    {info.title && (
                      <CardTitle className="text-lg font-display line-clamp-2">
                        {info.title}
                      </CardTitle>
                    )}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(info.created_at), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
                    </div>
                  </div>
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="flex-shrink-0 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(info.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                  {info.content}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
