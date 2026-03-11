import { NavLink, useLocation } from 'react-router-dom';
import { CalendarDays, Home, Info, PlayCircle, PartyPopper } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppSetting } from '@/hooks/useAppSettings';
import * as LucideIcons from 'lucide-react';
import { motion } from 'framer-motion';

const staticNavItems = [
  { path: '/calendar', icon: CalendarDays, label: 'Calendrier' },
  { path: '/events', icon: PartyPopper, label: 'Événements' },
  { path: '/', icon: Home, label: 'Accueil' },
];

const interviewsItem = { path: '/interviews', icon: PlayCircle, label: 'Interviews' };

export default function BottomNav() {
  const location = useLocation();
  const { data: infoTabSetting } = useAppSetting('info_tab');

  const tabSettings = infoTabSetting?.value as { name?: string; icon?: string } | undefined;
  const infoLabel = tabSettings?.name || 'Infos';
  const infoIconName = tabSettings?.icon || 'Info';
  const InfoIcon = (LucideIcons as any)[infoIconName] || Info;

  const navItems = [
    ...staticNavItems,
    { path: '/info', icon: InfoIcon, label: infoLabel },
    interviewsItem,
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-strong border-t border-border/50 safe-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center justify-center w-full h-full relative',
                'active:scale-95 transition-transform duration-200'
              )}
            >
              <div className="flex flex-col items-center gap-0.5 relative">
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute -inset-x-2 -inset-y-1 bg-primary/10 rounded-xl"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <div className="relative z-10">
                  <Icon
                    className={cn(
                      'h-5 w-5 transition-colors duration-200',
                      isActive ? 'text-primary' : 'text-muted-foreground'
                    )}
                    strokeWidth={isActive ? 2.5 : 1.8}
                  />
                </div>
                <span
                  className={cn(
                    'text-[10px] font-medium transition-colors duration-200 relative z-10',
                    isActive ? 'text-primary font-semibold' : 'text-muted-foreground'
                  )}
                >
                  {item.label}
                </span>
              </div>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
