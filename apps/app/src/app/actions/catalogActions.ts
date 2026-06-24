'use server';

import { z } from 'zod';
import { supabaseAdmin } from '@/config/supabaseAdmin';
import { safeLogError } from '@/lib/safeLog';
import {
	assertCompanyResourcePermission,
	getAuthenticatedUserId,
	getValidatedCompanyId,
} from './_helpers';

const importCatalogItemSchema = z.object({
	company_id: z.string().uuid(),
	name: z.string().min(1),
	unit_abbreviation: z.string().optional(),
	min_threshold: z.number().min(0).optional(),
});

const importCategoryItemSchema = z.object({
	company_id: z.string().uuid(),
	primary_category: z.string().min(1),
	secondary_category: z.string().nullable().optional(),
	entry_type: z.string().optional(),
});

const importUnitItemSchema = z.object({
	company_id: z.string().uuid(),
	name: z.string().min(1),
	abbreviation: z.string().min(1),
});

function formatZodError(error: unknown): never {
	if (error instanceof z.ZodError) {
		throw new Error(error.issues[0]?.message ?? 'Dados inválidos');
	}
	throw error;
}

export async function importCatalogsAdmin(
	items: z.infer<typeof importCatalogItemSchema>[],
) {
	try {
		if (!items.length) return { success: true };

		const userId = await getAuthenticatedUserId();
		const parsedItems = z.array(importCatalogItemSchema).min(1).parse(items);
		const companyId = await getValidatedCompanyId(userId, parsedItems[0]?.company_id);

		await assertCompanyResourcePermission(userId, companyId, 'insumos', 'create');

		const { data: existingUnits, error: unitsError } = await supabaseAdmin
			.from('measurement_units')
			.select('id, abbreviation')
			.eq('company_id', companyId);

		if (unitsError) throw unitsError;

		const unitMap = new Map<string, string>();
		for (const unit of existingUnits ?? []) {
			unitMap.set(unit.abbreviation.trim().toUpperCase(), unit.id);
		}

		const catalogsToInsert: Array<{
			company_id: string;
			name: string;
			unit_id: string;
			min_threshold: number;
			is_stock_controlled: boolean;
			is_rented_equipment: boolean;
			is_tool: boolean;
		}> = [];

		for (const item of parsedItems) {
			const name = item.name.trim();
			if (!name) continue;

			const abbreviation = item.unit_abbreviation?.trim().toUpperCase();
			if (!abbreviation) {
				throw new Error(`Unidade não informada para o insumo "${name}"`);
			}

			let unitId = unitMap.get(abbreviation);
			if (!unitId) {
				const { data: newUnit, error: createUnitError } = await supabaseAdmin
					.from('measurement_units')
					.insert({
						company_id: companyId,
						name: abbreviation,
						abbreviation,
					})
					.select('id, abbreviation')
					.single();

				if (createUnitError) throw createUnitError;
				if (!newUnit?.id) {
					throw new Error(`Falha ao criar unidade "${abbreviation}"`);
				}

				unitId = newUnit.id;
				unitMap.set(
					(newUnit.abbreviation ?? abbreviation).toUpperCase(),
					newUnit.id,
				);
			}

			if (!unitId) {
				throw new Error(
					`Unidade "${abbreviation}" não encontrada para o insumo "${name}"`,
				);
			}

			catalogsToInsert.push({
				company_id: companyId,
				name,
				unit_id: unitId,
				min_threshold: item.min_threshold ?? 0,
				is_stock_controlled: true,
				is_rented_equipment: false,
				is_tool: false,
			});
		}

		if (!catalogsToInsert.length) {
			throw new Error('Nenhum insumo válido encontrado no arquivo');
		}

		const { data, error } = await supabaseAdmin
			.from('catalogs')
			.insert(catalogsToInsert)
			.select();

		if (error) throw error;
		return { success: true, data };
	} catch (error: unknown) {
		safeLogError('importCatalogsAdmin', error);
		formatZodError(error);
	}
}

export async function importCategoriesAdmin(
	items: z.infer<typeof importCategoryItemSchema>[],
) {
	try {
		if (!items.length) return { success: true };

		const userId = await getAuthenticatedUserId();
		const parsedItems = z.array(importCategoryItemSchema).min(1).parse(items);
		const companyId = await getValidatedCompanyId(userId, parsedItems[0]?.company_id);

		await assertCompanyResourcePermission(userId, companyId, 'insumos', 'create');

		const payload = parsedItems.map((item) => ({
			company_id: companyId,
			primary_category: item.primary_category,
			secondary_category: item.secondary_category ?? null,
			entry_type: item.entry_type ?? 'PRODUTO',
		}));

		const { data, error } = await supabaseAdmin
			.from('categories')
			.insert(payload)
			.select();

		if (error) throw error;
		return { success: true, data };
	} catch (error: unknown) {
		safeLogError('importCategoriesAdmin', error);
		formatZodError(error);
	}
}

export async function importUnitsAdmin(
	items: z.infer<typeof importUnitItemSchema>[],
) {
	try {
		if (!items.length) return { success: true };

		const userId = await getAuthenticatedUserId();
		const parsedItems = z.array(importUnitItemSchema).min(1).parse(items);
		const companyId = await getValidatedCompanyId(userId, parsedItems[0]?.company_id);

		await assertCompanyResourcePermission(userId, companyId, 'insumos', 'create');

		const payload = parsedItems.map((item) => ({
			company_id: companyId,
			name: item.name.trim(),
			abbreviation: item.abbreviation.trim(),
		}));

		const { data, error } = await supabaseAdmin
			.from('measurement_units')
			.insert(payload)
			.select();

		if (error) throw error;
		return { success: true, data };
	} catch (error: unknown) {
		safeLogError('importUnitsAdmin', error);
		formatZodError(error);
	}
}
