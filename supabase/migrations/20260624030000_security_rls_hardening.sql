-- SEC-01: Fix get_my_sites() to respect per-site access
-- SEC-07/08: Split ALL policies into per-command RBAC
-- SEC-09: Add RBAC to categories
-- SEC-26: measurement_units UPDATE/DELETE
-- SEC-27: site_epis UPDATE policy
-- SEC-29: Restrict profile email exposure for colleagues

-- =============================================================================
-- SEC-01: get_my_sites() must intersect check_user_site_access
-- =============================================================================
CREATE OR REPLACE FUNCTION public.get_my_sites()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT cs.id
  FROM public.construction_sites cs
  WHERE cs.company_id IN (SELECT public.get_my_companies())
    AND public.check_user_site_access(auth.uid(), cs.id)
$$;

-- =============================================================================
-- SEC-07: access_profiles — split ALL into INSERT/UPDATE/DELETE
-- =============================================================================
DROP POLICY IF EXISTS access_profiles_write_admin ON public.access_profiles;

CREATE POLICY access_profiles_insert ON public.access_profiles
  FOR INSERT
  WITH CHECK (check_user_resource_permission(auth.uid(), company_id, 'perfis', 'create'));

CREATE POLICY access_profiles_update ON public.access_profiles
  FOR UPDATE
  USING (check_user_resource_permission(auth.uid(), company_id, 'perfis', 'edit'))
  WITH CHECK (check_user_resource_permission(auth.uid(), company_id, 'perfis', 'edit'));

CREATE POLICY access_profiles_delete ON public.access_profiles
  FOR DELETE
  USING (check_user_resource_permission(auth.uid(), company_id, 'perfis', 'delete'));

-- =============================================================================
-- SEC-07: company_users — split ALL into INSERT/UPDATE/DELETE
-- =============================================================================
DROP POLICY IF EXISTS company_users_write_admin ON public.company_users;

CREATE POLICY company_users_insert ON public.company_users
  FOR INSERT
  WITH CHECK (check_user_resource_permission(auth.uid(), company_id, 'usuarios', 'create'));

CREATE POLICY company_users_update ON public.company_users
  FOR UPDATE
  USING (check_user_resource_permission(auth.uid(), company_id, 'usuarios', 'edit'))
  WITH CHECK (check_user_resource_permission(auth.uid(), company_id, 'usuarios', 'edit'));

CREATE POLICY company_users_delete ON public.company_users
  FOR DELETE
  USING (check_user_resource_permission(auth.uid(), company_id, 'usuarios', 'delete'));

-- =============================================================================
-- SEC-08: collaborators — split ALL into INSERT/UPDATE/DELETE
-- =============================================================================
DROP POLICY IF EXISTS collaborators_write ON public.collaborators;

CREATE POLICY collaborators_insert ON public.collaborators
  FOR INSERT
  WITH CHECK (check_user_resource_permission(auth.uid(), company_id, 'colaboradores', 'create'));

CREATE POLICY collaborators_update ON public.collaborators
  FOR UPDATE
  USING (check_user_resource_permission(auth.uid(), company_id, 'colaboradores', 'edit'))
  WITH CHECK (check_user_resource_permission(auth.uid(), company_id, 'colaboradores', 'edit'));

CREATE POLICY collaborators_delete ON public.collaborators
  FOR DELETE
  USING (check_user_resource_permission(auth.uid(), company_id, 'colaboradores', 'delete'));

-- =============================================================================
-- SEC-08: catalogs — split ALL into INSERT/UPDATE/DELETE
-- =============================================================================
DROP POLICY IF EXISTS catalogs_write ON public.catalogs;

CREATE POLICY catalogs_insert ON public.catalogs
  FOR INSERT
  WITH CHECK (check_user_resource_permission(auth.uid(), company_id, 'insumos', 'create'));

CREATE POLICY catalogs_update ON public.catalogs
  FOR UPDATE
  USING (check_user_resource_permission(auth.uid(), company_id, 'insumos', 'edit'))
  WITH CHECK (check_user_resource_permission(auth.uid(), company_id, 'insumos', 'edit'));

CREATE POLICY catalogs_delete ON public.catalogs
  FOR DELETE
  USING (check_user_resource_permission(auth.uid(), company_id, 'insumos', 'delete'));

-- =============================================================================
-- SEC-09: categories — add RBAC per operation
-- =============================================================================
DROP POLICY IF EXISTS categories_delete_policy ON public.categories;
DROP POLICY IF EXISTS categories_insert_policy ON public.categories;
DROP POLICY IF EXISTS categories_update_policy ON public.categories;
DROP POLICY IF EXISTS view_categories_policy ON public.categories;

CREATE POLICY categories_select ON public.categories
  FOR SELECT
  USING (check_user_resource_permission(auth.uid(), company_id, 'insumos', 'view'));

CREATE POLICY categories_insert ON public.categories
  FOR INSERT
  WITH CHECK (check_user_resource_permission(auth.uid(), company_id, 'insumos', 'create'));

CREATE POLICY categories_update ON public.categories
  FOR UPDATE
  USING (check_user_resource_permission(auth.uid(), company_id, 'insumos', 'edit'))
  WITH CHECK (check_user_resource_permission(auth.uid(), company_id, 'insumos', 'edit'));

CREATE POLICY categories_delete ON public.categories
  FOR DELETE
  USING (check_user_resource_permission(auth.uid(), company_id, 'insumos', 'delete'));

-- =============================================================================
-- SEC-26: measurement_units UPDATE/DELETE
-- =============================================================================
CREATE POLICY measurement_units_update ON public.measurement_units
  FOR UPDATE
  USING (company_id IN (SELECT get_my_companies()))
  WITH CHECK (company_id IN (SELECT get_my_companies()));

CREATE POLICY measurement_units_delete ON public.measurement_units
  FOR DELETE
  USING (company_id IN (SELECT get_my_companies()));

-- =============================================================================
-- SEC-27: site_epis UPDATE policy
-- =============================================================================
CREATE POLICY update_site_epis_policy ON public.site_epis
  FOR UPDATE
  USING (site_id IN (SELECT get_my_sites()))
  WITH CHECK (site_id IN (SELECT get_my_sites()));

-- =============================================================================
-- SEC-29: profiles — colleagues see masked email via view
-- =============================================================================
CREATE OR REPLACE VIEW public.profiles_colleague AS
SELECT
  id,
  full_name,
  CASE
    WHEN id = auth.uid() THEN email
    WHEN is_super_admin() THEN email
    ELSE regexp_replace(email, '(^.).*(@.*$)', '\1***\2')
  END AS email,
  is_super_admin,
  created_at
FROM public.profiles;

GRANT SELECT ON public.profiles_colleague TO authenticated;
