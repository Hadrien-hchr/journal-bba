import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

export interface Event {
  id: string;
  title: string;
  description: string | null;
  association_id: string | null;
  custom_association_name: string | null;
  image_url: string | null;
  event_date: string;
  price: number | null;
  ticket_link: string | null;
  photo_link: string | null;
  is_published: boolean;
  publish_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  associations?: { name: string } | null;
}

export interface CreateEventData {
  title: string;
  description?: string;
  association_id?: string;
  custom_association_name?: string;
  image_url?: string;
  event_date: string;
  price?: number;
  ticket_link?: string;
  is_published: boolean;
  publish_at?: string;
}

export interface UpdateEventData {
  id: string;
  photo_link?: string | null;
}

export function useEvents() {
  const queryClient = useQueryClient();

  const { data: events, isLoading, error } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*, associations(name)')
        .order('event_date', { ascending: true });

      if (error) throw error;
      return data as Event[];
    },
  });

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('events-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['events'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return { events, isLoading, error };
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: CreateEventData) => {
      const { data: event, error } = await supabase
        .from('events')
        .insert({
          ...data,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return event;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventId: string) => {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateEventData) => {
      const { id, ...updateData } = data;
      const { data: event, error } = await supabase
        .from('events')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return event;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
}

export function useAssociations() {
  return useQuery({
    queryKey: ['associations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('associations')
        .select('*')
        .order('name');

      if (error) throw error;
      return data;
    },
  });
}

export function useUserSubscriptions() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: subscriptions, isLoading } = useQuery({
    queryKey: ['user-subscriptions', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('user_event_subscriptions')
        .select('event_id')
        .eq('user_id', user.id);

      if (error) throw error;
      return data.map((s) => s.event_id);
    },
    enabled: !!user,
  });

  const toggleSubscription = useMutation({
    mutationFn: async (eventId: string) => {
      if (!user) throw new Error('Not authenticated');

      const isSubscribed = subscriptions?.includes(eventId);

      if (isSubscribed) {
        const { error } = await supabase
          .from('user_event_subscriptions')
          .delete()
          .eq('user_id', user.id)
          .eq('event_id', eventId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_event_subscriptions')
          .insert({ user_id: user.id, event_id: eventId });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-subscriptions'] });
    },
  });

  return {
    subscriptions: subscriptions || [],
    isLoading,
    toggleSubscription,
  };
}
