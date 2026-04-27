import { useState } from 'react';
import { getActiveCompanyId } from '@/lib/utils';
import { z } from 'zod';
import { createClient } from '@/config/supabase';

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
	const supabase = createClient();

	const createCategory = async (name: string) => {
		const companyId = getActiveCompanyId();
		if (!companyId) throw new Error('Empresa não selecionada.');
		
		const { data, error } = await supabase
			.from('categories')
			.insert([{ company_id: companyId, primary_category: name, entry_type: 'PRODUTO' }])
			.select('id')
			.single();
			
		if (error) throw error;
		return data.id;
	};

	const createUnit = async (name: string, abbreviation: string) => {
		const companyId = getActiveCompanyId();
		if (!companyId) throw new Error('Empresa não selecionada.');
		
		const { data, error } = await supabase
			.from('measurement_units')
			.insert([{ company_id: companyId, name, abbreviation }])
			.select('id')
			.single();
			
		if (error) throw error;
		return data.id;
	};

	const fetchCategories = async () => {
		try {
			const companyId = getActiveCompanyId();
			if (!companyId) return [];
			
			const { data, error } = await supabase
				.from('categories')
				.select('*')
				.eq('company_id', companyId)
				.order('primary_category', { ascending: true });
				
			if (error) throw error;
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
			
			const { data, error } = await supabase
				.from('measurement_units')
				.select('*')
				.eq('company_id', companyId)
				.order('name', { ascending: true });
				
			if (error) throw error;
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

			if (!companyId) throw new Error('Nenhuma empresa selecionada.');

			const { error: insertError } = await supabase
				.from('catalogs')
				.insert([{
					company_id: companyId,
					name: data.name,
					category_id: data.category_id,
					unit_id: data.unit_id,
					min_threshold: data.min_threshold,
					is_stock_controlled: data.is_stock_controlled,
				}]);

			if (insertError) throw insertError;

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

			if (!companyId) throw new Error('Nenhuma empresa selecionada.');

			const { data, error: fetchError } = await supabase
				.from('catalogs')
				.select('*, measurement_units(abbreviation)')
				.eq('company_id', companyId)
				.order('name', { ascending: true });

			if (fetchError) throw fetchError;
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

			const { error: deleteError } = await supabase
				.from('catalogs')
				.delete()
				.eq('id', id)
				.eq('company_id', companyId);
				
			if (deleteError) throw deleteError;
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
