-- Obra-Log: Schema Consolidado (Sem Instâncias/Filiais)
-- Hierarquia: Empresa (Company) -> Obra (Construction Site)

CREATE TABLE public.companies (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL,
  cnpj character varying,
  status character varying NOT NULL DEFAULT 'ACTIVE',
  owner_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT companies_pkey PRIMARY KEY (id)
);

CREATE TABLE public.company_users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role character varying NOT NULL DEFAULT 'USER' CHECK (role::text = ANY (ARRAY['ADMIN'::character varying::text, 'USER'::character varying::text])),
  profile_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT company_users_pkey PRIMARY KEY (id),
  CONSTRAINT company_users_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE,
  CONSTRAINT company_users_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT company_users_unique_user_company UNIQUE (company_id, user_id)
);

CREATE TABLE public.access_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  name character varying NOT NULL,
  permissions jsonb DEFAULT '{}'::jsonb,
  is_system_default boolean DEFAULT false,
  CONSTRAINT access_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT access_profiles_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE
);

CREATE TABLE public.construction_sites (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  name character varying NOT NULL,
  status character varying NOT NULL DEFAULT 'ACTIVE'::character varying CHECK (status::text = ANY (ARRAY['ACTIVE'::character varying::text, 'FINISHED'::character varying::text, 'PAUSED'::character varying::text])),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT construction_sites_pkey PRIMARY KEY (id),
  CONSTRAINT construction_sites_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE
);

-- Demais tabelas (catalogs, collaborators, site_inventory, etc.) seguem vinculadas a company_id ou site_id.
-- (Omitido para brevidade no resumo do schema, mas mantêm a lógica de empresa única)