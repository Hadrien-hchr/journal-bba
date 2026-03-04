import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ActivityItem {
  id: string;
  type: 'event' | 'article' | 'interview' | 'home_post';
  title: string;
  message: string;
  created_at: string;
  link: string;
}

export function useActivityFeed() {
  return useQuery({
    queryKey: ['activity-feed'],
    queryFn: async () => {
      const [eventsRes, articlesRes, interviewsRes, homePostsRes] = await Promise.all([
        supabase
          .from('events')
          .select('id, title, created_at, is_published')
          .or('is_published.eq.true,publish_at.lte.now()')
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('information')
          .select('id, title, created_at')
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('interviews')
          .select('id, title, created_at')
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('home_posts')
          .select('id, title, created_at')
          .order('created_at', { ascending: false })
          .limit(20),
      ]);

      const items: ActivityItem[] = [];

      eventsRes.data?.forEach((e) => {
        items.push({
          id: e.id,
          type: 'event',
          title: e.title,
          message: `🎉 Nouvel événement : ${e.title}`,
          created_at: e.created_at,
          link: `/events/${e.id}`,
        });
      });

      articlesRes.data?.forEach((a) => {
        items.push({
          id: a.id,
          type: 'article',
          title: a.title || 'Article',
          message: `📰 Nouvel article disponible : ${a.title || 'Sans titre'}`,
          created_at: a.created_at,
          link: '/info',
        });
      });

      interviewsRes.data?.forEach((i) => {
        items.push({
          id: i.id,
          type: 'interview',
          title: i.title,
          message: `🎬 Nouvelle interview : ${i.title}`,
          created_at: i.created_at,
          link: '/interviews',
        });
      });

      homePostsRes.data?.forEach((p) => {
        items.push({
          id: p.id,
          type: 'home_post',
          title: p.title || 'Post',
          message: `✨ Nouveau post : ${p.title || 'Sans titre'}`,
          created_at: p.created_at,
          link: '/',
        });
      });

      items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      return items.slice(0, 30);
    },
  });
}
