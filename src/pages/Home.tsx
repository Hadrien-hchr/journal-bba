import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useHomeContent, useCreateHomeContent, useDeleteHomeContent } from '@/hooks/useContent';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Type, Image, Video, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export default function Home() {
  const { isAdmin } = useAuth();
  const { content, isLoading } = useHomeContent();
  const createContent = useCreateHomeContent();
  const deleteContent = useDeleteHomeContent();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [contentType, setContentType] = useState<'text' | 'image' | 'video'>('text');
  const [contentValue, setContentValue] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contentValue.trim()) {
      toast.error('Le contenu est requis');
      return;
    }

    try {
      await createContent.mutateAsync({
        content_type: contentType,
        content: contentValue,
        position_x: 0,
        position_y: 0,
        order_index: content.length,
      });
      
      toast.success('Contenu ajouté !');
      setIsDialogOpen(false);
      setContentValue('');
      setContentType('text');
    } catch (error) {
      toast.error('Erreur lors de l\'ajout du contenu');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteContent.mutateAsync(id);
      toast.success('Contenu supprimé');
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'text': return <Type className="h-4 w-4" />;
      case 'image': return <Image className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
      default: return null;
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
          <h2 className="text-2xl font-display font-bold">Accueil</h2>
          <p className="text-muted-foreground text-sm">Bienvenue sur Journal BBA</p>
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
                <DialogTitle className="font-display">Ajouter du contenu</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Type de contenu</Label>
                  <Select value={contentType} onValueChange={(v) => setContentType(v as typeof contentType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">
                        <div className="flex items-center gap-2">
                          <Type className="h-4 w-4" />
                          Texte
                        </div>
                      </SelectItem>
                      <SelectItem value="image">
                        <div className="flex items-center gap-2">
                          <Image className="h-4 w-4" />
                          Image
                        </div>
                      </SelectItem>
                      <SelectItem value="video">
                        <div className="flex items-center gap-2">
                          <Video className="h-4 w-4" />
                          Vidéo
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>
                    {contentType === 'text' ? 'Texte' : 'URL'}
                  </Label>
                  {contentType === 'text' ? (
                    <Textarea
                      value={contentValue}
                      onChange={(e) => setContentValue(e.target.value)}
                      placeholder="Entrez votre texte..."
                      rows={4}
                    />
                  ) : (
                    <Input
                      type="url"
                      value={contentValue}
                      onChange={(e) => setContentValue(e.target.value)}
                      placeholder="https://..."
                    />
                  )}
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full gradient-red shadow-red"
                  disabled={createContent.isPending}
                >
                  {createContent.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Ajouter
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {content.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {isAdmin 
                ? 'Ajoutez du contenu pour enrichir la page d\'accueil'
                : 'Aucun contenu pour le moment'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {content.map((item) => (
            <Card key={item.id} className="overflow-hidden animate-scale-in shadow-soft">
              <CardContent className="p-0">
                {item.content_type === 'text' ? (
                  <div className="p-4 relative">
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                    <p className="whitespace-pre-wrap pr-10">{item.content}</p>
                  </div>
                ) : item.content_type === 'image' ? (
                  <div className="relative">
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 z-10 bg-background/80 backdrop-blur-sm text-destructive hover:text-destructive"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                    <img
                      src={item.content}
                      alt="Content"
                      className="w-full h-auto"
                    />
                  </div>
                ) : (
                  <div className="relative aspect-video">
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 z-10 bg-background/80 backdrop-blur-sm text-destructive hover:text-destructive"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                    <iframe
                      src={item.content}
                      className="w-full h-full"
                      allowFullScreen
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
