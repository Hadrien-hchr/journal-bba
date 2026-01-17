import { useEvents, useUserSubscriptions } from '@/hooks/useEvents';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, CalendarDays, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
export default function CalendarPage() {
  const {
    events,
    isLoading
  } = useEvents();
  const {
    subscriptions
  } = useUserSubscriptions();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const subscribedEvents = useMemo(() => {
    return events?.filter(event => subscriptions.includes(event.id)) || [];
  }, [events, subscriptions]);

  // All events for showing on selected day
  const allEventsForDay = useMemo(() => {
    if (!selectedDay || !events) return [];
    return events.filter(event => isSameDay(new Date(event.event_date), selectedDay));
  }, [selectedDay, events]);
  const daysInMonth = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({
      start,
      end
    });
  }, [currentMonth]);
  const getEventsForDay = (day: Date) => {
    return subscribedEvents.filter(event => isSameDay(new Date(event.event_date), day));
  };
  const getAllEventsCountForDay = (day: Date) => {
    return events?.filter(event => isSameDay(new Date(event.event_date), day)).length || 0;
  };
  const firstDayOffset = useMemo(() => {
    const firstDay = startOfMonth(currentMonth);
    return (firstDay.getDay() + 6) % 7; // Adjust for Monday start
  }, [currentMonth]);
  const handleDayClick = (day: Date) => {
    if (selectedDay && isSameDay(day, selectedDay)) {
      setSelectedDay(null); // Deselect if clicking same day
    } else {
      setSelectedDay(day);
    }
  };
  if (isLoading) {
    return <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>;
  }
  return <div className="p-4 space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-display font-bold">Mon Calendrier</h2>
        <p className="text-muted-foreground text-sm">
          {selectedDay ? `Événements du ${format(selectedDay, 'd MMMM yyyy', {
          locale: fr
        })}` : 'Cliquez sur un jour pour voir les événements'}
        </p>
      </div>

      <Card className="shadow-soft">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <CardTitle className="text-lg font-display capitalize">
              {format(currentMonth, 'MMMM yyyy', {
              locale: fr
            })}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                {day}
              </div>)}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for offset */}
            {Array.from({
            length: firstDayOffset
          }).map((_, i) => <div key={`empty-${i}`} className="aspect-square" />)}
            
            {daysInMonth.map(day => {
            const dayEvents = getEventsForDay(day);
            const allEventsCount = getAllEventsCountForDay(day);
            const isToday = isSameDay(day, new Date());
            const hasSubscribedEvents = dayEvents.length > 0;
            const hasAnyEvents = allEventsCount > 0;
            const isSelected = selectedDay && isSameDay(day, selectedDay);
            return <button key={day.toISOString()} onClick={() => handleDayClick(day)} className={cn('aspect-square flex flex-col items-center justify-center rounded-lg text-sm relative transition-colors cursor-pointer', isSelected && 'ring-2 ring-primary ring-offset-2', isToday && !isSelected && 'bg-primary text-primary-foreground font-semibold', !isToday && !isSelected && hasSubscribedEvents && 'bg-accent font-medium', !isToday && !isSelected && !hasSubscribedEvents && 'hover:bg-secondary', hasAnyEvents && 'hover:scale-105')}>
                  {format(day, 'd')}
                  {(hasSubscribedEvents || hasAnyEvents) && <div className="absolute bottom-1 flex gap-0.5">
                      {dayEvents.slice(0, 3).map((_, i) => <div key={i} className={cn('w-1 h-1 rounded-full', isToday ? 'bg-primary-foreground' : 'bg-primary')} />)}
                      {!hasSubscribedEvents && hasAnyEvents && <div className="w-1 h-1 rounded-full bg-primary border-4 border-solid border-primary" />}
                    </div>}
                </button>;
          })}
          </div>
        </CardContent>
      </Card>

      {/* Selected day events */}
      {selectedDay && <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-display font-semibold">
              {format(selectedDay, 'EEEE d MMMM', {
            locale: fr
          })}
            </h3>
            <Button variant="ghost" size="icon" onClick={() => setSelectedDay(null)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {allEventsForDay.length === 0 ? <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                <CalendarDays className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-muted-foreground text-sm">
                  Aucun événement ce jour
                </p>
              </CardContent>
            </Card> : <div className="space-y-2">
              {allEventsForDay.sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime()).map(event => {
          const isSubscribed = subscriptions.includes(event.id);
          return <Card key={event.id} className={cn('shadow-soft', isSubscribed && 'border-primary')}>
                      <CardContent className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className={cn('flex-shrink-0 w-12 h-12 rounded-lg flex flex-col items-center justify-center text-primary-foreground', isSubscribed ? 'gradient-red' : 'bg-muted')}>
                            <span className={cn('text-xs font-medium uppercase', !isSubscribed && 'text-muted-foreground')}>
                              {format(new Date(event.event_date), 'HH:mm', {
                      locale: fr
                    })}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{event.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {event.custom_association_name || event.associations?.name || 'Événement'}
                              {isSubscribed && <span className="ml-2 text-xs text-primary">• Dans votre calendrier</span>}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>;
        })}
            </div>}
        </div>}

      {/* Upcoming subscribed events (only show when no day selected) */}
      {!selectedDay && <div className="space-y-3">
          <h3 className="text-lg font-display font-semibold">Mes événements</h3>
          
          {subscribedEvents.length === 0 ? <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                <CalendarDays className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-muted-foreground text-sm">
                  Cochez des événements pour les ajouter à votre calendrier
                </p>
              </CardContent>
            </Card> : <div className="space-y-2">
              {subscribedEvents.sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime()).map(event => <Card key={event.id} className="shadow-soft">
                    <CardContent className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-12 h-12 rounded-lg gradient-red flex flex-col items-center justify-center text-primary-foreground">
                          <span className="text-xs font-medium uppercase">
                            {format(new Date(event.event_date), 'MMM', {
                    locale: fr
                  })}
                          </span>
                          <span className="text-lg font-bold leading-none">
                            {format(new Date(event.event_date), 'd')}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{event.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(event.event_date), 'HH:mm', {
                    locale: fr
                  })}
                            {(event.custom_association_name || event.associations?.name) && ` • ${event.custom_association_name || event.associations?.name}`}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>)}
            </div>}
        </div>}
    </div>;
}