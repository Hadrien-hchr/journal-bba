import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Profile } from './useFriends';

export interface UserCalendarEvent {
  id: string;
  user_id: string;
  event_id: string;
  created_at: string;
}

export function useUserCalendarEvents() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-calendar-events', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('user_calendar_events')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      return data as UserCalendarEvent[];
    },
    enabled: !!user,
  });
}

export function useAddToCalendar() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (eventId: string) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('user_calendar_events')
        .insert({
          user_id: user.id,
          event_id: eventId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-calendar-events'] });
    },
  });
}

export function useRemoveFromCalendar() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (eventId: string) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('user_calendar_events')
        .delete()
        .eq('user_id', user.id)
        .eq('event_id', eventId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-calendar-events'] });
    },
  });
}

export function useFriendsAttendingEvent(eventId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['friends-attending', eventId, user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get user's friends
      const { data: friendships, error: friendError } = await supabase
        .from('friendships')
        .select('*')
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

      if (friendError) throw friendError;
      if (!friendships || friendships.length === 0) return [];

      const friendIds = friendships.map(f => 
        f.user_id === user.id ? f.friend_id : f.user_id
      );

      // Get friends who have this event in their calendar
      const { data: calendarEvents, error: calError } = await supabase
        .from('user_calendar_events')
        .select('user_id')
        .eq('event_id', eventId)
        .in('user_id', friendIds);

      if (calError) throw calError;
      if (!calendarEvents || calendarEvents.length === 0) return [];

      const attendingIds = calendarEvents.map(e => e.user_id);

      // Get profiles of attending friends
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', attendingIds);

      if (profileError) throw profileError;
      return profiles as Profile[];
    },
    enabled: !!user && !!eventId,
  });
}
