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

		return companyUsers.map((cu: any) => ({
			id: cu.id,
			status: cu.status,
			full_name: cu.users?.full_name || '',
			email: cu.users?.email || '',
			last_login: cu.users?.last_login || null,
			profile: cu.access_profiles,
		}));
	} catch (error) {
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

export async function importCategoriesAdmin(data: any[]) {
	const { error } = await supabaseAdmin.from('categories').insert(data);
	if (error) throw error;
	return true;
}

export async function importUnitsAdmin(data: any[]) {
	const { error } = await supabaseAdmin
		.from('measurement_units')
		.insert(data);
	if (error) throw error;
	return true;
}

export async function importCollaboratorsAdmin(data: any[]) {
	const { error } = await supabaseAdmin.from('collaborators').insert(data);
	if (error) throw error;
	return true;
}

export async function importCatalogsAdmin(data: any[]) {
	const { error } = await supabaseAdmin.from('catalogs').insert(data);
	if (error) throw error;
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

	const epiData: any[] = [];
	const toolData: any[] = [];

	(inventoryResults || []).forEach((invRow: any) => {
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
			existingEpis?.map((e) => e.inventory_id) || [],
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
			existingTools?.map((t) => t.inventory_id) || [],
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
