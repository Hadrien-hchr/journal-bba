import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  useContentCategories, 
  useCreateContentCategory, 
  useDeleteContentCategory,
  ContentCategory 
} from '@/hooks/useContentCategories';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, Loader2, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { CategoryBanner } from './CategoryBanner';

interface CategoryManagerProps {
  section: 'interviews' | 'information';
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
}

export function CategoryManager({ section, selectedCategory, onSelectCategory }: CategoryManagerProps) {
  const { isAdmin } = useAuth();
  const { data: categories, isLoading } = useContentCategories(section);
  const createCategory = useCreateContentCategory();
  const deleteCategory = useDeleteContentCategory();
  
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error('Le nom est requis');
      return;
    }

    try {
      await createCategory.mutateAsync({
        name: newCategoryName.trim(),
        section,
      });
      toast.success('Catégorie créée');
      setNewCategoryName('');
    } catch (error: any) {
      if (error.code === '23505') {
        toast.error('Cette catégorie existe déjà');
      } else {
        toast.error('Erreur lors de la création');
      }
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await deleteCategory.mutateAsync(id);
      toast.success('Catégorie supprimée');
      if (selectedCategory === id) {
        onSelectCategory('all');
      }
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const selectedCategoryData = useMemo(() => {
    if (selectedCategory === 'all') return null;
    return categories?.find(c => c.id === selectedCategory);
  }, [categories, selectedCategory]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-2">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter buttons */}
      <div className="overflow-x-auto pb-2 -mx-4 px-4">
        <div className="flex gap-2 min-w-max items-center">
          <Button
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onSelectCategory('all')}
            className={cn(
              'whitespace-nowrap transition-all',
              selectedCategory === 'all' && 'gradient-red shadow-red'
            )}
          >
            Tous
          </Button>
          
          {categories?.map((cat) => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => onSelectCategory(cat.id)}
              className={cn(
                'whitespace-nowrap transition-all',
                selectedCategory === cat.id && 'gradient-red shadow-red'
              )}
            >
              {cat.name}
            </Button>
          ))}

          {isAdmin && (
            <Dialog open={isManageOpen} onOpenChange={setIsManageOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Settings className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="font-display">Gérer les catégories</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {/* Add new category */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Nouvelle catégorie..."
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCreateCategory()}
                    />
                    <Button
                      onClick={handleCreateCategory}
                      disabled={createCategory.isPending}
                      className="gradient-red shadow-red"
                    >
                      {createCategory.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  {/* List existing categories */}
                  <div className="space-y-2">
                    <Label>Catégories existantes</Label>
                    {categories?.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4 text-center">
                        Aucune catégorie
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {categories?.map((cat) => (
                          <div
                            key={cat.id}
                            className="flex items-center justify-between p-2 rounded-md bg-muted/50"
                          >
                            <div className="flex items-center gap-2">
                              {cat.logo_url ? (
                                <img
                                  src={cat.logo_url}
                                  alt={cat.name}
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                                  {cat.name.charAt(0)}
                                </div>
                              )}
                              <span className="font-medium">{cat.name}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleDeleteCategory(cat.id)}
                              disabled={deleteCategory.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Show banner when category is selected */}
      {selectedCategoryData && (
        <CategoryBanner category={selectedCategoryData} />
      )}
    </div>
  );
}
