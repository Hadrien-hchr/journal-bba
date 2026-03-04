import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useInformation, useDeleteInformation } from '@/hooks/useContent';
import { useContentCategories } from '@/hooks/useContentCategories';
import { useAppSetting, useUpdateAppSetting } from '@/hooks/useAppSettings';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Loader2, Info, Clock, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CategoryManager } from '@/components/content/CategoryManager';
import { ArticleEditor, CANVAS_WIDTH, CANVAS_HEIGHT } from '@/components/articles/ArticleEditor';
import { ArticleCanvas } from '@/components/articles/ArticleCanvas';
import { BlockData } from '@/components/articles/ArticleBlock';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import * as LucideIcons from 'lucide-react';

const AVAILABLE_ICONS = ['Info', 'Newspaper', 'BookOpen', 'FileText', 'ScrollText', 'Megaphone', 'Bell', 'Star', 'Sparkles', 'Flame'];

export default function Information() {
  const { isAdmin, user } = useAuth();
  const { information, isLoading } = useInformation();
  const { data: categories } = useContentCategories('information');
  const deleteInfo = useDeleteInformation();
  const { data: infoTabSetting } = useAppSetting('info_tab');
  const updateSetting = useUpdateAppSetting();
  const queryClient = useQueryClient();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Create article form
  const [title, setTitle] = useState('');
  const [blocks, setBlocks] = useState<BlockData[]>([]);
  const [bgColor, setBgColor] = useState('#ffffff');
  const [categoryId, setCategoryId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Settings form
  const [tabName, setTabName] = useState('');
  const [tabIcon, setTabIcon] = useState('');

  const tabSettings = infoTabSetting?.value as { name?: string; icon?: string } | undefined;
  const displayName = tabSettings?.name || 'Infos';

  const filteredInformation = useMemo(() => {
    if (selectedCategory === 'all') return information;
    return information.filter(i => i.category_id === selectedCategory);
  }, [information, selectedCategory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (blocks.length === 0) {
      toast.error('Ajoutez au moins un bloc à votre article');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('information')
        .insert({
          title: title.trim() || null,
          content: blocks.filter(b => b.type !== 'image').map(b => b.content).join('\n') || 'Article visuel',
          layout_blocks: blocks as any,
          background_color: bgColor,
          category_id: categoryId || null,
          created_by: user?.id,
        });

      if (error) throw error;
      
      toast.success('Article publié !');
      queryClient.invalidateQueries({ queryKey: ['information'] });
      setIsDialogOpen(false);
      setTitle('');
      setBlocks([]);
      setBgColor('#ffffff');
      setCategoryId('');
    } catch (error) {
      toast.error("Erreur lors de la publication");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteInfo.mutateAsync(id);
      toast.success('Article supprimé');
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleSaveSettings = async () => {
    try {
      await updateSetting.mutateAsync({
        key: 'info_tab',
        value: { name: tabName || 'Infos', icon: tabIcon || 'Info' },
      });
      toast.success('Paramètres mis à jour');
      setIsSettingsOpen(false);
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const openSettings = () => {
    setTabName(tabSettings?.name || 'Infos');
    setTabIcon(tabSettings?.icon || 'Info');
    setIsSettingsOpen(true);
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
          <h2 className="text-2xl font-display font-bold">{displayName}</h2>
          <p className="text-muted-foreground text-sm">Actualités et annonces</p>
        </div>
        
        {isAdmin && (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={openSettings}>
              <Settings2 className="h-5 w-5" />
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-red shadow-red">
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="font-display">Nouvel article</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="articleTitle">Titre de l'article</Label>
                    <Input
                      id="articleTitle"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Titre..."
                    />
                  </div>

                  {categories && categories.length > 0 && (
                    <div className="space-y-2">
                      <Label>Catégorie</Label>
                      <Select value={categoryId} onValueChange={setCategoryId}>
                        <SelectTrigger><SelectValue placeholder="Sans catégorie" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sans catégorie</SelectItem>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <ArticleEditor
                    blocks={blocks}
                    onBlocksChange={setBlocks}
                    backgroundColor={bgColor}
                    onBackgroundColorChange={setBgColor}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full gradient-red shadow-red"
                    disabled={isSubmitting}
                  >
                    {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Publier l'article
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {/* Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Paramètres de l'onglet</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nom de l'onglet</Label>
              <Input value={tabName} onChange={(e) => setTabName(e.target.value)} placeholder="Infos" />
            </div>
            <div className="space-y-2">
              <Label>Icône</Label>
              <div className="grid grid-cols-5 gap-2">
                {AVAILABLE_ICONS.map((iconName) => {
                  const IconComp = (LucideIcons as any)[iconName];
                  if (!IconComp) return null;
                  return (
                    <Button
                      key={iconName}
                      type="button"
                      variant={tabIcon === iconName ? 'default' : 'outline'}
                      size="sm"
                      className="flex flex-col items-center gap-1 h-auto py-2"
                      onClick={() => setTabIcon(iconName)}
                    >
                      <IconComp className="h-5 w-5" />
                      <span className="text-[10px]">{iconName}</span>
                    </Button>
                  );
                })}
              </div>
            </div>
            <Button onClick={handleSaveSettings} className="w-full gradient-red shadow-red" disabled={updateSetting.isPending}>
              {updateSetting.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Enregistrer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Category filter */}
      <CategoryManager
        section="information"
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      {filteredInformation.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Info className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Aucun article pour le moment</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {filteredInformation.map((info) => {
            const layoutBlocks = (info as any).layout_blocks as BlockData[] | null;
            const bgColorArticle = (info as any).background_color as string | null;

            return (
              <div key={info.id} className="animate-scale-in">
                {/* Header with title and date */}
                <div className="flex items-start justify-between mb-2">
                  <div>
                    {info.title && (
                      <h3 className="text-lg font-display font-bold">{info.title}</h3>
                    )}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {format(new Date(info.created_at), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
                    </div>
                  </div>
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(info.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {/* Article content */}
                {layoutBlocks && layoutBlocks.length > 0 ? (
                  <ArticleCanvas
                    blocks={layoutBlocks}
                    selectedBlockId={null}
                    onSelectBlock={() => {}}
                    onUpdateBlock={() => {}}
                    backgroundColor={bgColorArticle || '#ffffff'}
                    canvasWidth={CANVAS_WIDTH}
                    canvasHeight={CANVAS_HEIGHT}
                    readOnly
                  />
                ) : (
                  <Card className="shadow-soft overflow-hidden">
                    {info.image_url && (
                      <img src={info.image_url} alt={info.title || 'Information'} className="w-full h-48 object-cover" />
                    )}
                    <CardContent className="pt-4">
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">{info.content}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
