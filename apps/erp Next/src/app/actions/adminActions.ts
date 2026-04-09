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
