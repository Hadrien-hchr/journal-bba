import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useEvents, useDeleteEvent, useUserSubscriptions, useAssociations, useCreateEvent } from '@/hooks/useEvents';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Plus, Trash2, Calendar, Euro, Ticket, Loader2, PartyPopper } from 'lucide-react';
import { toast } from 'sonner';

export default function Events() {
  const { isAdmin } = useAuth();
  const { events, isLoading } = useEvents();
  const { subscriptions, toggleSubscription } = useUserSubscriptions();
  const { data: associations } = useAssociations();
  const deleteEvent = useDeleteEvent();
  const createEvent = useCreateEvent();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    association_id: '',
    image_url: '',
    event_date: '',
    price: '',
    ticket_link: '',
    is_published: true,
    publish_at: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createEvent.mutateAsync({
        title: formData.title,
        description: formData.description || undefined,
        association_id: formData.association_id || undefined,
        image_url: formData.image_url || undefined,
        event_date: new Date(formData.event_date).toISOString(),
        price: formData.price ? parseFloat(formData.price) : undefined,
        ticket_link: formData.ticket_link || undefined,
        is_published: formData.is_published,
        publish_at: formData.publish_at ? new Date(formData.publish_at).toISOString() : undefined,
      });
      
      toast.success('Événement créé avec succès !');
      setIsDialogOpen(false);
      setFormData({
        title: '',
        description: '',
        association_id: '',
        image_url: '',
        event_date: '',
        price: '',
        ticket_link: '',
        is_published: true,
        publish_at: '',
      });
    } catch (error) {
      toast.error('Erreur lors de la création de l\'événement');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteEvent.mutateAsync(id);
      toast.success('Événement supprimé');
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleSubscriptionToggle = async (eventId: string) => {
    try {
      await toggleSubscription.mutateAsync(eventId);
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
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
          <h2 className="text-2xl font-display font-bold">Événements</h2>
          <p className="text-muted-foreground text-sm">Découvrez les prochains événements</p>
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
                <DialogTitle className="font-display">Nouvel événement</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Titre *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="association">Association</Label>
                  <Select
                    value={formData.association_id}
                    onValueChange={(value) => setFormData({ ...formData, association_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une association" />
                    </SelectTrigger>
                    <SelectContent>
                      {associations?.map((assoc) => (
                        <SelectItem key={assoc.id} value={assoc.id}>
                          {assoc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="image_url">URL de l'image</Label>
                  <Input
                    id="image_url"
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="event_date">Date de l'événement *</Label>
                  <Input
                    id="event_date"
                    type="datetime-local"
                    value={formData.event_date}
                    onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Prix (€)</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="ticket_link">Lien billetterie</Label>
                    <Input
                      id="ticket_link"
                      type="url"
                      value={formData.ticket_link}
                      onChange={(e) => setFormData({ ...formData, ticket_link: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="is_published">Publier immédiatement</Label>
                  <Switch
                    id="is_published"
                    checked={formData.is_published}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                  />
                </div>
                
                {!formData.is_published && (
                  <div className="space-y-2">
                    <Label htmlFor="publish_at">Date de publication</Label>
                    <Input
                      id="publish_at"
                      type="datetime-local"
                      value={formData.publish_at}
                      onChange={(e) => setFormData({ ...formData, publish_at: e.target.value })}
                    />
                  </div>
                )}
                
                <Button 
                  type="submit" 
                  className="w-full gradient-red shadow-red"
                  disabled={createEvent.isPending}
                >
                  {createEvent.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Créer l'événement
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {events?.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <PartyPopper className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Aucun événement pour le moment</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {events?.map((event) => (
            <Card key={event.id} className="overflow-hidden animate-scale-in shadow-soft hover:shadow-medium transition-shadow">
              {event.image_url && (
                <div className="aspect-video w-full overflow-hidden">
                  <img
                    src={event.image_url}
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg font-display line-clamp-2">{event.title}</CardTitle>
                    {event.associations?.name && (
                      <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full bg-accent text-accent-foreground">
                        {event.associations.name}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Checkbox
                      checked={subscriptions.includes(event.id)}
                      onCheckedChange={() => handleSubscriptionToggle(event.id)}
                      className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(event.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                {event.description && (
                  <CardDescription className="line-clamp-2 mb-3">
                    {event.description}
                  </CardDescription>
                )}
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-primary" />
                    {format(new Date(event.event_date), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                  </div>
                  {event.price !== null && (
                    <div className="flex items-center gap-1">
                      <Euro className="h-4 w-4 text-primary" />
                      {event.price === 0 ? 'Gratuit' : `${event.price}€`}
                    </div>
                  )}
                </div>
              </CardContent>
              {event.ticket_link && (
                <CardFooter className="pt-2">
                  <Button
                    variant="outline"
                    className="w-full border-primary text-primary hover:bg-accent"
                    asChild
                  >
                    <a href={event.ticket_link} target="_blank" rel="noopener noreferrer">
                      <Ticket className="h-4 w-4 mr-2" />
                      Billetterie
                    </a>
                  </Button>
                </CardFooter>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
