import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type NotifCategory = 'event' | 'interview' | 'information' | 'home';

export interface NotificationTemplate {
  id: string;
  category: NotifCategory;
  title: string;
  message: string;
  enabled: boolean;
}

export function useNotificationTemplates() {
  return useQuery({
    queryKey: ['notification-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notification_templates')
        .select('*')
        .order('category');
      if (error) throw error;
      return data as NotificationTemplate[];
    },
  });
}

export function useUpdateNotificationTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (t: Partial<NotificationTemplate> & { id: string }) => {
      const { error } = await supabase
        .from('notification_templates')
        .update({ title: t.title, message: t.message, enabled: t.enabled })
        .eq('id', t.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notification-templates'] }),
  });
}

export async function triggerPush(category: NotifCategory, title: string, url?: string) {
  return supabase.functions.invoke('send-push-notification', {
    body: { category, title, url },
  });
}
