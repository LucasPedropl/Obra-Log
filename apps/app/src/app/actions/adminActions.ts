'use server';

import { createServerSupabaseClient } from '@/config/supabaseServer';

/**
 * Cria uma nova obra vinculada diretamente à empresa.
 */
export async function createConstructionSiteAdmin(data: {
	name: string;
	company_id: string;
}) {
	const supabase = await createServerSupabaseClient();
	const { data: result, error } = await supabase
		.from('construction_sites')
		.insert([data])
		.select()
		.single();

	if (error) throw error;
	return result;
}

/**
 * Lista todas as obras de uma empresa.
 */
export async function getConstructionSitesAdmin(company_id: string) {
	const supabase = await createServerSupabaseClient();
	const { data, error } = await supabase
		.from('construction_sites')
		.select('*')
		.eq('company_id', company_id)
		.order('created_at', { ascending: false });

	if (error) throw error;
	return data;
}

/**
 * Lista perfis de acesso da empresa.
 */
export async function getAccessProfilesAdmin(company_id: string) {
	const supabase = await createServerSupabaseClient();
	const { data, error } = await supabase
		.from('access_profiles')
		.select('*')
		.eq('company_id', company_id)
		.order('name', { ascending: true });
	if (error) throw error;
	return data;
}

/**
 * Cria um perfil de acesso para a empresa.
 */
export async function createAccessProfileAdmin(data: any) {
	const supabase = await createServerSupabaseClient();
	const { data: result, error } = await supabase
		.from('access_profiles')
		.insert([data])
		.select()
		.single();

	if (error) throw error;
	return result;
}

interface RawCompanyUser {
	id: string;
	status: string;
	role: string;
	profile_id: string | null;
	profiles: {
		full_name: string | null;
		email: string;
		last_login: string | null;
	} | null;
}

/**
 * Garante a existência do perfil Admin e busca usuários da empresa.
 */
export async function ensureAdminProfileAndFetchUsers(companyId: string) {
	const supabase = await createServerSupabaseClient();
	try {
		if (!companyId) return [];

		// 1. Verificar/Criar perfil padrão de Administrador se não existir
		const { data: adminProfile } = await supabase
			.from('access_profiles')
			.select('id')
			.eq('company_id', companyId)
			.eq('name', 'Administrador')
			.maybeSingle();

		if (!adminProfile) {
			await supabase.from('access_profiles').insert({
				company_id: companyId,
				name: 'Administrador',
				permissions: {
					ALL: { view: true, create: true, edit: true, delete: true },
				},
			});
		}

		// 2. Buscar usuários vinculados via company_users
		const { data: companyUsers, error } = await supabase
			.from('company_users')
			.select(
				`
				id,
                status,
                role,
                profile_id,
                profiles(full_name, email, last_login)
			`,
			)
			.eq('company_id', companyId);

		if (error) throw error;

		// 2.1 Buscar nomes dos perfis separadamente
		const profileIds = (companyUsers || [])
			.map((cu) => cu.profile_id)
			.filter(Boolean) as string[];
		const profilesMap: Record<string, string> = {};

		if (profileIds.length > 0) {
			const { data: profilesData } = await supabase
				.from('access_profiles')
				.select('id, name')
				.in('id', profileIds);

			profilesData?.forEach((p) => {
				profilesMap[p.id] = p.name;
			});
		}

		return (companyUsers as unknown as RawCompanyUser[]).map((cu) => ({
			id: cu.id,
			status: cu.status,
			role: cu.role,
			full_name: cu.profiles?.full_name || '',
			email: cu.profiles?.email || '',
			last_login: cu.profiles?.last_login || null,
			profile_name:
				cu.role === 'ADMIN'
					? 'Administrador da Empresa'
					: profilesMap[cu.profile_id!] || 'Sem Perfil',
		}));
	} catch (error: unknown) {
		console.error('Error fetching users:', error);
		return [];
	}
}

/**
 * Ações de Catálogo (Insumos, Equipamentos, etc)
 */
export async function createSupplyItemAdmin(data: any) {
	const supabase = await createServerSupabaseClient();
	const { data: result, error } = await supabase
		.from('catalogs')
		.insert([data]);
	if (error) throw error;
	return result;
}

export async function updateSupplyItemAdmin(id: string, data: any) {
	const supabase = await createServerSupabaseClient();
	const { error } = await supabase.from('catalogs').update(data).eq('id', id);
	if (error) throw error;
	return true;
}

export async function getSupplyItemsAdmin(company_id: string) {
	const supabase = await createServerSupabaseClient();
	const { data, error } = await supabase
		.from('catalogs')
		.select('*, categories(*), measurement_units(name, abbreviation)')
		.eq('company_id', company_id)
		.eq('is_rented_equipment', false)
		.eq('is_tool', false)
		.order('name', { ascending: true });

	if (error) throw error;
	return data;
}

export async function deleteSupplyItemAdmin(id: string, company_id: string) {
	const supabase = await createServerSupabaseClient();
	const { error } = await supabase
		.from('catalogs')
		.delete()
		.eq('id', id)
		.eq('company_id', company_id);
	if (error) throw error;
	return true;
}

export async function importCatalogsAdmin(items: any[]) {
	const supabase = await createServerSupabaseClient();
	if (!items.length) return { success: true };

	const { data, error } = await supabase
		.from('catalogs')
		.insert(items)
		.select();

	if (error) throw error;
	return { success: true, data };
}

export async function importCategoriesAdmin(items: any[]) {
	const supabase = await createServerSupabaseClient();
	if (!items.length) return { success: true };
	const { data, error } = await supabase
		.from('categories')
		.insert(items)
		.select();
	if (error) throw error;
	return { success: true, data };
}

export async function importUnitsAdmin(items: any[]) {
	const supabase = await createServerSupabaseClient();
	if (!items.length) return { success: true };
	const { data, error } = await supabase
		.from('measurement_units')
		.insert(items)
		.select();
	if (error) throw error;
	return { success: true, data };
}

/**
 * Categorias e Unidades
 */
export async function getCategoriesAdmin(company_id: string) {
	const supabase = await createServerSupabaseClient();
	const { data, error } = await supabase
		.from('categories')
		.select('*')
		.eq('company_id', company_id)
		.order('primary_category', { ascending: true });
	if (error) throw error;
	return data;
}

export async function createCategoryAdmin(data: any) {
	const supabase = await createServerSupabaseClient();
	const { data: result, error } = await supabase
		.from('categories')
		.insert([data])
		.select()
		.single();
	if (error) throw error;
	return result;
}

export async function getUnitsAdmin(company_id: string) {
	const supabase = await createServerSupabaseClient();
	const { data, error } = await supabase
		.from('measurement_units')
		.select('*')
		.eq('company_id', company_id)
		.order('name', { ascending: true });
	if (error) throw error;
	return data;
}

export async function createUnitAdmin(data: any) {
	const supabase = await createServerSupabaseClient();
	const { data: result, error } = await supabase
		.from('measurement_units')
		.insert([data])
		.select()
		.single();
	if (error) throw error;
	return result;
}

/**
 * Colaboradores
 */
export async function getCollaboratorsAdmin(company_id: string) {
	const supabase = await createServerSupabaseClient();
	const { data, error } = await supabase
		.from('collaborators')
		.select('*')
		.eq('company_id', company_id)
		.order('name', { ascending: true });
	if (error) throw error;
	return data;
}

export async function createCollaboratorAdmin(data: any) {
	const supabase = await createServerSupabaseClient();
	const { data: result, error } = await supabase
		.from('collaborators')
		.insert([data])
		.select()
		.single();
	if (error) throw error;
	return result;
}

export async function updateCollaboratorAdmin(id: string, data: any) {
	const supabase = await createServerSupabaseClient();
	const { data: result, error } = await supabase
		.from('collaborators')
		.update(data)
		.eq('id', id)
		.select()
		.single();
	if (error) throw error;
	return result;
}

export async function deleteCollaboratorAdmin(id: string, company_id: string) {
	const supabase = await createServerSupabaseClient();
	const { error } = await supabase
		.from('collaborators')
		.delete()
		.eq('id', id)
		.eq('company_id', company_id);
	if (error) throw error;
	return true;
}

export async function importCollaboratorsAdmin(items: any[]) {
	const supabase = await createServerSupabaseClient();
	if (!items.length) return { success: true };
	const { data, error } = await supabase
		.from('collaborators')
		.insert(items)
		.select();
	if (error) throw error;
	return { success: true, data };
}

/**
 * Vínculos Obra-Colaborador
 */
export async function getSiteCollaboratorsAdmin(siteId: string) {
	const supabase = await createServerSupabaseClient();
	const { data, error } = await supabase
		.from('site_collaborators')
		.select('id, collaborator_id, collaborators(name, role_title, cpf)')
		.eq('site_id', siteId);
	if (error) throw error;
	return data || [];
}

export async function addSiteCollaboratorsAdmin(
	siteId: string,
	collaboratorIds: string[],
) {
	const supabase = await createServerSupabaseClient();
	if (!collaboratorIds.length) return true;
	const payload = collaboratorIds.map((id) => ({
		site_id: siteId,
		collaborator_id: id,
	}));
	const { error } = await supabase.from('site_collaborators').insert(payload);
	if (error) throw error;
	return true;
}

/**
 * Inventário da Obra
 */
export async function getSiteInventoryAdmin(siteId: string) {
	const supabase = await createServerSupabaseClient();
	const { data, error } = await supabase
		.from('site_inventory')
		.select(
			'id, catalog_id, quantity, min_threshold, catalogs(name, code, categories(primary_category, secondary_category), measurement_units(abbreviation))',
		)
		.eq('site_id', siteId);
	if (error) throw error;
	return data || [];
}

export async function addInventoryItemsAdmin(siteId: string, items: any[]) {
	const supabase = await createServerSupabaseClient();
	if (!items.length) return true;
	const inventoryData = items.map((item) => ({
		site_id: siteId,
		catalog_id: item.catalogId,
		quantity: item.quantity,
		min_threshold: 0,
	}));
	const { data: results, error } = await supabase
		.from('site_inventory')
		.upsert(inventoryData, { onConflict: 'site_id,catalog_id' })
		.select('id, catalog_id');
	if (error) throw error;
	return true;
}

export async function getSiteToolsAdmin(siteId: string) {
	const supabase = await createServerSupabaseClient();
	const { data, error } = await supabase
		.from('site_tools')
		.select('inventory_id')
		.eq('site_id', siteId);
	if (error) throw error;
	return data || [];
}

export async function addSiteToolsAdmin(
	siteId: string,
	inventoryIds: string[],
) {
	const supabase = await createServerSupabaseClient();
	if (!inventoryIds.length) return true;
	const payload = inventoryIds.map((id) => ({
		site_id: siteId,
		inventory_id: id,
	}));
	const { error } = await supabase.from('site_tools').insert(payload);
	if (error) throw error;
	return true;
}

export async function getSiteEpisAdmin(siteId: string) {
	const supabase = await createServerSupabaseClient();
	const { data, error } = await supabase
		.from('site_epis')
		.select('inventory_id')
		.eq('site_id', siteId);
	if (error) throw error;
	return data || [];
}

export async function addSiteEpisAdmin(
	siteId: string,
	inventoryIds: string[],
) {
	const supabase = await createServerSupabaseClient();
	if (!inventoryIds.length) return true;
	const payload = inventoryIds.map((id) => ({
		site_id: siteId,
		inventory_id: id,
	}));
	const { error } = await supabase.from('site_epis').insert(payload);
	if (error) throw error;
	return true;
}

export async function getEPIItemsAdmin(siteId: string) {
	const supabase = await createServerSupabaseClient();

	// 1. Buscar site_epis
	const { data: siteEpisData, error: episErr } = await supabase
		.from('site_epis')
		.select('*')
		.eq('site_id', siteId);

	if (episErr) throw episErr;

	// 2. Buscar site_inventory
	const inventoryData = await getSiteInventoryAdmin(siteId);
	const inventoryMap = new Map(inventoryData.map((item: any) => [item.id, item]));

	return (siteEpisData || []).map((se: any) => {
		const inv = inventoryMap.get(se.inventory_id);
		const cat = inv?.catalogs;
		return {
			id: se.id,
			inventoryId: se.inventory_id,
			catalogId: inv?.catalog_id,
			name: cat?.name || 'EPI sem nome',
			category: cat?.categories?.primary_category || 'Sem Categoria',
			code: cat?.code || 'S/C',
			totalQuantity: inv?.quantity || 0,
			minThreshold: inv?.min_threshold || 0,
		};
	});
}

export async function getToolItemsAdmin(siteId: string) {
	const supabase = await createServerSupabaseClient();

	// 1. Buscar site_tools
	const { data: siteToolsData, error: toolsErr } = await supabase
		.from('site_tools')
		.select('*')
		.eq('site_id', siteId);

	if (toolsErr) throw toolsErr;

	// 2. Buscar site_inventory (usando a função nativa já testada)
	const inventoryData = await getSiteInventoryAdmin(siteId);
	const inventoryMap = new Map(inventoryData.map((item: any) => [item.id, item]));

	// 3. Buscar empréstimos ativos
	const { data: loansData, error: loansErr } = await supabase
		.from('tool_loans')
		.select('inventory_id, quantity')
		.eq('site_id', siteId)
		.eq('status', 'OPEN');

	if (loansErr) throw loansErr;

	const borrowedMap: Record<string, number> = {};
	(loansData || []).forEach((loan: any) => {
		const invId = loan.inventory_id;
		borrowedMap[invId] = (borrowedMap[invId] || 0) + (loan.quantity || 0);
	});

	return (siteToolsData || []).map((st: any) => {
		const inv = inventoryMap.get(st.inventory_id);
		const cat = inv?.catalogs;
		const totalQty = inv?.quantity || 0;
		const borrowedQty = borrowedMap[st.inventory_id] || 0;
		const availableQty = Math.max(0, totalQty - borrowedQty);

		return {
			id: st.id,
			inventoryId: st.inventory_id,
			name: cat?.name || 'Ferramenta sem nome',
			category: cat?.categories?.primary_category || 'Sem Categoria',
			code: cat?.code || 'S/C',
			totalQuantity: totalQty,
			availableQuantity: availableQty
		};
	});
}
