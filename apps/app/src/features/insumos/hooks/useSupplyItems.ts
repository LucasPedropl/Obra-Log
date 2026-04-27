import { useState } from 'react';
import { getActiveCompanyId } from '@/lib/utils';
import { z } from 'zod';
import {
	createSupplyItemAdmin,
	createCategoryAdmin,
	createUnitAdmin,
	getSupplyItemsAdmin,
	deleteSupplyItemAdmin,
	getCategoriesAdmin,
	getUnitsAdmin,
} from '@/app/actions/adminActions';

export const supplyItemSchema = z.object({
	name: z.string().min(1, 'O nome do insumo é obrigatório'),
	category_id: z.string().min(1, 'Categoria é obrigatória'),
	unit_id: z.string().min(1, 'Unidade de medida é obrigatória'),
	min_threshold: z.coerce
		.number()
		.min(0, 'O estoque mínimo deve ser positivo'),
	is_stock_controlled: z.boolean(),
});

export type SupplyItemFormData = z.infer<typeof supplyItemSchema>;

export function useSupplyItems() {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const createCategory = async (name: string) => {
		const companyId = getActiveCompanyId();
		if (!companyId) throw new Error('Empresa não selecionada.');
		return await createCategoryAdmin({
			company_id: companyId,
			primary_category: name,
			entry_type: 'PRODUTO',
		});
	};

	const createUnit = async (name: string, abbreviation: string) => {
		const companyId = getActiveCompanyId();
		if (!companyId) throw new Error('Empresa não selecionada.');
		return await createUnitAdmin({
			company_id: companyId,
			name,
			abbreviation,
		});
	};

	const fetchCategories = async () => {
		try {
			const companyId = getActiveCompanyId();
			if (!companyId) return [];
			return await getCategoriesAdmin(companyId);
		} catch (err) {
			console.error('Error fetching categories:', err);
			return [];
		}
	};

	const fetchUnits = async () => {
		try {
			const companyId = getActiveCompanyId();
			if (!companyId) return [];
			return await getUnitsAdmin(companyId);
		} catch (err) {
			console.error('Error fetching units:', err);
			return [];
		}
	};

	const createSupplyItem = async (data: SupplyItemFormData) => {
		try {
			setIsLoading(true);
			setError(null);
			const companyId = getActiveCompanyId();

			if (!companyId) {
				throw new Error('Nenhuma empresa selecionada.');
			}

			await createSupplyItemAdmin({
				company_id: companyId,
				name: data.name,
				category_id: data.category_id,
				unit_id: data.unit_id,
				min_threshold: data.min_threshold,
				is_stock_controlled: data.is_stock_controlled,
			});

			return true;
		} catch (err: any) {
			console.error('Error creating supply item:', err);
			setError(err.message || 'Erro ao cadastrar o insumo');
			return false;
		} finally {
			setIsLoading(false);
		}
	};

	const fetchSupplyItems = async () => {
		try {
			setIsLoading(true);
			setError(null);
			const companyId = getActiveCompanyId();

			if (!companyId) {
				throw new Error('Nenhuma empresa selecionada.');
			}

			const data = await getSupplyItemsAdmin(companyId);
			return data || [];
		} catch (err: any) {
			console.error('Error fetching supply items:', err);
			setError(err.message || 'Erro ao buscar os insumos');
			return [];
		} finally {
			setIsLoading(false);
		}
	};

	const deleteSupplyItem = async (id: string) => {
		try {
			setIsLoading(true);
			setError(null);
			const companyId = getActiveCompanyId();
			if (!companyId) throw new Error('Nenhuma empresa selecionada.');

			await deleteSupplyItemAdmin(id, companyId);
			return true;
		} catch (err: any) {
			console.error('Error deleting supply item:', err);
			setError(err.message || 'Erro ao excluir o insumo');
			return false;
		} finally {
			setIsLoading(false);
		}
	};

	return {
		createSupplyItem,
		fetchSupplyItems,
		deleteSupplyItem,
		createCategory,
		createUnit,
		fetchCategories,
		fetchUnits,
		isLoading,
		error,
	};
}
