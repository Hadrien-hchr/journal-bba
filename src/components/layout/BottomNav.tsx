import { NavLink, useLocation } from 'react-router-dom';
import { CalendarDays, Home, Info, PlayCircle, PartyPopper } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/events', icon: PartyPopper, label: 'Événements' },
  { path: '/calendar', icon: CalendarDays, label: 'Calendrier' },
  { path: '/', icon: Home, label: 'Accueil' },
  { path: '/info', icon: Info, label: 'Infos' },
  { path: '/interviews', icon: PlayCircle, label: 'Interviews' },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-nav-background border-t border-border shadow-medium safe-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center justify-center w-full h-full transition-all duration-200',
                'active:scale-95'
              )}
            >
              <div
                className={cn(
                  'flex flex-col items-center gap-1 transition-all duration-200',
                  isActive ? 'text-nav-active' : 'text-nav-inactive'
                )}
              >
                <div
                  className={cn(
                    'p-1.5 rounded-xl transition-all duration-200',
                    isActive && 'bg-accent'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-5 w-5 transition-all duration-200',
                      isActive && 'scale-110'
                    )}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                </div>
                <span
                  className={cn(
                    'text-xs font-medium transition-all duration-200',
                    isActive && 'font-semibold'
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
