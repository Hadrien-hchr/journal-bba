import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAssociations, useUpdateAssociation } from '@/hooks/useEvents';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Pencil, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { FileUploadInput } from '@/components/FileUploadInput';

interface AssociationBannerProps {
  associationName: string;
}

export function AssociationBanner({ associationName }: AssociationBannerProps) {
  const { isAdmin } = useAuth();
  const { data: associations } = useAssociations();
  const updateAssociation = useUpdateAssociation();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editData, setEditData] = useState({
    logo_url: '',
    description: '',
  });

  // Find the association by name
  const association = associations?.find(
    (a) => a.name.toLowerCase() === associationName.toLowerCase()
  );

  if (!association) {
    // Show a simple header for custom associations
    return (
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-4 mb-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xl">
            {associationName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-display font-bold text-lg">{associationName}</h3>
          </div>
        </div>
      </div>
    );
  }

  const handleOpenEdit = () => {
    setEditData({
      logo_url: association.logo_url || '',
      description: association.description || '',
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      await updateAssociation.mutateAsync({
        id: association.id,
        logo_url: editData.logo_url || null,
        description: editData.description || null,
      });
      toast.success('Association mise à jour');
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
          {association.logo_url ? (
            <img
              src={association.logo_url}
              alt={association.name}
              className="w-16 h-16 rounded-full object-cover border-2 border-primary/20"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xl">
              {association.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-display font-bold text-lg">{association.name}</h3>
            {isAdmin && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleOpenEdit}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="font-display">Modifier {association.name}</DialogTitle>
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
          {association.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-3">
              {association.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
