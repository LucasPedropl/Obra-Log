-- ================================================================================
-- MODELAGEM DE DADOS RELACIONAL OTIMIZADA (SUPABASE) - OBRALOG & ADMIN
-- ================================================================================

-- 1. CORE E AUTENTICAÇÃO GERAL (Esquema Público SaaS)
CREATE TABLE public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR NOT NULL,
    full_name VARCHAR NOT NULL,
    is_super_admin BOOLEAN DEFAULT false
);

CREATE TABLE public.access_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name VARCHAR NOT NULL,
    permissions JSONB DEFAULT '[]'::jsonb,
    scope VARCHAR NOT NULL CHECK (scope IN ('ALL_SITES', 'SPECIFIC_SITES')),
    allowed_sites JSONB DEFAULT '[]'::jsonb
);

CREATE TABLE public.company_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES public.access_profiles(id) ON DELETE SET NULL,
    status VARCHAR NOT NULL CHECK (status IN ('ACTIVE', 'INACTIVE')) DEFAULT 'ACTIVE',
    UNIQUE(company_id, user_id)
);

-- 2. CONFIGURAÇÃO E AUTORIZAÇÃO
CREATE TABLE public.measurement_units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name VARCHAR NOT NULL,
    abbreviation VARCHAR NOT NULL
);

CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    entry_type VARCHAR NOT NULL CHECK (entry_type IN ('PRODUTO', 'SERVICO')),
    primary_category VARCHAR NOT NULL,
    secondary_category VARCHAR
);

CREATE TABLE public.catalogs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    unit_id UUID REFERENCES public.measurement_units(id) ON DELETE SET NULL,
    name VARCHAR NOT NULL,
    code VARCHAR,
    is_stock_controlled BOOLEAN DEFAULT true,
    min_threshold FLOAT DEFAULT 0,
    is_tool BOOLEAN DEFAULT false
);

-- 3. NÍVEL DE PRODUÇÃO (CANTEIROS DE OBRA)
CREATE TABLE public.construction_sites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name VARCHAR NOT NULL,
    status VARCHAR NOT NULL CHECK (status IN ('ACTIVE', 'FINISHED', 'PAUSED')) DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.collaborators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name VARCHAR NOT NULL,
    role_title VARCHAR NOT NULL,
    document VARCHAR,
    status VARCHAR NOT NULL CHECK (status IN ('ACTIVE', 'DISMISSED')) DEFAULT 'ACTIVE'
);

CREATE TABLE public.site_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES public.construction_sites(id) ON DELETE CASCADE,
    catalog_id UUID NOT NULL REFERENCES public.catalogs(id) ON DELETE CASCADE,
    quantity FLOAT DEFAULT 0,
    min_threshold FLOAT DEFAULT 0,
    UNIQUE(site_id, catalog_id)
);

CREATE TABLE public.site_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES public.construction_sites(id) ON DELETE CASCADE,
    inventory_id UUID NOT NULL REFERENCES public.site_inventory(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES public.users(id),
    type VARCHAR NOT NULL CHECK (type IN ('IN', 'OUT')),
    quantity_delta FLOAT NOT NULL,
    action_date TIMESTAMPTZ DEFAULT now(),
    reason VARCHAR NOT NULL CHECK (reason IN ('PURCHASE', 'WASTE', 'APPLICATION', 'TRANSFER', 'ADJUSTMENT'))
);

-- 4. CONTROLES ESPECIAIS (Vinculados aos Canteiros)
CREATE TABLE public.epi_withdrawals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES public.construction_sites(id) ON DELETE CASCADE,
    collaborator_id UUID NOT NULL REFERENCES public.collaborators(id) ON DELETE CASCADE,
    catalog_id UUID NOT NULL REFERENCES public.catalogs(id) ON DELETE CASCADE,
    withdrawn_by UUID NOT NULL REFERENCES public.users(id),
    quantity INTEGER NOT NULL,
    withdrawal_date TIMESTAMPTZ DEFAULT now(),
    notes TEXT
);

CREATE TABLE public.tool_loans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES public.construction_sites(id) ON DELETE CASCADE,
    collaborator_id UUID NOT NULL REFERENCES public.collaborators(id) ON DELETE CASCADE,
    inventory_id UUID NOT NULL REFERENCES public.site_inventory(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL,
    loan_date TIMESTAMPTZ DEFAULT now(),
    returned_date TIMESTAMPTZ,
    status VARCHAR NOT NULL CHECK (status IN ('OPEN', 'RETURNED', 'LOST')) DEFAULT 'OPEN',
    notes_on_return TEXT
);

CREATE TABLE public.rented_equipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES public.construction_sites(id) ON DELETE CASCADE,
    name VARCHAR NOT NULL,
    category VARCHAR NOT NULL,
    supplier VARCHAR NOT NULL,
    quantity INTEGER NOT NULL,
    entry_date DATE NOT NULL,
    exit_date DATE,
    status VARCHAR NOT NULL CHECK (status IN ('ACTIVE', 'RETURNED')) DEFAULT 'ACTIVE',
    entry_photos_json JSONB DEFAULT '[]'::jsonb,
    exit_photos_json JSONB DEFAULT '[]'::jsonb,
    description TEXT
);

-- ================================================================================
-- ROW LEVEL SECURITY (RLS) - ISOLAMENTO MULTI-TENANT
-- ================================================================================

-- Habilitar RLS em todas as tabelas (exceto users e companies que possuem lógicas próprias)
ALTER TABLE public.access_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.measurement_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.construction_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.epi_withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tool_loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rented_equipments ENABLE ROW LEVEL SECURITY;

-- Policy Base: Tenant Isolation via JWT Custom Claim (user_company_id)
-- Nota: O JWT deve ser assinado com o claim 'user_company_id' no momento do login ou troca de workspace.

CREATE POLICY "Tenant Isolation - access_profiles" ON public.access_profiles FOR ALL USING (company_id = (auth.jwt() ->> 'user_company_id')::uuid);
CREATE POLICY "Tenant Isolation - company_users" ON public.company_users FOR ALL USING (company_id = (auth.jwt() ->> 'user_company_id')::uuid);
CREATE POLICY "Tenant Isolation - measurement_units" ON public.measurement_units FOR ALL USING (company_id = (auth.jwt() ->> 'user_company_id')::uuid);
CREATE POLICY "Tenant Isolation - categories" ON public.categories FOR ALL USING (company_id = (auth.jwt() ->> 'user_company_id')::uuid);
CREATE POLICY "Tenant Isolation - catalogs" ON public.catalogs FOR ALL USING (company_id = (auth.jwt() ->> 'user_company_id')::uuid);
CREATE POLICY "Tenant Isolation - construction_sites" ON public.construction_sites FOR ALL USING (company_id = (auth.jwt() ->> 'user_company_id')::uuid);
CREATE POLICY "Tenant Isolation - collaborators" ON public.collaborators FOR ALL USING (company_id = (auth.jwt() ->> 'user_company_id')::uuid);

-- Para tabelas filhas de construction_sites, fazemos o JOIN implícito ou subquery para validar a company_id
CREATE POLICY "Tenant Isolation - site_inventory" ON public.site_inventory FOR ALL USING (
    site_id IN (SELECT id FROM public.construction_sites WHERE company_id = (auth.jwt() ->> 'user_company_id')::uuid)
);
CREATE POLICY "Tenant Isolation - site_movements" ON public.site_movements FOR ALL USING (
    site_id IN (SELECT id FROM public.construction_sites WHERE company_id = (auth.jwt() ->> 'user_company_id')::uuid)
);
CREATE POLICY "Tenant Isolation - epi_withdrawals" ON public.epi_withdrawals FOR ALL USING (
    site_id IN (SELECT id FROM public.construction_sites WHERE company_id = (auth.jwt() ->> 'user_company_id')::uuid)
);
CREATE POLICY "Tenant Isolation - tool_loans" ON public.tool_loans FOR ALL USING (
    site_id IN (SELECT id FROM public.construction_sites WHERE company_id = (auth.jwt() ->> 'user_company_id')::uuid)
);
CREATE POLICY "Tenant Isolation - rented_equipments" ON public.rented_equipments FOR ALL USING (
    site_id IN (SELECT id FROM public.construction_sites WHERE company_id = (auth.jwt() ->> 'user_company_id')::uuid)
);
