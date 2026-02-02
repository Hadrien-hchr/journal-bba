import { useState } from 'react';
import { useFriendsAttendingEvent } from '@/hooks/useCalendarEvents';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Users, Loader2 } from 'lucide-react';
import { Profile } from '@/hooks/useFriends';

interface FriendsAttendingButtonProps {
  eventId: string;
  eventTitle: string;
}

export function FriendsAttendingButton({ eventId, eventTitle }: FriendsAttendingButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { data: friends, isLoading } = useFriendsAttendingEvent(eventId);

  const getDisplayName = (p: Profile) => {
    if (p.first_name && p.last_name) return `${p.first_name} ${p.last_name}`;
    if (p.full_name) return p.full_name;
    return p.email?.split('@')[0] || 'Utilisateur';
  };

  const getInitials = (p: Profile) => {
    if (p.first_name && p.last_name) {
      return `${p.first_name[0]}${p.last_name[0]}`.toUpperCase();
    }
    if (p.full_name) {
      const parts = p.full_name.split(' ');
      return parts.length > 1 
        ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
        : p.full_name[0].toUpperCase();
    }
    return p.email?.[0]?.toUpperCase() || 'U';
  };

  // Don't show button if no friends or loading
  if (isLoading || !friends || friends.length === 0) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
        >
          <div className="flex -space-x-2">
            {friends.slice(0, 3).map((friend, index) => (
              <Avatar key={friend.id} className="h-6 w-6 border-2 border-background">
                <AvatarImage src={friend.avatar_url || undefined} />
                <AvatarFallback className="text-xs bg-muted">
                  {getInitials(friend)}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>
          {friends.length > 3 && (
            <span className="text-xs ml-1">+{friends.length - 3}</span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">
            Amis qui y vont
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{eventTitle}</p>
        </DialogHeader>
        <div className="space-y-3 mt-4">
          {friends.map((friend) => (
            <div key={friend.id} className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={friend.avatar_url || undefined} />
                <AvatarFallback>{getInitials(friend)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-sm">{getDisplayName(friend)}</p>
                <p className="text-xs text-muted-foreground">{friend.email}</p>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
