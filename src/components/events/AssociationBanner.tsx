import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAssociations, useUpdateAssociation, Association } from '@/hooks/useEvents';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Pencil, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { FileUploadInput } from '@/components/FileUploadInput';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface AssociationBannerProps {
  associationName: string;
}

// Hook to create a new association
function useCreateAssociation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .from('associations')
        .insert({ name })
        .select()
        .single();

      if (error) throw error;
      return data as Association;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['associations'] });
    },
  });
}

export function AssociationBanner({ associationName }: AssociationBannerProps) {
  const { isAdmin } = useAuth();
  const { data: associations, isLoading } = useAssociations();
  const updateAssociation = useUpdateAssociation();
  const createAssociation = useCreateAssociation();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editData, setEditData] = useState({
    logo_url: '',
    description: '',
  });

  // Find the association by name
  const association = associations?.find(
    (a) => a.name.toLowerCase() === associationName.toLowerCase()
  );

  // Auto-create association if it doesn't exist and admin opens edit
  const handleOpenEdit = async () => {
    if (!association) {
      // Create the association first
      try {
        const newAssoc = await createAssociation.mutateAsync(associationName);
        setEditData({
          logo_url: newAssoc.logo_url || '',
          description: newAssoc.description || '',
        });
      } catch (error) {
        toast.error('Erreur lors de la création de l\'association');
        return;
      }
    } else {
      setEditData({
        logo_url: association.logo_url || '',
        description: association.description || '',
      });
    }
    setIsDialogOpen(true);
  };

  // Update editData when association changes (after creation)
  useEffect(() => {
    if (isDialogOpen && association) {
      setEditData({
        logo_url: association.logo_url || '',
        description: association.description || '',
      });
    }
  }, [association, isDialogOpen]);

  const handleSave = async () => {
    const assocToUpdate = associations?.find(
      (a) => a.name.toLowerCase() === associationName.toLowerCase()
    );
    
    if (!assocToUpdate) {
      toast.error('Association non trouvée');
      return;
    }

    try {
      await updateAssociation.mutateAsync({
        id: assocToUpdate.id,
        logo_url: editData.logo_url || null,
        description: editData.description || null,
      });
      toast.success('Association mise à jour');
      setIsDialogOpen(false);
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const displayLogo = association?.logo_url;
  const displayDescription = association?.description;

  return (
    <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-4 mb-4 animate-fade-in">
      <div className="flex items-start gap-4">
        {/* Logo */}
        <div className="flex-shrink-0">
          {displayLogo ? (
            <img
              src={displayLogo}
              alt={associationName}
              className="w-16 h-16 rounded-full object-cover border-2 border-primary/20"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xl">
              {associationName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-display font-bold text-lg">{associationName}</h3>
            {isAdmin && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7" 
                    onClick={handleOpenEdit}
                    disabled={createAssociation.isPending}
                  >
                    {createAssociation.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Pencil className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="font-display">Modifier {associationName}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <FileUploadInput
                      label="Logo (format rond)"
                      value={editData.logo_url}
                      onChange={(url) => setEditData({ ...editData, logo_url: url })}
                      folder="associations"
                    />
                    
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={editData.description}
                        onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                        placeholder="Description de l'association..."
                        rows={4}
                      />
                    </div>
                    
                    <Button
                      className="w-full gradient-red shadow-red"
                      onClick={handleSave}
                      disabled={updateAssociation.isPending}
                    >
                      {updateAssociation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      Enregistrer
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
          {displayDescription && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-3">
              {displayDescription}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
