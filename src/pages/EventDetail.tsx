import { useParams, useNavigate } from 'react-router-dom';
import { useEvents, useUserSubscriptions, useDeleteEvent, useUpdateEvent } from '@/hooks/useEvents';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { format, isBefore } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toZonedTime } from 'date-fns-tz';
import { ArrowLeft, Trash2, Euro, Ticket, Loader2, CalendarDays } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useState } from 'react';

export default function EventDetail() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { isAdmin, user } = useAuth();
  const { events, isLoading } = useEvents();
  const { subscriptions, toggleSubscription } = useUserSubscriptions();
  const deleteEvent = useDeleteEvent();
  const updateEvent = useUpdateEvent();
  
  const [editingPhotoLink, setEditingPhotoLink] = useState(false);
  const [photoLinkValue, setPhotoLinkValue] = useState('');

  const event = events?.find((e) => e.id === eventId);

  const getFranceTime = () => {
    return toZonedTime(new Date(), 'Europe/Paris');
  };

  const isEventPast = (eventDate: string) => {
    const franceNow = getFranceTime();
    const eventDateFrance = toZonedTime(new Date(eventDate), 'Europe/Paris');
    return isBefore(eventDateFrance, franceNow);
  };

  const handleSubscriptionToggle = async () => {
    if (!user || !event) {
      toast.error('Connectez-vous pour vous abonner aux événements');
      return;
    }
    try {
      await toggleSubscription.mutateAsync({ eventId: event.id, eventTitle: event.title });
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleDelete = async () => {
    if (!event) return;
    try {
      await deleteEvent.mutateAsync(event.id);
      toast.success('Événement supprimé');
      navigate('/events');
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleSavePhotoLink = async () => {
    if (!event) return;
    try {
      await updateEvent.mutateAsync({
        id: event.id,
        photo_link: photoLinkValue || null,
      });
      toast.success('Lien photos enregistré');
      setEditingPhotoLink(false);
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="p-4 space-y-4">
        <Button variant="ghost" onClick={() => navigate('/events')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        <p className="text-center text-muted-foreground">Événement non trouvé</p>
      </div>
    );
  }

  const isPast = isEventPast(event.event_date);
  const associationName = event.custom_association_name || event.associations?.name;

  return (
    <div className="p-4 space-y-4 animate-fade-in">
      {/* Back button */}
      <Button variant="ghost" onClick={() => navigate('/events')} className="mb-2">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Retour aux événements
      </Button>

      <Card
        className={cn(
          'overflow-hidden shadow-soft',
          isPast && 'opacity-60 grayscale-[30%]'
        )}
      >
        {event.image_url && (
          <div className="aspect-video w-full overflow-hidden relative">
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
        
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-2xl font-display">{event.title}</CardTitle>
              <div className="flex flex-wrap gap-2 mt-2">
                {associationName && (
                  <Badge variant="secondary">{associationName}</Badge>
                )}
                {event.category && (
                  <Badge variant="outline">{event.category}</Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSubscriptionToggle}
                className={cn(
                  'h-10 w-10',
                  subscriptions.includes(event.id) && 'text-primary'
                )}
                title={subscriptions.includes(event.id) ? 'Retirer du calendrier' : 'Ajouter au calendrier'}
              >
                <CalendarDays
                  className={cn(
                    'h-6 w-6',
                    subscriptions.includes(event.id) && 'fill-current'
                  )}
                />
              </Button>
              {isAdmin && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive h-10 w-10"
                  onClick={handleDelete}
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {event.description && (
            <CardDescription className="text-base whitespace-pre-wrap">
              {event.description}
            </CardDescription>
          )}
          
          <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              <span className="font-medium">
                {format(new Date(event.event_date), "EEEE dd MMMM yyyy 'à' HH:mm", { locale: fr })}
              </span>
            </div>
            {event.price !== null && (
              <div className="flex items-center gap-2">
                <Euro className="h-5 w-5 text-primary" />
                <span className="font-medium">
                  {event.price === 0 ? 'Gratuit' : `${event.price}€`}
                </span>
              </div>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col gap-3">
          {/* Ticket link for upcoming events */}
          {!isPast && event.ticket_link && (
            <Button
              className="w-full gradient-red shadow-red"
              asChild
            >
              <a href={event.ticket_link} target="_blank" rel="noopener noreferrer">
                <Ticket className="h-4 w-4 mr-2" />
                Accéder à la billetterie
              </a>
            </Button>
          )}

          {/* Photo link for past events */}
          {isPast && (
            <>
              {isAdmin && (
                <div className="w-full space-y-2">
                  {editingPhotoLink ? (
                    <div className="flex gap-2">
                      <Input
                        type="url"
                        placeholder="Lien vers les photos..."
                        value={photoLinkValue}
                        onChange={(e) => setPhotoLinkValue(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        size="sm"
                        onClick={handleSavePhotoLink}
                        disabled={updateEvent.isPending}
                      >
                        {updateEvent.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Enregistrer'
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingPhotoLink(false);
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
                      onClick={() => {
                        setEditingPhotoLink(true);
                        setPhotoLinkValue(event.photo_link || '');
                      }}
                    >
                      {event.photo_link ? 'Modifier le lien photos' : 'Ajouter un lien photos'}
                    </Button>
                  )}
                </div>
              )}

              {event.photo_link && (
                <Button
                  variant="outline"
                  className="w-full border-primary text-primary hover:bg-accent"
                  asChild
                >
                  <a href={event.photo_link} target="_blank" rel="noopener noreferrer">
                    Voir les photos
                  </a>
                </Button>
              )}
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
