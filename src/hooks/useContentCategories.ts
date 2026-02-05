import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ContentCategory {
  id: string;
  name: string;
  section: string;
  logo_url: string | null;
  description: string | null;
  created_at: string;
}

export function useContentCategories(section: 'interviews' | 'information') {
  return useQuery({
    queryKey: ['content-categories', section],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content_categories')
        .select('*')
        .eq('section', section)
        .order('name');

      if (error) throw error;
      return data as ContentCategory[];
    },
  });
}

export function useCreateContentCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; section: string }) => {
      const { data: category, error } = await supabase
        .from('content_categories')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return category as ContentCategory;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['content-categories', variables.section] });
    },
  });
}

export function useUpdateContentCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { id: string; name?: string; logo_url?: string | null; description?: string | null }) => {
      const { id, ...updateData } = data;
      const { data: category, error } = await supabase
        .from('content_categories')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return category as ContentCategory;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-categories'] });
    },
  });
}

export function useDeleteContentCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('content_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-categories'] });
    },
  });
}
