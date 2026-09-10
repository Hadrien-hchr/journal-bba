-- 1. Text normalisation helper (case + accent insensitive)
CREATE OR REPLACE FUNCTION public.norm_text(t text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT lower(translate(coalesce(t, ''),
    'ÀÁÂÃÄÅàáâãäåÇçÈÉÊËèéêëÌÍÎÏìíîïÑñÒÓÔÕÖØòóôõöøÙÚÛÜùúûüÝýÿ',
    'AAAAAAaaaaaaCcEEEEeeeeIIIIiiiiNnOOOOOOooooooUUUUuuuuYyy'))
$$;

-- 2. Integrity: no self friend requests
ALTER TABLE public.friend_requests
  ADD CONSTRAINT friend_requests_no_self CHECK (from_user_id <> to_user_id) NOT VALID;

CREATE INDEX IF NOT EXISTS idx_friend_requests_pair ON public.friend_requests (from_user_id, to_user_id, status);
CREATE INDEX IF NOT EXISTS idx_friendships_pair ON public.friendships (user_id, friend_id);
CREATE INDEX IF NOT EXISTS idx_user_calendar_events_event ON public.user_calendar_events (event_id, user_id);

-- 3. Block uncontrolled direct inserts into friendships (RPC only)
DROP POLICY IF EXISTS "Users can insert friendships" ON public.friendships;
REVOKE INSERT ON public.friendships FROM authenticated;

-- 4. Secure search / suggestions RPC (public fields only, no emails)
CREATE OR REPLACE FUNCTION public.search_or_suggest_profiles(search_term text DEFAULT '', max_results integer DEFAULT 20)
RETURNS TABLE (id uuid, first_name text, last_name text, avatar_url text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH me AS (SELECT auth.uid() AS uid), q AS (SELECT public.norm_text(btrim(coalesce(search_term, ''))) AS term)
  SELECT p.id, p.first_name, p.last_name, p.avatar_url
  FROM public.profiles p, me, q
  WHERE me.uid IS NOT NULL
    AND p.id <> me.uid
    AND NOT EXISTS (
      SELECT 1 FROM public.friendships f
      WHERE (f.user_id = me.uid AND f.friend_id = p.id)
         OR (f.friend_id = me.uid AND f.user_id = p.id))
    AND NOT EXISTS (
      SELECT 1 FROM public.friend_requests r
      WHERE r.status = 'pending'
        AND ((r.from_user_id = me.uid AND r.to_user_id = p.id)
          OR (r.to_user_id = me.uid AND r.from_user_id = p.id)))
    AND (
      q.term = ''
      OR public.norm_text(coalesce(p.first_name, '') || ' ' || coalesce(p.last_name, '')) LIKE '%' || q.term || '%'
      OR public.norm_text(coalesce(p.full_name, '')) LIKE '%' || q.term || '%'
    )
  ORDER BY
    CASE
      WHEN q.term = '' THEN 3
      WHEN public.norm_text(coalesce(p.first_name, '')) LIKE q.term || '%' THEN 0
      WHEN public.norm_text(coalesce(p.last_name, '')) LIKE q.term || '%' THEN 1
      ELSE 2
    END,
    p.first_name NULLS LAST, p.last_name NULLS LAST
  LIMIT greatest(1, least(coalesce(max_results, 20), 50))
$$;

GRANT EXECUTE ON FUNCTION public.search_or_suggest_profiles(text, integer) TO authenticated;

-- 5. Send friend request (handles cross-requests and re-requests)
CREATE OR REPLACE FUNCTION public.send_friend_request(target_user uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  cross_id uuid;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF uid = target_user THEN RAISE EXCEPTION 'Cannot send a friend request to yourself'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = target_user) THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  IF EXISTS (SELECT 1 FROM public.friendships WHERE user_id = uid AND friend_id = target_user) THEN
    RETURN 'friends';
  END IF;

  SELECT r.id INTO cross_id
  FROM public.friend_requests r
  WHERE r.from_user_id = target_user AND r.to_user_id = uid AND r.status = 'pending'
  LIMIT 1;

  IF cross_id IS NOT NULL THEN
    UPDATE public.friend_requests SET status = 'accepted', updated_at = now() WHERE id = cross_id;
    PERFORM public.link_friendship(uid, target_user);
    RETURN 'friends';
  END IF;

  DELETE FROM public.friend_requests
  WHERE from_user_id = uid AND to_user_id = target_user AND status <> 'pending';

  IF NOT EXISTS (
    SELECT 1 FROM public.friend_requests
    WHERE from_user_id = uid AND to_user_id = target_user AND status = 'pending'
  ) THEN
    INSERT INTO public.friend_requests (from_user_id, to_user_id, status)
    VALUES (uid, target_user, 'pending');
  END IF;

  RETURN 'pending';
END;
$$;

GRANT EXECUTE ON FUNCTION public.send_friend_request(uuid) TO authenticated;

-- 6. Atomic bidirectional friendship creation
CREATE OR REPLACE FUNCTION public.link_friendship(a uuid, b uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF a = b THEN RETURN; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.friendships WHERE user_id = a AND friend_id = b) THEN
    INSERT INTO public.friendships (user_id, friend_id) VALUES (a, b);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.friendships WHERE user_id = b AND friend_id = a) THEN
    INSERT INTO public.friendships (user_id, friend_id) VALUES (b, a);
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.link_friendship(uuid, uuid) FROM public, anon, authenticated;

-- 7. Accept / reject / remove
CREATE OR REPLACE FUNCTION public.accept_friend_request(request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  req record;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT * INTO req FROM public.friend_requests WHERE id = request_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Request not found'; END IF;
  IF req.to_user_id <> uid THEN RAISE EXCEPTION 'Forbidden'; END IF;
  IF req.status <> 'pending' THEN RAISE EXCEPTION 'Request is no longer pending'; END IF;

  UPDATE public.friend_requests SET status = 'accepted', updated_at = now() WHERE id = request_id;
  PERFORM public.link_friendship(req.from_user_id, req.to_user_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_friend_request(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.reject_friend_request(request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  UPDATE public.friend_requests
  SET status = 'rejected', updated_at = now()
  WHERE id = request_id AND to_user_id = uid AND status = 'pending';
  IF NOT FOUND THEN RAISE EXCEPTION 'Forbidden or request not pending'; END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.reject_friend_request(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.remove_friend(friend uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  DELETE FROM public.friendships
  WHERE (user_id = uid AND friend_id = friend) OR (user_id = friend AND friend_id = uid);
  DELETE FROM public.friend_requests
  WHERE (from_user_id = uid AND to_user_id = friend) OR (from_user_id = friend AND to_user_id = uid);
END;
$$;

GRANT EXECUTE ON FUNCTION public.remove_friend(uuid) TO authenticated;

-- 8. Internal notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'friends_milestone',
  title text NOT NULL,
  message text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own notifications"
  ON public.notifications FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications (user_id, created_at DESC);

-- 9. Milestone dedupe table
CREATE TABLE IF NOT EXISTS public.event_friend_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  milestone integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, event_id, milestone)
);

GRANT SELECT ON public.event_friend_milestones TO authenticated;
GRANT ALL ON public.event_friend_milestones TO service_role;
ALTER TABLE public.event_friend_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own milestones"
  ON public.event_friend_milestones FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- 10. Milestone trigger on event signup
CREATE OR REPLACE FUNCTION public.notify_friends_event_milestone()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  f record;
  cnt integer;
  ev_title text;
BEGIN
  SELECT title INTO ev_title FROM public.events WHERE id = NEW.event_id;
  ev_title := coalesce(ev_title, 'cet événement');

  FOR f IN SELECT friend_id FROM public.friendships WHERE user_id = NEW.user_id LOOP
    CONTINUE WHEN EXISTS (
      SELECT 1 FROM public.user_calendar_events
      WHERE user_id = f.friend_id AND event_id = NEW.event_id
    );

    SELECT count(*) INTO cnt
    FROM public.user_calendar_events uce
    JOIN public.friendships fr ON fr.friend_id = uce.user_id AND fr.user_id = f.friend_id
    WHERE uce.event_id = NEW.event_id;

    CONTINUE WHEN cnt NOT IN (10, 25, 50, 100);

    BEGIN
      INSERT INTO public.event_friend_milestones (user_id, event_id, milestone)
      VALUES (f.friend_id, NEW.event_id, cnt);
    EXCEPTION WHEN unique_violation THEN
      CONTINUE;
    END;

    INSERT INTO public.notifications (user_id, event_id, type, title, message)
    VALUES (
      f.friend_id, NEW.event_id, 'friends_milestone', ev_title,
      'Déjà plus de ' || cnt || ' amis se rendent à ' || ev_title ||
      '. Prends vite ta place avant qu''il ne soit trop tard !'
    );
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_friends_event_milestone ON public.user_calendar_events;
CREATE TRIGGER trg_notify_friends_event_milestone
AFTER INSERT ON public.user_calendar_events
FOR EACH ROW EXECUTE FUNCTION public.notify_friends_event_milestone();