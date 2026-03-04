import { useNavigate } from 'react-router-dom';
import { useActivityFeed } from '@/hooks/useActivityFeed';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Bell, ChevronRight, PartyPopper, Newspaper, Video, Sparkles } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { fr } from 'date-fns/locale';

const typeConfig = {
  event: { icon: PartyPopper, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  article: { icon: Newspaper, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  interview: { icon: Video, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  home_post: { icon: Sparkles, color: 'text-pink-500', bg: 'bg-pink-500/10' },
};

function formatRelativeDate(dateStr: string) {
  const date = new Date(dateStr);
  if (isToday(date)) return `Aujourd'hui à ${format(date, 'HH:mm')}`;
  if (isYesterday(date)) return `Hier à ${format(date, 'HH:mm')}`;
  return format(date, "d MMMM yyyy", { locale: fr });
}

export default function Home() {
  const navigate = useNavigate();
  const { data: items, isLoading } = useActivityFeed();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 animate-fade-in">
      <div className="flex items-center gap-2 mb-2">
        <Bell className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-display font-bold">Fil d'actualité</h2>
      </div>

      {!items || items.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Bell className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Aucune activité récente</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map((item) => {
            const config = typeConfig[item.type];
            const Icon = config.icon;

            return (
              <Card
                key={`${item.type}-${item.id}`}
                className="cursor-pointer hover:bg-accent/50 transition-colors active:scale-[0.98]"
                onClick={() => navigate(item.link)}
              >
                <CardContent className="flex items-center gap-3 p-3">
                  <div className={`p-2 rounded-full flex-shrink-0 ${config.bg}`}>
                    <Icon className={`h-4 w-4 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-2">{item.message}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatRelativeDate(item.created_at)}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
