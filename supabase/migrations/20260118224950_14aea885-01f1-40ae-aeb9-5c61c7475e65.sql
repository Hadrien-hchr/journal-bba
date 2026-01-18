-- Add policy for admins to manage user roles
-- This allows admins to grant/revoke roles for other users

CREATE POLICY "Admins can manage all user roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add comment to has_role function explaining SECURITY DEFINER usage
COMMENT ON FUNCTION public.has_role(uuid, app_role) IS 
'Role check function using SECURITY DEFINER to bypass RLS on user_roles table.
This is necessary because RLS policies themselves call this function, and without
SECURITY DEFINER, the function could not query the user_roles table during policy evaluation.

Security measures in place:
- Fixed search_path = public (prevents search path attacks)
- Uses parameterized queries (no SQL injection risk)
- STABLE function (read-only, cacheable)
- Simple boolean check with no dynamic SQL

Any modifications to this function require security review.';