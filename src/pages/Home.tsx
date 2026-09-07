import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useActivityFeed } from '@/hooks/useActivityFeed';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Bell, ChevronRight, PartyPopper, Newspaper, Video, Sparkles } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { motion } from 'framer-motion';

const typeConfig = {
  event: { icon: PartyPopper, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20' },
  article: { icon: Newspaper, color: 'text-blue-600', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  interview: { icon: Video, color: 'text-violet-600', bg: 'bg-violet-500/10', border: 'border-violet-500/20' },
  home_post: { icon: Sparkles, color: 'text-amber-600', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
};

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.04 },
  },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { ease: [0.22, 1, 0.36, 1] as [number, number, number, number], duration: 0.4 } },
};

export default function Home() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation('content');
  const { data: items, isLoading } = useActivityFeed();
  const dateLocale = i18n.language === 'en' ? enUS : fr;

  function formatRelativeDate(dateStr: string) {
    const date = new Date(dateStr);
    if (isToday(date)) return t('home.relative.today', { time: format(date, 'HH:mm') });
    if (isYesterday(date)) return t('home.relative.yesterday', { time: format(date, 'HH:mm') });
    return format(date, 'd MMM yyyy', { locale: dateLocale });
  }

  const typeLabels: Record<string, string> = {
    event: t('home.types.event'),
    article: t('home.types.article'),
    interview: t('home.types.interview'),
    home_post: t('home.types.home_post'),
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-5">
      {/* Hero header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-2xl gradient-red p-5 shadow-red"
      >
        <div className="absolute inset-0 dot-pattern opacity-10" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
            <Bell className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-display font-bold text-primary-foreground">
              {t('home.title')}
            </h2>
            <p className="text-primary-foreground/75 text-xs">
              {t('home.subtitle')}
            </p>
          </div>
        </div>
      </motion.div>

      {!items || items.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Bell className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{t('home.empty')}</p>
          </CardContent>
        </Card>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-2"
        >
          {items.map((activityItem) => {
            const config = typeConfig[activityItem.type];
            const Icon = config.icon;

            return (
              <motion.div key={`${activityItem.type}-${activityItem.id}`} variants={item}>
                <Card
                  className="cursor-pointer border hover:shadow-medium transition-all duration-300 active:scale-[0.98] overflow-hidden group"
                  onClick={() => navigate(activityItem.link)}
                >
                  <CardContent className="flex items-center gap-3 p-3">
                    <div className={`p-2.5 rounded-xl flex-shrink-0 ${config.bg} border ${config.border} transition-transform duration-300 group-hover:scale-110`}>
                      <Icon className={`h-4 w-4 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-[10px] font-semibold uppercase tracking-wider ${config.color}`}>
                          {typeLabels[activityItem.type]}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {formatRelativeDate(activityItem.created_at)}
                        </span>
                      </div>
                      <p className="text-sm font-medium line-clamp-2 leading-snug">
                        {activityItem.message}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 transition-transform duration-300 group-hover:translate-x-1" />
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
