import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useInterviews, useCreateInterview, useDeleteInterview } from '@/hooks/useContent';
import { useContentCategories } from '@/hooks/useContentCategories';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, Loader2, PlayCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { FileUploadInput } from '@/components/FileUploadInput';
import { CategoryManager } from '@/components/content/CategoryManager';

export default function Interviews() {
  const { isAdmin } = useAuth();
  const { interviews, isLoading } = useInterviews();
  const { data: categories } = useContentCategories('interviews');
  const createInterview = useCreateInterview();
  const deleteInterview = useDeleteInterview();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [formData, setFormData] = useState({
    title: '',
    video_url: '',
    thumbnail_url: '',
    description: '',
    category_id: '',
  });

  // Convert YouTube URL to embed URL with strict validation
  const getEmbedUrl = (url: string): string | null => {
    const youtubeMatch = url.match(/^(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:[?&].*)?$/);
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    }
    return null;
  };

  // Validate YouTube URL
  const isValidYoutubeUrl = (url: string): boolean => {
    return /^(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:[?&].*)?$/.test(url);
  };

  // Filter interviews by category
  const filteredInterviews = useMemo(() => {
    if (selectedCategory === 'all') return interviews;
    return interviews.filter(i => i.category_id === selectedCategory);
  }, [interviews, selectedCategory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.video_url.trim()) {
      toast.error('Le titre et l\'URL sont requis');
      return;
    }

    if (!isValidYoutubeUrl(formData.video_url.trim())) {
      toast.error('URL YouTube invalide. Formats acceptés: youtube.com/watch?v=..., youtu.be/..., youtube.com/embed/...');
      return;
    }

    try {
      await createInterview.mutateAsync({
        title: formData.title.trim(),
        video_url: formData.video_url.trim(),
        thumbnail_url: formData.thumbnail_url.trim() || undefined,
        description: formData.description.trim() || undefined,
        category_id: formData.category_id || undefined,
      });
      
      toast.success('Interview ajoutée !');
      setIsDialogOpen(false);
      setFormData({ title: '', video_url: '', thumbnail_url: '', description: '', category_id: '' });
    } catch (error) {
      toast.error('Erreur lors de l\'ajout');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteInterview.mutateAsync(id);
      toast.success('Interview supprimée');
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
          <h2 className="text-2xl font-display font-bold">Interviews</h2>
          <p className="text-muted-foreground text-sm">Vidéos et entretiens</p>
        </div>
        
        {isAdmin && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-red shadow-red">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-display">Nouvelle interview</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="videoTitle">Titre *</Label>
                  <Input
                    id="videoTitle"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Titre de l'interview..."
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="videoUrl">URL de la vidéo *</Label>
                  <Input
                    id="videoUrl"
                    type="url"
                    value={formData.video_url}
                    onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                    placeholder="https://youtube.com/watch?v=..."
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Supporte YouTube et les liens embed
                  </p>
                </div>

                {categories && categories.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="category">Catégorie</Label>
                    <select
                      id="category"
                      value={formData.category_id}
                      onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="">Sans catégorie</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                
                <FileUploadInput
                  label="Miniature (optionnel)"
                  value={formData.thumbnail_url}
                  onChange={(url) => setFormData({ ...formData, thumbnail_url: url })}
                  folder="interviews"
                />
                
                <div className="space-y-2">
                  <Label htmlFor="videoDescription">Description (optionnel)</Label>
                  <Textarea
                    id="videoDescription"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Décrivez l'interview..."
                    rows={3}
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full gradient-red shadow-red"
                  disabled={createInterview.isPending}
                >
                  {createInterview.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Publier
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Category filter */}
      <CategoryManager
        section="interviews"
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      {filteredInterviews.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <PlayCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Aucune interview pour le moment</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredInterviews.map((interview) => (
            <Card key={interview.id} className="overflow-hidden animate-scale-in shadow-soft">
              {(() => {
                const embedUrl = getEmbedUrl(interview.video_url);
                return embedUrl ? (
                  <div className="aspect-video w-full">
                    <iframe
                      src={embedUrl}
                      className="w-full h-full"
                      allowFullScreen
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      sandbox="allow-scripts allow-same-origin allow-presentation"
                    />
                  </div>
                ) : (
                  <div className="aspect-video w-full bg-muted flex items-center justify-center">
                    <p className="text-muted-foreground text-sm">Vidéo non disponible</p>
                  </div>
                );
              })()}
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg font-display line-clamp-2">
                      {interview.title}
                    </CardTitle>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(interview.created_at), "d MMMM yyyy", { locale: fr })}
                    </div>
                  </div>
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="flex-shrink-0 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(interview.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              {interview.description && (
                <CardContent className="pt-0">
                  <CardDescription className="line-clamp-3">
                    {interview.description}
                  </CardDescription>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
