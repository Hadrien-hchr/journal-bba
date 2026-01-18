import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useHomePosts, useCreateHomePost, useDeleteHomePost } from '@/hooks/useHomePosts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, Loader2, Sparkles, Clock, Play } from 'lucide-react';
import { toast } from 'sonner';
import { MultiFileUpload } from '@/components/MultiFileUpload';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function Home() {
  const { isAdmin } = useAuth();
  const { posts, isLoading } = useHomePosts();
  const createPost = useCreateHomePost();
  const deletePost = useDeleteHomePost();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    text_content: '',
    media_urls: [] as string[],
    video_urls: [] as string[],
  });
  const [videoUrlInput, setVideoUrlInput] = useState('');

  // Convert YouTube URL to embed URL
  const getEmbedUrl = (url: string) => {
    const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/);
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    }
    return url;
  };

  const handleAddVideoUrl = () => {
    if (videoUrlInput.trim()) {
      setFormData({
        ...formData,
        video_urls: [...formData.video_urls, videoUrlInput.trim()],
      });
      setVideoUrlInput('');
    }
  };

  const handleRemoveVideoUrl = (index: number) => {
    setFormData({
      ...formData,
      video_urls: formData.video_urls.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title && !formData.text_content && formData.media_urls.length === 0 && formData.video_urls.length === 0) {
      toast.error('Ajoutez du contenu à votre post');
      return;
    }

    try {
      await createPost.mutateAsync({
        title: formData.title || undefined,
        text_content: formData.text_content || undefined,
        media_urls: formData.media_urls.length > 0 ? formData.media_urls : undefined,
        video_urls: formData.video_urls.length > 0 ? formData.video_urls : undefined,
      });
      
      toast.success('Post publié !');
      setIsDialogOpen(false);
      setFormData({ title: '', text_content: '', media_urls: [], video_urls: [] });
      setVideoUrlInput('');
    } catch (error) {
      toast.error('Erreur lors de la publication');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePost.mutateAsync(id);
      toast.success('Post supprimé');
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
          <h2 className="text-2xl font-display font-bold">Accueil</h2>
          <p className="text-muted-foreground text-sm">Bienvenue sur Journal BBA</p>
        </div>
        
        {isAdmin && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-red shadow-red">
                <Plus className="h-4 w-4 mr-2" />
                Nouveau post
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-display">Nouveau post</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Titre (optionnel)</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Titre du post..."
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="text_content">Texte (optionnel)</Label>
                  <Textarea
                    id="text_content"
                    value={formData.text_content}
                    onChange={(e) => setFormData({ ...formData, text_content: e.target.value })}
                    placeholder="Rédigez votre texte..."
                    rows={4}
                  />
                </div>

                <MultiFileUpload
                  label="Images (optionnel)"
                  values={formData.media_urls}
                  onChange={(urls) => setFormData({ ...formData, media_urls: urls })}
                  folder="home"
                  maxFiles={10}
                />

                <div className="space-y-2">
                  <Label>Vidéos (optionnel)</Label>
                  <div className="flex gap-2">
                    <Input
                      value={videoUrlInput}
                      onChange={(e) => setVideoUrlInput(e.target.value)}
                      placeholder="URL YouTube..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddVideoUrl();
                        }
                      }}
                    />
                    <Button type="button" variant="outline" onClick={handleAddVideoUrl}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {formData.video_urls.length > 0 && (
                    <div className="space-y-2 mt-2">
                      {formData.video_urls.map((url, index) => (
                        <div key={index} className="flex items-center gap-2 bg-muted rounded-md p-2">
                          <Play className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-xs truncate flex-1">{url}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 flex-shrink-0"
                            onClick={() => handleRemoveVideoUrl(index)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full gradient-red shadow-red"
                  disabled={createPost.isPending}
                >
                  {createPost.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Publier
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {posts.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {isAdmin 
                ? 'Créez votre premier post pour enrichir la page d\'accueil'
                : 'Aucun contenu pour le moment'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <Card key={post.id} className="overflow-hidden animate-scale-in shadow-soft">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    {post.title && (
                      <CardTitle className="text-lg font-display line-clamp-2">
                        {post.title}
                      </CardTitle>
                    )}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(post.created_at), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
                    </div>
                  </div>
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="flex-shrink-0 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(post.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {post.text_content && (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {post.text_content}
                  </p>
                )}

                {post.media_urls && post.media_urls.length > 0 && (
                  <div className={`grid gap-2 ${post.media_urls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                    {post.media_urls.map((url, index) => (
                      <img
                        key={index}
                        src={url}
                        alt={`Image ${index + 1}`}
                        className="w-full h-auto rounded-lg object-cover"
                      />
                    ))}
                  </div>
                )}

                {post.video_urls && post.video_urls.length > 0 && (
                  <div className="space-y-2">
                    {post.video_urls.map((url, index) => (
                      <div key={index} className="aspect-video w-full">
                        <iframe
                          src={getEmbedUrl(url)}
                          className="w-full h-full rounded-lg"
                          allowFullScreen
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        />
                      </div>
                    ))}
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
