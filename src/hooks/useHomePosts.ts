import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

export interface HomePost {
  id: string;
  title: string | null;
  text_content: string | null;
  media_urls: string[];
  video_urls: string[];
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export function useHomePosts() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['home-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('home_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as HomePost[];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel('home-posts-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'home_posts' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['home-posts'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return { posts: data || [], isLoading, error };
}

export function useCreateHomePost() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: {
      title?: string;
      text_content?: string;
      media_urls?: string[];
      video_urls?: string[];
    }) => {
      const { data: post, error } = await supabase
        .from('home_posts')
        .insert({
          ...data,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return post;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['home-posts'] });
    },
  });
}

export function useDeleteHomePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('home_posts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['home-posts'] });
    },
  });
}
