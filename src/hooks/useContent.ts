import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

// Home Content
export interface HomeContent {
  id: string;
  content_type: 'text' | 'image' | 'video';
  content: string;
  position_x: number;
  position_y: number;
  order_index: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export function useHomeContent() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['home-content'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('home_content')
        .select('*')
        .order('order_index');

      if (error) throw error;
      return data as HomeContent[];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel('home-content-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'home_content' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['home-content'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return { content: data || [], isLoading, error };
}

export function useCreateHomeContent() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: Omit<HomeContent, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
      const { data: content, error } = await supabase
        .from('home_content')
        .insert({ ...data, created_by: user?.id })
        .select()
        .single();

      if (error) throw error;
      return content;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['home-content'] });
    },
  });
}

export function useDeleteHomeContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('home_content').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['home-content'] });
    },
  });
}

// Information
export interface Information {
  id: string;
  title: string | null;
  content: string;
  image_url: string | null;
  category_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export function useInformation() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['information'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('information')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Information[];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel('information-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'information' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['information'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return { information: data || [], isLoading, error };
}

export function useCreateInformation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: { title?: string; content: string; image_url?: string; category_id?: string }) => {
      const { data: info, error } = await supabase
        .from('information')
        .insert({ ...data, created_by: user?.id })
        .select()
        .single();

      if (error) throw error;
      return info;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['information'] });
    },
  });
}

export function useDeleteInformation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('information').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['information'] });
    },
  });
}

// Interviews
export interface Interview {
  id: string;
  title: string;
  video_url: string;
  thumbnail_url: string | null;
  description: string | null;
  category_id: string | null;
  created_by: string | null;
  created_at: string;
}

export function useInterviews() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['interviews'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('interviews')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Interview[];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel('interviews-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'interviews' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['interviews'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return { interviews: data || [], isLoading, error };
}

export function useCreateInterview() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: { title: string; video_url: string; thumbnail_url?: string; description?: string; category_id?: string }) => {
      const { data: interview, error } = await supabase
        .from('interviews')
        .insert({ ...data, created_by: user?.id })
        .select()
        .single();

      if (error) throw error;
      return interview;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interviews'] });
    },
  });
}

export function useDeleteInterview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('interviews').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interviews'] });
    },
  });
}
