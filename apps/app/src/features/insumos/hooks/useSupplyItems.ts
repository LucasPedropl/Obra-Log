import {
	createCategoryAdmin,
	createUnitAdmin,
	getCategoriesAdmin,
	getUnitsAdmin,
	createSupplyItemAdmin,
	updateSupplyItemAdmin,
	getSupplyItemsAdmin,
	deleteSupplyItemAdmin
} from '@/app/actions/adminActions';
import { getActiveCompanyId } from '@/lib/utils';
import { useState } from 'react';
import { z } from 'zod';

export const supplyItemSchema = z.object({
	name: z.string().min(1, 'O nome do insumo é obrigatório'),
	category_id: z.string().min(1, 'Categoria é obrigatória'),
	unit_id: z.string().min(1, 'Unidade de medida é obrigatória'),
	min_threshold: z.number().min(0, 'O estoque mínimo deve ser positivo'),
	is_stock_controlled: z.boolean(),
});

export type SupplyItemFormData = z.infer<typeof supplyItemSchema>;

export function useSupplyItems() {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const createCategory = async (params: { primary: string; secondary?: string; entryType?: 'PRODUTO' | 'SERVICO' }) => {
		try {
			setIsLoading(true);
			setError(null);
			const companyId = getActiveCompanyId();
			if (!companyId) {
				setError('Empresa não selecionada.');
				return null;
			}

			const result = await createCategoryAdmin({
				company_id: companyId,
				primary_category: params.primary,
				secondary_category: params.secondary || null,
				entry_type: params.entryType || 'PRODUTO'
			});

			return result?.id;
		} catch (err: any) {
			console.error('Error creating category:', {
				message: err?.message || 'No message',
				code: err?.code || 'No code',
				details: err?.details || 'No details',
				hint: err?.hint || 'No hint',
				error: err
			});

			let message = 'Erro ao criar categoria';
			if (err?.code === '23505') {
				message = 'Esta categoria já existe para sua empresa.';
			} else if (err?.message) {
				message = err.message;
			}

			setError(message);
			throw new Error(message);
		} finally {
			setIsLoading(false);
		}
	};

	const createUnit = async (name: string, abbreviation: string) => {
		try {
			setIsLoading(true);
			setError(null);
			const companyId = getActiveCompanyId();
			if (!companyId) {
				setError('Empresa não selecionada.');
				return null;
			}

			const result = await createUnitAdmin({
				company_id: companyId,
				name,
				abbreviation
			});

			return result?.id;
		} catch (err: any) {
			console.error('Error creating unit:', {
				message: err?.message || 'No message',
				code: err?.code || 'No code',
				details: err?.details || 'No details',
				hint: err?.hint || 'No hint',
				error: err
			});
			
			let message = 'Erro ao criar unidade de medida';
			
			if (err?.code === '23505') {
				message = 'Esta unidade de medida ou abreviação já existe para sua empresa.';
			} else if (err?.message) {
				message = err.message;
			}
			
			setError(message);
			throw new Error(message);
		} finally {
			setIsLoading(false);
		}
	};

	const fetchCategories = async () => {
		try {
			const companyId = getActiveCompanyId();
			if (!companyId) return [];

			const data = await getCategoriesAdmin(companyId);
			return data || [];
		} catch (err) {
			console.error('Error fetching categories:', err);
			return [];
		}
	};

	const fetchUnits = async () => {
		try {
			const companyId = getActiveCompanyId();
			if (!companyId) return [];

			const data = await getUnitsAdmin(companyId);
			return data || [];
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
				setError('Nenhuma empresa selecionada.');
				return false;
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
			const message = err?.message || 'Erro ao cadastrar o insumo';
			console.error('Error creating supply item:', err);
			setError(message);
			return false;
		} finally {
			setIsLoading(false);
		}
	};

	const updateSupplyItem = async (id: string, data: SupplyItemFormData) => {
		try {
			setIsLoading(true);
			setError(null);
			const companyId = getActiveCompanyId();

			if (!companyId) {
				setError('Nenhuma empresa selecionada.');
				return false;
			}

			await updateSupplyItemAdmin(id, {
				...data,
				company_id: companyId,
			});

			return true;
		} catch (err: any) {
			const message = err?.message || 'Erro ao atualizar o insumo';
			console.error('Error updating supply item:', err);
			setError(message);
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
				setError('Nenhuma empresa selecionada.');
				return false;
			}

			const data = await getSupplyItemsAdmin(companyId);
			return data || [];
		} catch (err: any) {
			const message = err?.message || 'Erro ao buscar os insumos';
			console.error('Error fetching supply items:', err);
			setError(message);
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
			if (!companyId) {
				setError('Nenhuma empresa selecionada.');
				return false;
			}

			await deleteSupplyItemAdmin(id, companyId);
			return true;
		} catch (err: any) {
			const message = err?.message || 'Erro ao excluir o insumo';
			console.error('Error deleting supply item:', err);
			setError(message);
			return false;
		} finally {
			setIsLoading(false);
		}
	};

	return {
		createSupplyItem,
		updateSupplyItem,
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
