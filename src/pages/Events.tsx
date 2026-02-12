import { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEvents, useDeleteEvent, useUserSubscriptions, useCreateEvent, useUpdateEvent, useAssociations } from '@/hooks/useEvents';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { format, isBefore } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toZonedTime } from 'date-fns-tz';
import { Plus, Trash2, Euro, Ticket, Loader2, PartyPopper, CalendarDays, X, ImageIcon, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { FileUploadInput } from '@/components/FileUploadInput';
import { CollapsibleAssociationBanner } from '@/components/events/CollapsibleAssociationBanner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

const IMAGE_SIZE_OPTIONS = [
  { value: 'small', label: 'Petite', aspectClass: 'aspect-video max-h-32' },
  { value: 'medium', label: 'Moyenne', aspectClass: 'aspect-video max-h-48' },
  { value: 'large', label: 'Grande', aspectClass: 'aspect-video' },
] as const;

// Dynamic associations list from database


export default function Events() {
  const navigate = useNavigate();
  const { isAdmin, user } = useAuth();
  const { events, isLoading } = useEvents();
  const { data: associations } = useAssociations();
  const { subscriptions, toggleSubscription } = useUserSubscriptions();
  const deleteEvent = useDeleteEvent();
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const queryClient = useQueryClient();

  // Dynamic associations list from DB
  const ASSOCIATIONS_LIST = useMemo(() => 
    (associations || []).map((a) => a.name), 
    [associations]
  );
  const FILTER_ASSOCIATIONS = useMemo(() => ['Tous', ...ASSOCIATIONS_LIST], [ASSOCIATIONS_LIST]);

  // Manage sections dialog
  const [isSectionsDialogOpen, setIsSectionsDialogOpen] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAssociation, setSelectedAssociation] = useState('Tous');
  
  const [editingPhotoLink, setEditingPhotoLink] = useState<string | null>(null);
  const [photoLinkValue, setPhotoLinkValue] = useState('');
  
  // Multi-association input state
  const [associationInput, setAssociationInput] = useState('');
  const [selectedAssociations, setSelectedAssociations] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image_url: '',
    image_size: 'medium' as 'small' | 'medium' | 'large',
    event_date: '',
    price: '',
    ticket_link: '',
    is_published: true,
    publish_at: '',
  });

  // Get current time in France timezone
  const getFranceTime = () => {
    return toZonedTime(new Date(), 'Europe/Paris');
  };

  const isEventPast = (eventDate: string) => {
    const franceNow = getFranceTime();
    const eventDateFrance = toZonedTime(new Date(eventDate), 'Europe/Paris');
    return isBefore(eventDateFrance, franceNow);
  };

  // Suggestions based on input
  const filteredSuggestions = useMemo(() => {
    if (!associationInput.trim()) return [];
    const input = associationInput.toLowerCase();
    return ASSOCIATIONS_LIST.filter(
      (assoc) => 
        assoc.toLowerCase().includes(input) && 
        !selectedAssociations.includes(assoc)
    );
  }, [associationInput, selectedAssociations]);

  const handleAddAssociation = (assoc: string) => {
    if (!selectedAssociations.includes(assoc)) {
      setSelectedAssociations([...selectedAssociations, assoc]);
    }
    setAssociationInput('');
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleRemoveAssociation = (assoc: string) => {
    setSelectedAssociations(selectedAssociations.filter((a) => a !== assoc));
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && associationInput.trim()) {
      e.preventDefault();
      handleAddAssociation(associationInput.trim());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Join multiple associations with comma
      const associationsString = selectedAssociations.join(', ');
      
      await createEvent.mutateAsync({
        title: formData.title,
        description: formData.description || undefined,
        custom_association_name: associationsString || undefined,
        image_url: formData.image_url || undefined,
        image_size: formData.image_size,
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
        image_url: '',
        image_size: 'medium',
        event_date: '',
        price: '',
        ticket_link: '',
        is_published: true,
        publish_at: '',
      });
      setSelectedAssociations([]);
      setAssociationInput('');
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

  const handleSubscriptionToggle = async (eventId: string, eventTitle: string) => {
    if (!user) {
      toast.error('Connectez-vous pour vous abonner aux événements');
      return;
    }
    try {
      await toggleSubscription.mutateAsync({ eventId, eventTitle });
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleSavePhotoLink = async (eventId: string) => {
    try {
      await updateEvent.mutateAsync({
        id: eventId,
        photo_link: photoLinkValue || null,
      });
      toast.success('Lien photos enregistré');
      setEditingPhotoLink(null);
      setPhotoLinkValue('');
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement');
    }
  };
  const handleAddSection = async () => {
    const name = newSectionName.trim();
    if (!name) return;
    if (ASSOCIATIONS_LIST.some((a) => a.toLowerCase() === name.toLowerCase())) {
      toast.error('Cette section existe déjà');
      return;
    }
    try {
      const { error } = await supabase.from('associations').insert({ name });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['associations'] });
      setNewSectionName('');
      toast.success(`Section "${name}" ajoutée`);
    } catch {
      toast.error("Erreur lors de l'ajout");
    }
  };

  const handleDeleteSection = async (name: string) => {
    const assoc = associations?.find((a) => a.name === name);
    if (!assoc) return;
    try {
      const { error } = await supabase.from('associations').delete().eq('id', assoc.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['associations'] });
      if (selectedAssociation === name) setSelectedAssociation('Tous');
      toast.success(`Section "${name}" supprimée`);
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };


  const sortedAndFilteredEvents = useMemo(() => {
    if (!events) return [];
    
    // Filter by association
    let filtered = events.filter((event) => {
      if (selectedAssociation === 'Tous') return true;
      const eventAssocName = event.custom_association_name || event.associations?.name || '';
      // Check if any of the associations match (comma-separated)
      const assocList = eventAssocName.split(',').map((a) => a.trim());
      return assocList.includes(selectedAssociation);
    });

    
    const franceNow = getFranceTime();
    
    // Separate upcoming and past events
    const upcoming = filtered.filter((event) => {
      const eventDate = toZonedTime(new Date(event.event_date), 'Europe/Paris');
      return !isBefore(eventDate, franceNow);
    });
    
    const past = filtered.filter((event) => {
      const eventDate = toZonedTime(new Date(event.event_date), 'Europe/Paris');
      return isBefore(eventDate, franceNow);
    });
    
    // Sort upcoming: soonest first
    upcoming.sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
    
    // Sort past: most recent first
    past.sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime());
    
    // Combine: upcoming first, then past
    return [...upcoming, ...past];
  }, [events, selectedAssociation]);

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
                  <Label>Associations</Label>
                  <div className="relative">
                    {/* Selected associations as badges */}
                    <div className="flex flex-wrap gap-1 mb-2">
                      {selectedAssociations.map((assoc) => (
                        <Badge key={assoc} variant="secondary" className="flex items-center gap-1">
                          {assoc}
                          <button
                            type="button"
                            onClick={() => handleRemoveAssociation(assoc)}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    
                    {/* Input with autocomplete */}
                    <Input
                      ref={inputRef}
                      value={associationInput}
                      onChange={(e) => {
                        setAssociationInput(e.target.value);
                        setShowSuggestions(true);
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                      onKeyDown={handleInputKeyDown}
                      placeholder="Tapez une association et appuyez sur Entrée..."
                    />
                    
                    {/* Suggestions dropdown */}
                    {showSuggestions && filteredSuggestions.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-40 overflow-y-auto">
                        {filteredSuggestions.map((assoc) => (
                          <button
                            key={assoc}
                            type="button"
                            className="w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors"
                            onClick={() => handleAddAssociation(assoc)}
                          >
                            {assoc}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Vous pouvez ajouter plusieurs associations
                  </p>
                </div>
                
                <FileUploadInput
                  label="Image de l'événement"
                  value={formData.image_url}
                  onChange={(url) => setFormData({ ...formData, image_url: url })}
                  folder="events"
                />
                
                <div className="space-y-2">
                  <Label>Taille de l'image</Label>
                  <Select
                    value={formData.image_size}
                    onValueChange={(value: 'small' | 'medium' | 'large') => setFormData({ ...formData, image_size: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir la taille" />
                    </SelectTrigger>
                    <SelectContent>
                      {IMAGE_SIZE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <ImageIcon className="h-4 w-4" />
                            {option.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Contrôle la taille d'affichage de l'image dans la liste
                  </p>
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

      {/* Association filter buttons */}
      <div className="overflow-x-auto pb-2 -mx-4 px-4">
        <div className="flex gap-2 min-w-max items-center">
          {FILTER_ASSOCIATIONS.map((assoc) => (
            <Button
              key={assoc}
              variant={selectedAssociation === assoc ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedAssociation(assoc)}
              className={cn(
                'whitespace-nowrap transition-all',
                selectedAssociation === assoc && 'gradient-red shadow-red'
              )}
            >
              {assoc}
            </Button>
          ))}
          {isAdmin && (
            <Dialog open={isSectionsDialogOpen} onOpenChange={setIsSectionsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="ml-1">
                  <Settings2 className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="font-display">Gérer les sections</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      value={newSectionName}
                      onChange={(e) => setNewSectionName(e.target.value)}
                      placeholder="Nom de la nouvelle section..."
                      onKeyDown={(e) => e.key === 'Enter' && handleAddSection()}
                    />
                    <Button onClick={handleAddSection} className="gradient-red shadow-red shrink-0">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {ASSOCIATIONS_LIST.map((name) => (
                      <div key={name} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                        <span className="text-sm font-medium">{name}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteSection(name)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                    {ASSOCIATIONS_LIST.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">Aucune section</p>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Association banner when filtered */}
      {selectedAssociation !== 'Tous' && (
        <CollapsibleAssociationBanner associationName={selectedAssociation} />
      )}

      {sortedAndFilteredEvents.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <PartyPopper className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {selectedAssociation === 'Tous' 
                ? 'Aucun événement pour le moment'
                : `Aucun événement pour ${selectedAssociation}`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedAndFilteredEvents.map((event) => {
            const isPast = isEventPast(event.event_date);
            const associationName = event.custom_association_name || event.associations?.name;
            
            // Get the image size class based on event settings
            const imageSizeOption = IMAGE_SIZE_OPTIONS.find(opt => opt.value === (event.image_size || 'medium'));
            const imageSizeClass = imageSizeOption?.aspectClass || 'aspect-video max-h-48';
            
            return (
              <Card 
                key={event.id} 
                className={cn(
                  'overflow-hidden animate-scale-in shadow-soft hover:shadow-medium transition-all cursor-pointer',
                  isPast && 'opacity-60 grayscale-[30%]'
                )}
                onClick={() => navigate(`/events/${event.id}`)}
              >
                {event.image_url && (
                  <div className={cn("w-full overflow-hidden relative", imageSizeClass)}>
                    <img
                      src={event.image_url}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                    {isPast && (
                      <div className="absolute inset-0 bg-background/30 flex items-center justify-center">
                        <span className="bg-muted/90 text-muted-foreground px-3 py-1 rounded-full text-sm font-medium">
                          Événement passé
                        </span>
                      </div>
                    )}
                  </div>
                )}
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg font-display line-clamp-2">{event.title}</CardTitle>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {associationName && (
                          <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-accent text-accent-foreground">
                            {associationName}
                          </span>
                        )}
                        {event.category && (
                          <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-primary/10 text-primary">
                            {event.category}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSubscriptionToggle(event.id, event.title);
                        }}
                        className={cn(
                          'h-8 w-8',
                          subscriptions.includes(event.id) && 'text-primary'
                        )}
                        title={subscriptions.includes(event.id) ? 'Retirer du calendrier' : 'Ajouter au calendrier'}
                      >
                        <CalendarDays className={cn(
                          'h-5 w-5',
                          subscriptions.includes(event.id) && 'fill-current'
                        )} />
                      </Button>
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(event.id);
                          }}
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
                      <CalendarDays className="h-4 w-4 text-primary" />
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
                <CardFooter className="pt-2 flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
                  {/* Ticket link for upcoming events */}
                  {!isPast && event.ticket_link && (
                    <Button
                      variant="outline"
                      className="w-full border-primary text-primary hover:bg-accent"
                      asChild
                    >
                      <a href={event.ticket_link} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                        <Ticket className="h-4 w-4 mr-2" />
                        Billetterie
                      </a>
                    </Button>
                  )}

                  {/* Photo link for past events */}
                  {isPast && (
                    <>
                      {/* Admin: Edit photo link */}
                      {isAdmin && (
                        <div className="w-full space-y-2">
                          {editingPhotoLink === event.id ? (
                            <div className="flex gap-2">
                              <Input
                                type="url"
                                placeholder="Lien vers les photos..."
                                value={photoLinkValue}
                                onChange={(e) => setPhotoLinkValue(e.target.value)}
                                className="flex-1"
                                onClick={(e) => e.stopPropagation()}
                              />
                              <Button 
                                size="sm" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSavePhotoLink(event.id);
                                }}
                                disabled={updateEvent.isPending}
                              >
                                {updateEvent.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enregistrer'}
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingPhotoLink(null);
                                  setPhotoLinkValue('');
                                }}
                              >
                                Annuler
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingPhotoLink(event.id);
                                setPhotoLinkValue(event.photo_link || '');
                              }}
                            >
                              <CalendarDays className="h-4 w-4 mr-2" />
                              {event.photo_link ? 'Modifier le lien photos' : 'Ajouter un lien photos'}
                            </Button>
                          )}
                        </div>
                      )}

                      {/* User: View photo link */}
                      {event.photo_link && (
                        <Button
                          variant="outline"
                          className="w-full border-primary text-primary hover:bg-accent"
                          asChild
                        >
                          <a href={event.photo_link} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                            <CalendarDays className="h-4 w-4 mr-2" />
                            Voir les photos
                          </a>
                        </Button>
                      )}
                    </>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
