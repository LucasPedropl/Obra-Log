-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.access_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  name character varying NOT NULL,
  permissions jsonb DEFAULT '[]'::jsonb,
  scope character varying NOT NULL CHECK (scope::text = ANY (ARRAY['ALL_SITES'::character varying, 'SPECIFIC_SITES'::character varying]::text[])),
  allowed_sites jsonb DEFAULT '[]'::jsonb,
  CONSTRAINT access_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT access_profiles_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id)
);
CREATE TABLE public.catalogs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  category_id uuid,
  unit_id uuid,
  name character varying NOT NULL,
  code character varying,
  is_stock_controlled boolean DEFAULT true,
  min_threshold double precision DEFAULT 0,
  is_tool boolean DEFAULT false,
  is_rented_equipment boolean DEFAULT false,
  CONSTRAINT catalogs_pkey PRIMARY KEY (id),
  CONSTRAINT catalogs_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id),
  CONSTRAINT catalogs_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id),
  CONSTRAINT catalogs_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.measurement_units(id)
);
CREATE TABLE public.categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid,
  entry_type character varying NOT NULL CHECK (entry_type::text = ANY (ARRAY['PRODUTO'::character varying, 'SERVICO'::character varying]::text[])),
  primary_category character varying NOT NULL,
  secondary_category character varying,
  CONSTRAINT categories_pkey PRIMARY KEY (id),
  CONSTRAINT categories_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id)
);
CREATE TABLE public.collaborators (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  name character varying NOT NULL,
  role_title character varying NOT NULL,
  document character varying,
  status character varying NOT NULL DEFAULT 'ACTIVE'::character varying CHECK (status::text = ANY (ARRAY['ACTIVE'::character varying, 'DISMISSED'::character varying]::text[])),
  cpf character varying,
  rg character varying,
  birth_date date,
  phone character varying,
  cellphone character varying,
  email character varying,
  cep character varying,
  street character varying,
  number character varying,
  neighborhood character varying,
  complement character varying,
  state character varying,
  city character varying,
  profile_id uuid,
  CONSTRAINT collaborators_pkey PRIMARY KEY (id),
  CONSTRAINT collaborators_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id)
);
CREATE TABLE public.companies (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL,
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  max_instances integer DEFAULT 1,
  parent_id uuid,
  CONSTRAINT companies_pkey PRIMARY KEY (id),
  CONSTRAINT companies_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.companies(id)
);
CREATE TABLE public.company_users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  user_id uuid NOT NULL,
  profile_id uuid,
  status character varying NOT NULL DEFAULT 'ACTIVE'::character varying CHECK (status::text = ANY (ARRAY['ACTIVE'::character varying, 'INACTIVE'::character varying]::text[])),
  CONSTRAINT company_users_pkey PRIMARY KEY (id),
  CONSTRAINT company_users_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id),
  CONSTRAINT company_users_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT company_users_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.access_profiles(id)
);
CREATE TABLE public.construction_sites (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  name character varying NOT NULL,
  status character varying NOT NULL DEFAULT 'ACTIVE'::character varying CHECK (status::text = ANY (ARRAY['ACTIVE'::character varying, 'FINISHED'::character varying, 'PAUSED'::character varying]::text[])),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT construction_sites_pkey PRIMARY KEY (id),
  CONSTRAINT construction_sites_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id)
);
CREATE TABLE public.epi_withdrawals (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL,
  collaborator_id uuid NOT NULL,
  catalog_id uuid NOT NULL,
  withdrawn_by uuid NOT NULL,
  quantity integer NOT NULL,
  withdrawal_date timestamp with time zone DEFAULT now(),
  notes text,
  photo_url text,
  CONSTRAINT epi_withdrawals_pkey PRIMARY KEY (id),
  CONSTRAINT epi_withdrawals_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.construction_sites(id),
  CONSTRAINT epi_withdrawals_collaborator_id_fkey FOREIGN KEY (collaborator_id) REFERENCES public.collaborators(id),
  CONSTRAINT epi_withdrawals_catalog_id_fkey FOREIGN KEY (catalog_id) REFERENCES public.catalogs(id),
  CONSTRAINT epi_withdrawals_withdrawn_by_fkey FOREIGN KEY (withdrawn_by) REFERENCES public.users(id)
);
CREATE TABLE public.measurement_units (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid,
  name character varying NOT NULL,
  abbreviation character varying NOT NULL,
  CONSTRAINT measurement_units_pkey PRIMARY KEY (id),
  CONSTRAINT measurement_units_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id)
);
CREATE TABLE public.rented_equipments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL,
  name character varying,
  category character varying,
  supplier character varying,
  quantity integer NOT NULL,
  entry_date timestamp with time zone NOT NULL,
  exit_date timestamp with time zone,
  status character varying NOT NULL DEFAULT 'ACTIVE'::character varying CHECK (status::text = ANY (ARRAY['ACTIVE'::character varying, 'RETURNED'::character varying]::text[])),
  entry_photos_json jsonb DEFAULT '[]'::jsonb,
  exit_photos_json jsonb DEFAULT '[]'::jsonb,
  description text,
  inventory_id uuid,
  entry_photos_url text,
  exit_photos_url text,
  CONSTRAINT rented_equipments_pkey PRIMARY KEY (id),
  CONSTRAINT rented_equipments_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.construction_sites(id),
  CONSTRAINT rented_equipments_inventory_id_fkey FOREIGN KEY (inventory_id) REFERENCES public.site_inventory(id)
);
CREATE TABLE public.site_collaborators (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL,
  collaborator_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT site_collaborators_pkey PRIMARY KEY (id),
  CONSTRAINT site_collaborators_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.construction_sites(id),
  CONSTRAINT site_collaborators_collaborator_id_fkey FOREIGN KEY (collaborator_id) REFERENCES public.collaborators(id)
);
CREATE TABLE public.site_epis (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL,
  inventory_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT site_epis_pkey PRIMARY KEY (id),
  CONSTRAINT site_epis_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.construction_sites(id),
  CONSTRAINT site_epis_inventory_id_fkey FOREIGN KEY (inventory_id) REFERENCES public.site_inventory(id)
);
CREATE TABLE public.site_inventory (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL,
  catalog_id uuid NOT NULL,
  quantity double precision DEFAULT 0,
  min_threshold double precision DEFAULT 0,
  CONSTRAINT site_inventory_pkey PRIMARY KEY (id),
  CONSTRAINT site_inventory_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.construction_sites(id),
  CONSTRAINT site_inventory_catalog_id_fkey FOREIGN KEY (catalog_id) REFERENCES public.catalogs(id)
);
CREATE TABLE public.site_movements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL,
  inventory_id uuid NOT NULL,
  created_by uuid NOT NULL,
  type character varying NOT NULL CHECK (type::text = ANY (ARRAY['IN'::character varying, 'OUT'::character varying]::text[])),
  quantity_delta double precision NOT NULL,
  action_date timestamp with time zone DEFAULT now(),
  reason character varying NOT NULL CHECK (reason::text = ANY (ARRAY['PURCHASE'::character varying, 'WASTE'::character varying, 'APPLICATION'::character varying, 'TRANSFER'::character varying, 'ADJUSTMENT'::character varying]::text[])),
  CONSTRAINT site_movements_pkey PRIMARY KEY (id),
  CONSTRAINT site_movements_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.construction_sites(id),
  CONSTRAINT site_movements_inventory_id_fkey FOREIGN KEY (inventory_id) REFERENCES public.site_inventory(id),
  CONSTRAINT site_movements_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);
CREATE TABLE public.site_tools (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL,
  inventory_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT site_tools_pkey PRIMARY KEY (id),
  CONSTRAINT site_tools_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.construction_sites(id),
  CONSTRAINT site_tools_inventory_id_fkey FOREIGN KEY (inventory_id) REFERENCES public.site_inventory(id)
);
CREATE TABLE public.tool_loans (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL,
  collaborator_id uuid NOT NULL,
  inventory_id uuid NOT NULL,
  quantity integer NOT NULL,
  loan_date timestamp with time zone DEFAULT now(),
  returned_date timestamp with time zone,
  status character varying NOT NULL DEFAULT 'OPEN'::character varying CHECK (status::text = ANY (ARRAY['OPEN'::character varying, 'RETURNED'::character varying, 'LOST'::character varying]::text[])),
  notes_on_return text,
  notes_on_loan text,
  photo_url text,
  return_photo_url text,
  CONSTRAINT tool_loans_pkey PRIMARY KEY (id),
  CONSTRAINT tool_loans_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.construction_sites(id),
  CONSTRAINT tool_loans_collaborator_id_fkey FOREIGN KEY (collaborator_id) REFERENCES public.collaborators(id),
  CONSTRAINT tool_loans_inventory_id_fkey FOREIGN KEY (inventory_id) REFERENCES public.site_inventory(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL,
  email character varying NOT NULL,
  full_name character varying NOT NULL,
  is_super_admin boolean DEFAULT false,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);