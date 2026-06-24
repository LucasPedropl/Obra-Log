'use server';

import { z } from 'zod';
import { createServerSupabaseClient } from '@/config/supabaseServer';
import { safeLogError } from '@/lib/safeLog';
import { supplyItemSchema } from '@/features/insumos/schemas/supplyItemSchema';
import {
	assertCompanyResourcePermission,
	getAuthenticatedUserId,
	getValidatedCompanyId,
} from './_helpers';

const companyIdSchema = z.string().uuid('ID da empresa inválido');
const catalogIdSchema = z.string().uuid('ID do insumo inválido');

const supplyItemInsertSchema = supplyItemSchema.extend({
	company_id: z.string().uuid(),
});

const categoryInsertSchema = z.object({
	company_id: z.string().uuid(),
	primary_category: z.string().min(1, 'Categoria primária é obrigatória'),
	secondary_category: z.string().nullable().optional(),
	entry_type: z.enum(['PRODUTO', 'SERVICO']).optional(),
});

const unitInsertSchema = z.object({
	company_id: z.string().uuid(),
	name: z.string().min(1, 'Nome da unidade é obrigatório'),
	abbreviation: z.string().min(1, 'Abreviação é obrigatória'),
});

function formatZodError(error: unknown): never {
	if (error instanceof z.ZodError) {
		throw new Error(error.issues[0]?.message ?? 'Dados inválidos');
	}
	throw error;
}

export async function createSupplyItemAdmin(
	data: z.infer<typeof supplyItemInsertSchema>,
) {
	try {
		const payload = supplyItemInsertSchema.parse(data);
		const userId = await getAuthenticatedUserId();
		const companyId = await getValidatedCompanyId(userId, payload.company_id);
		await assertCompanyResourcePermission(userId, companyId, 'insumos', 'create');

		const supabase = await createServerSupabaseClient();
		const { data: result, error } = await supabase
			.from('catalogs')
			.insert([{ ...payload, company_id: companyId }]);
		if (error) throw error;
		return result;
	} catch (error: unknown) {
		safeLogError('createSupplyItemAdmin', error);
		formatZodError(error);
	}
}

export async function updateSupplyItemAdmin(
	id: string,
	data: z.infer<typeof supplyItemInsertSchema>,
) {
	try {
		const catalogId = catalogIdSchema.parse(id);
		const payload = supplyItemInsertSchema.parse(data);
		const userId = await getAuthenticatedUserId();
		const companyId = await getValidatedCompanyId(userId, payload.company_id);
		await assertCompanyResourcePermission(userId, companyId, 'insumos', 'edit');

		const supabase = await createServerSupabaseClient();
		const { error } = await supabase
			.from('catalogs')
			.update({ ...payload, company_id: companyId })
			.eq('id', catalogId)
			.eq('company_id', companyId);
		if (error) throw error;
		return true;
	} catch (error: unknown) {
		safeLogError('updateSupplyItemAdmin', error);
		formatZodError(error);
	}
}

export async function getSupplyItemsAdmin(company_id: string) {
	try {
		const userId = await getAuthenticatedUserId();
		const companyId = await getValidatedCompanyId(userId, companyIdSchema.parse(company_id));
		await assertCompanyResourcePermission(userId, companyId, 'insumos', 'view');

		const supabase = await createServerSupabaseClient();
		const { data, error } = await supabase
			.from('catalogs')
			.select('*, categories(*), measurement_units(name, abbreviation)')
			.eq('company_id', companyId)
			.eq('is_rented_equipment', false)
			.eq('is_tool', false)
			.order('name', { ascending: true });

		if (error) throw error;
		return data;
	} catch (error: unknown) {
		safeLogError('getSupplyItemsAdmin', error);
		formatZodError(error);
	}
}

export async function deleteSupplyItemAdmin(id: string, company_id: string) {
	try {
		const catalogId = catalogIdSchema.parse(id);
		const userId = await getAuthenticatedUserId();
		const companyId = await getValidatedCompanyId(userId, companyIdSchema.parse(company_id));
		await assertCompanyResourcePermission(userId, companyId, 'insumos', 'delete');

		const supabase = await createServerSupabaseClient();
		const { error } = await supabase
			.from('catalogs')
			.delete()
			.eq('id', catalogId)
			.eq('company_id', companyId);
		if (error) throw error;
		return true;
	} catch (error: unknown) {
		safeLogError('deleteSupplyItemAdmin', error);
		formatZodError(error);
	}
}

export async function getCategoriesAdmin(company_id: string) {
	try {
		const userId = await getAuthenticatedUserId();
		const companyId = await getValidatedCompanyId(userId, companyIdSchema.parse(company_id));
		await assertCompanyResourcePermission(userId, companyId, 'insumos', 'view');

		const supabase = await createServerSupabaseClient();
		const { data, error } = await supabase
			.from('categories')
			.select('*')
			.eq('company_id', companyId)
			.order('primary_category', { ascending: true });
		if (error) throw error;
		return data;
	} catch (error: unknown) {
		safeLogError('getCategoriesAdmin', error);
		formatZodError(error);
	}
}

export async function createCategoryAdmin(
	data: z.infer<typeof categoryInsertSchema>,
) {
	try {
		const payload = categoryInsertSchema.parse(data);
		const userId = await getAuthenticatedUserId();
		const companyId = await getValidatedCompanyId(userId, payload.company_id);
		await assertCompanyResourcePermission(userId, companyId, 'insumos', 'create');

		const supabase = await createServerSupabaseClient();
		const { data: result, error } = await supabase
			.from('categories')
			.insert([{ ...payload, company_id: companyId }])
			.select()
			.single();
		if (error) throw error;
		return result;
	} catch (error: unknown) {
		safeLogError('createCategoryAdmin', error);
		formatZodError(error);
	}
}

export async function getUnitsAdmin(company_id: string) {
	try {
		const userId = await getAuthenticatedUserId();
		const companyId = await getValidatedCompanyId(userId, companyIdSchema.parse(company_id));
		await assertCompanyResourcePermission(userId, companyId, 'insumos', 'view');

		const supabase = await createServerSupabaseClient();
		const { data, error } = await supabase
			.from('measurement_units')
			.select('*')
			.eq('company_id', companyId)
			.order('name', { ascending: true });
		if (error) throw error;
		return data;
	} catch (error: unknown) {
		safeLogError('getUnitsAdmin', error);
		formatZodError(error);
	}
}

export async function createUnitAdmin(data: z.infer<typeof unitInsertSchema>) {
	try {
		const payload = unitInsertSchema.parse(data);
		const userId = await getAuthenticatedUserId();
		const companyId = await getValidatedCompanyId(userId, payload.company_id);
		await assertCompanyResourcePermission(userId, companyId, 'insumos', 'create');

		const supabase = await createServerSupabaseClient();
		const { data: result, error } = await supabase
			.from('measurement_units')
			.insert([{ ...payload, company_id: companyId }])
			.select()
			.single();
		if (error) throw error;
		return result;
	} catch (error: unknown) {
		safeLogError('createUnitAdmin', error);
		formatZodError(error);
	}
}
