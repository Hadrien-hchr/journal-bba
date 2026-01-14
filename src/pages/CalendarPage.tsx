import { useEvents, useUserSubscriptions } from '@/hooks/useEvents';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, CalendarDays, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CalendarPage() {
  const { events, isLoading } = useEvents();
  const { subscriptions } = useUserSubscriptions();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const subscribedEvents = useMemo(() => {
    return events?.filter((event) => subscriptions.includes(event.id)) || [];
  }, [events, subscriptions]);

  const daysInMonth = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const getEventsForDay = (day: Date) => {
    return subscribedEvents.filter((event) =>
      isSameDay(new Date(event.event_date), day)
    );
  };

  const firstDayOffset = useMemo(() => {
    const firstDay = startOfMonth(currentMonth);
    return (firstDay.getDay() + 6) % 7; // Adjust for Monday start
  }, [currentMonth]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-display font-bold">Mon Calendrier</h2>
        <p className="text-muted-foreground text-sm">Vos événements enregistrés</p>
      </div>

      <Card className="shadow-soft">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <CardTitle className="text-lg font-display capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: fr })}
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
              <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for offset */}
            {Array.from({ length: firstDayOffset }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}
            
            {daysInMonth.map((day) => {
              const dayEvents = getEventsForDay(day);
              const isToday = isSameDay(day, new Date());
              const hasEvents = dayEvents.length > 0;

              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    'aspect-square flex flex-col items-center justify-center rounded-lg text-sm relative transition-colors',
                    isToday && 'bg-primary text-primary-foreground font-semibold',
                    !isToday && hasEvents && 'bg-accent font-medium',
                    !isToday && !hasEvents && 'hover:bg-secondary'
                  )}
                >
                  {format(day, 'd')}
                  {hasEvents && (
                    <div className="absolute bottom-1 flex gap-0.5">
                      {dayEvents.slice(0, 3).map((_, i) => (
                        <div
                          key={i}
                          className={cn(
                            'w-1 h-1 rounded-full',
                            isToday ? 'bg-primary-foreground' : 'bg-primary'
                          )}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming subscribed events */}
      <div className="space-y-3">
        <h3 className="text-lg font-display font-semibold">Mes événements</h3>
        
        {subscribedEvents.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-8 text-center">
              <CalendarDays className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-muted-foreground text-sm">
                Cochez des événements pour les ajouter à votre calendrier
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {subscribedEvents
              .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
              .map((event) => (
                <Card key={event.id} className="shadow-soft">
                  <CardContent className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-12 h-12 rounded-lg gradient-red flex flex-col items-center justify-center text-primary-foreground">
                        <span className="text-xs font-medium uppercase">
                          {format(new Date(event.event_date), 'MMM', { locale: fr })}
                        </span>
                        <span className="text-lg font-bold leading-none">
                          {format(new Date(event.event_date), 'd')}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{event.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(event.event_date), 'HH:mm', { locale: fr })}
                          {event.associations?.name && ` • ${event.associations.name}`}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
