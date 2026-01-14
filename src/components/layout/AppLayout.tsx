import { ReactNode } from 'react';
import BottomNav from './BottomNav';
import Header from './Header';

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 pb-20 pt-16">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
