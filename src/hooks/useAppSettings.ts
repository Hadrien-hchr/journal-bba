import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface AppSetting {
  id: string;
  key: string;
  value: Record<string, any>;
  updated_at: string;
  updated_by: string | null;
}

export function useAppSetting(key: string) {
  return useQuery({
    queryKey: ['app-settings', key],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .eq('key', key)
        .single();

      if (error) throw error;
      return data as AppSetting;
    },
  });
}

export function useUpdateAppSetting() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: Record<string, any> }) => {
      const { data, error } = await supabase
        .from('app_settings')
        .update({ value, updated_at: new Date().toISOString(), updated_by: user?.id })
        .eq('key', key)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['app-settings', variables.key] });
    },
  });
}
