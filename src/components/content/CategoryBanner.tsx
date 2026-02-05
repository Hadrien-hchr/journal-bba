import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ContentCategory, useUpdateContentCategory } from '@/hooks/useContentCategories';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Pencil, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { FileUploadInput } from '@/components/FileUploadInput';

interface CategoryBannerProps {
  category: ContentCategory;
}

export function CategoryBanner({ category }: CategoryBannerProps) {
  const { isAdmin } = useAuth();
  const updateCategory = useUpdateContentCategory();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editData, setEditData] = useState({
    logo_url: '',
    description: '',
  });

  const handleOpenEdit = () => {
    setEditData({
      logo_url: category.logo_url || '',
      description: category.description || '',
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      await updateCategory.mutateAsync({
        id: category.id,
        logo_url: editData.logo_url || null,
        description: editData.description || null,
      });
      toast.success('Catégorie mise à jour');
      setIsDialogOpen(false);
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  return (
    <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-4 mb-4 animate-fade-in">
      <div className="flex items-start gap-4">
        {/* Logo */}
        <div className="flex-shrink-0">
          {category.logo_url ? (
            <img
              src={category.logo_url}
              alt={category.name}
              className="w-16 h-16 rounded-full object-cover border-2 border-primary/20"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xl">
              {category.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-display font-bold text-lg">{category.name}</h3>
            {isAdmin && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7" 
                    onClick={handleOpenEdit}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="font-display">Modifier {category.name}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <FileUploadInput
                      label="Logo (format rond)"
                      value={editData.logo_url}
                      onChange={(url) => setEditData({ ...editData, logo_url: url })}
                      folder="categories"
                    />
                    
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={editData.description}
                        onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                        placeholder="Description de la catégorie..."
                        rows={4}
                      />
                    </div>
                    
                    <Button
                      className="w-full gradient-red shadow-red"
                      onClick={handleSave}
                      disabled={updateCategory.isPending}
                    >
                      {updateCategory.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      Enregistrer
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
          {category.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-3">
              {category.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
