'use server';

import { supabaseAdmin } from '@/config/supabaseAdmin';

export async function createConstructionSiteAdmin(data: {
	name: string;
	company_id: string;
}) {
	const { data: result, error } = await supabaseAdmin
		.from('construction_sites')
		.insert([data]);

	if (error) throw error;
	return result;
}

export async function getConstructionSitesAdmin(company_id: string) {
	const { data, error } = await supabaseAdmin
		.from('construction_sites')
		.select('*')
		.eq('company_id', company_id)
		.order('created_at', { ascending: false });

	if (error) throw error;
	return data;
}

interface RawCompanyUser {
	id: string;
	status: string;
	users: {
		full_name: string | null;
		email: string;
		last_login: string | null;
	} | null;
	access_profiles: {
		name: string;
	} | null;
}

export async function ensureAdminProfileAndFetchUsers(companyId: string) {
	try {
		if (!companyId) return [];

		const { data: adminProfile, error: profileErr } = await supabaseAdmin
			.from('access_profiles')
			.select('id')
			.eq('company_id', companyId)
			.eq('name', 'Administrador')
			.single();

		let profileId = adminProfile?.id;

		if (!profileId) {
			const { data: newProfile } = await supabaseAdmin
				.from('access_profiles')
				.insert({
					company_id: companyId,
					name: 'Administrador',
					permissions: ['ALL'],
					scope: 'ALL_SITES',
				})
				.select('id')
				.single();
			profileId = newProfile?.id;
		}

		if (profileId) {
			await supabaseAdmin
				.from('company_users')
				.update({ profile_id: profileId, status: 'ACTIVE' })
				.eq('company_id', companyId)
				.is('profile_id', null);
		}

		const { data: companyUsers, error } = await supabaseAdmin
			.from('company_users')
			.select(
				`
				id,
                status,
                users (full_name, email, last_login),
                access_profiles (name)
			`,
			)
			.eq('company_id', companyId);

		if (error) {
			console.error('Error fetching users:', error);
			return [];
		}

		return (companyUsers as unknown as RawCompanyUser[]).map((cu) => ({
			id: cu.id,
			status: cu.status,
			full_name: cu.users?.full_name || '',
			email: cu.users?.email || '',
			last_login: cu.users?.last_login || null,
			profile: cu.access_profiles,
		}));
	} catch (error: unknown) {
		console.error('Error fetching users:', error);
		return [];
	}
}

export async function createSupplyItemAdmin(data: {
	name: string;
	category_id: string;
	unit_id: string;
	min_threshold: number;
	is_stock_controlled: boolean;
	company_id: string;
}) {
	const { data: result, error } = await supabaseAdmin
		.from('catalogs')
		.insert([data]);

	if (error) throw error;
	return result;
}

export async function getSupplyItemsAdmin(company_id: string) {
	const { data, error } = await supabaseAdmin
		.from('catalogs')
		.select('*, measurement_units(abbreviation)')
		.eq('company_id', company_id)
		.order('name', { ascending: true });

	if (error) throw error;
	return data;
}

export async function createCategoryAdmin(data: {
	company_id: string;
	primary_category: string;
	entry_type: string;
}) {
	const { data: result, error } = await supabaseAdmin
		.from('categories')
		.insert([data])
		.select('id')
		.single();

	if (error) throw error;
	return result.id;
}

export async function createUnitAdmin(data: {
	company_id: string;
	name: string;
	abbreviation: string;
}) {
	const { data: result, error } = await supabaseAdmin
		.from('measurement_units')
		.insert([data])
		.select('id')
		.single();

	if (error) throw error;
	return result.id;
}

export async function getCategoriesAdmin(company_id: string) {
	const { data, error } = await supabaseAdmin
		.from('categories')
		.select('*')
		.eq('company_id', company_id)
		.order('primary_category', { ascending: true });
	if (error) throw error;
	return data;
}

export async function getUnitsAdmin(company_id: string) {
	const { data, error } = await supabaseAdmin
		.from('measurement_units')
		.select('*')
		.eq('company_id', company_id)
		.order('name', { ascending: true });
	if (error) throw error;
	return data;
}

export async function createCollaboratorAdmin(data: {
	company_id: string;
	name: string;
	role_title: string;
	cpf?: string | null;
	rg?: string | null;
	birth_date?: string | null;
	cellphone?: string | null;
	email?: string | null;
	cep?: string | null;
	street?: string | null;
	number?: string | null;
	neighborhood?: string | null;
}) {
	const { data: result, error } = await supabaseAdmin
		.from('collaborators')
		.insert([data]);

	if (error) throw error;
	return result;
}

export async function getCollaboratorsAdmin(company_id: string) {
	const { data, error } = await supabaseAdmin
		.from('collaborators')
		.select('*')
		.eq('company_id', company_id)
		.order('name', { ascending: true });
	if (error) throw error;
	return data;
}

export async function deleteCollaboratorAdmin(id: string, company_id: string) {
	const { error } = await supabaseAdmin
		.from('collaborators')
		.delete()
		.eq('id', id)
		.eq('company_id', company_id);
	if (error) throw error;
	return true;
}

export async function deleteSupplyItemAdmin(id: string, company_id: string) {
	const { error } = await supabaseAdmin
		.from('catalogs')
		.delete()
		.eq('id', id)
		.eq('company_id', company_id);
	if (error) throw error;
	return true;
}

export async function importCategoriesAdmin(data: Record<string, unknown>[]) {
	const { error } = await supabaseAdmin.from('categories').insert(data);
	if (error) throw error;
	return true;
}

export async function importUnitsAdmin(data: Record<string, unknown>[]) {
	const { error } = await supabaseAdmin
		.from('measurement_units')
		.insert(data);
	if (error) throw error;
	return true;
}

export async function importCollaboratorsAdmin(data: Record<string, unknown>[]) {
	const { error } = await supabaseAdmin.from('collaborators').insert(data);
	if (error) throw error;
	return true;
}

export async function importCatalogsAdmin(data: Record<string, unknown>[]) {
	const { error } = await supabaseAdmin.from('catalogs').insert(data);
	if (error) throw error;
	return true;
}

export async function getSiteCollaboratorsAdmin(siteId: string) {
	const { data, error } = await supabaseAdmin
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
	if (!collaboratorIds.length) return true;

	const payload = collaboratorIds.map((id) => ({
		site_id: siteId,
		collaborator_id: id,
	}));

	const { error } = await supabaseAdmin
		.from('site_collaborators')
		.insert(payload);

	if (error) {
		console.error(error);
		throw error;
	}
	return true;
}

export async function getSiteInventoryAdmin(siteId: string) {
	const { data, error } = await supabaseAdmin
		.from('site_inventory')
		.select(
			'id, catalog_id, quantity, min_threshold, catalogs(name, categories(primary_category, secondary_category), measurement_units(abbreviation))',
		)
		.eq('site_id', siteId);

	if (error) throw error;
	return data || [];
}

interface RawInventoryResultAdmin {
	id: string;
	catalog_id: string;
}

export async function addInventoryItemsAdmin(
	siteId: string,
	items: Array<{
		catalogId: string;
		quantity: number;
		category: 'NONE' | 'TOOL' | 'EPI';
	}>,
) {
	if (!items.length) return true;

	const inventoryData = items.map((item) => ({
		site_id: siteId,
		catalog_id: item.catalogId,
		quantity: item.quantity,
		min_threshold: 0,
	}));

	const { data: inventoryResults, error: inventoryError } =
		await supabaseAdmin
			.from('site_inventory')
			.upsert(inventoryData, { onConflict: 'site_id,catalog_id' })
			.select('id, catalog_id');

	if (inventoryError) throw inventoryError;

	const epiData: { site_id: string; inventory_id: string }[] = [];
	const toolData: { site_id: string; inventory_id: string }[] = [];

	(inventoryResults as unknown as RawInventoryResultAdmin[] || []).forEach((invRow) => {
		const originalItem = items.find(
			(i) => i.catalogId === invRow.catalog_id,
		);
		if (originalItem?.category === 'EPI') {
			epiData.push({ site_id: siteId, inventory_id: invRow.id });
		} else if (originalItem?.category === 'TOOL') {
			toolData.push({ site_id: siteId, inventory_id: invRow.id });
		}
	});

	if (epiData.length > 0) {
		// Obter inventários de EPI que já existem nesta obra
		const { data: existingEpis } = await supabaseAdmin
			.from('site_epis')
			.select('inventory_id')
			.in(
				'inventory_id',
				epiData.map((e) => e.inventory_id),
			);

		const existingEpiIds = new Set(
			existingEpis?.map((e: any) => e.inventory_id) || [],
		);
		const newEpis = epiData.filter(
			(e) => !existingEpiIds.has(e.inventory_id),
		);

		if (newEpis.length > 0) {
			const { error: epiError } = await supabaseAdmin
				.from('site_epis')
				.insert(newEpis);
			if (epiError) throw epiError;
		}
	}

	if (toolData.length > 0) {
		// Obter inventários de Ferramentas que já existem nesta obra
		const { data: existingTools } = await supabaseAdmin
			.from('site_tools')
			.select('inventory_id')
			.in(
				'inventory_id',
				toolData.map((t) => t.inventory_id),
			);

		const existingToolIds = new Set(
			existingTools?.map((t: any) => t.inventory_id) || [],
		);
		const newTools = toolData.filter(
			(t) => !existingToolIds.has(t.inventory_id),
		);

		if (newTools.length > 0) {
			const { error: toolError } = await supabaseAdmin
				.from('site_tools')
				.insert(newTools);
			if (toolError) throw toolError;
		}
	}

	return true;
}

export async function getSiteToolsAdmin(siteId: string) {
	const { data, error } = await supabaseAdmin
		.from('site_tools')
		.select('inventory_id')
		.eq('site_id', siteId);
	if (error) throw error;
	return data || [];
}

export async function getSiteEpisAdmin(siteId: string) {
	const { data, error } = await supabaseAdmin
		.from('site_epis')
		.select('inventory_id')
		.eq('site_id', siteId);
	if (error) throw error;
	return data || [];
}

export async function addSiteToolsAdmin(
	siteId: string,
	inventoryIds: string[],
) {
	const inserts = inventoryIds.map((id) => ({
		site_id: siteId,
		inventory_id: id,
	}));
	const { error } = await supabaseAdmin.from('site_tools').insert(inserts);
	if (error) throw error;
	return true;
}

export async function addSiteEpisAdmin(siteId: string, inventoryIds: string[]) {
	const inserts = inventoryIds.map((id) => ({
		site_id: siteId,
		inventory_id: id,
	}));
	const { error } = await supabaseAdmin.from('site_epis').insert(inserts);
	if (error) throw error;
	return true;
}

interface RawToolItemAdmin {
	id: string;
	inventory_id: string;
	site_inventory: {
		quantity: number;
		catalogs: {
			name: string;
			code: string | null;
			categories: {
				primary_category: string;
			} | null;
		} | null;
	} | null;
}

export async function getToolItemsAdmin(siteId: string) {
	const { data: toolsData, error: toolsError } = await supabaseAdmin
		.from('site_tools')
		.select(
			'id, inventory_id, site_inventory(quantity, catalogs(name, code, categories(primary_category)))',
		)
		.eq('site_id', siteId);
	if (toolsError) throw toolsError;

	const { data: loansData, error: loansError } = await supabaseAdmin
		.from('tool_loans')
		.select('inventory_id, quantity')
		.eq('site_id', siteId)
		.eq('status', 'OPEN');
	if (loansError) throw loansError;

	const loansByInventory = (loansData || []).reduce((acc: Record<string, number>, loan: any) => {
		acc[loan.inventory_id] = (acc[loan.inventory_id] || 0) + loan.quantity;
		return acc;
	}, {});

	return (toolsData as unknown as RawToolItemAdmin[] || []).map((t) => {
		const totalQty = t.site_inventory?.quantity || 0;
		const loanedQty = loansByInventory[t.inventory_id] || 0;
		const catalog = t.site_inventory?.catalogs;

		return {
			id: t.id,
			inventoryId: t.inventory_id,
			name: catalog?.name || 'Ferramenta Desconhecida',
			category: catalog?.categories?.primary_category || 'Sem Categoria',
			code: catalog?.code || '-',
			totalQuantity: totalQty,
			availableQuantity: Math.max(0, totalQty - loanedQty),
		};
	});
}

interface RawEpiItemAdmin {
	id: string;
	inventory_id: string;
	site_inventory: {
		catalog_id: string;
		quantity: number;
		min_threshold: number;
		catalogs: {
			name: string;
			code: string | null;
			categories: {
				primary_category: string;
			} | null;
		} | null;
	} | null;
}

export async function getEPIItemsAdmin(siteId: string) {
	const { data: episData, error: episError } = await supabaseAdmin
		.from('site_epis')
		.select(
			'id, inventory_id, site_inventory(catalog_id, quantity, min_threshold, catalogs(name, code, categories(primary_category)))',
		)
		.eq('site_id', siteId);
	if (episError) throw episError;

	return (episData as unknown as RawEpiItemAdmin[] || []).map((t) => {
		const totalQty = t.site_inventory?.quantity || 0;
		const catalog = t.site_inventory?.catalogs;

		return {
			id: t.id,
			inventoryId: t.inventory_id,
			catalogId: t.site_inventory?.catalog_id,
			name: catalog?.name || 'EPI Desconhecido',
			category: catalog?.categories?.primary_category || 'Sem Categoria',
			code: catalog?.code || '-',
			totalQuantity: totalQty,
			minThreshold: t.site_inventory?.min_threshold || 0,
		};
	});
}
