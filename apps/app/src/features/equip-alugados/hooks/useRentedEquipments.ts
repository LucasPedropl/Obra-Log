import { useState, useCallback, useEffect } from 'react';
import { createClient } from '@/config/supabase';

export interface RentedEquipment {
	id: string;
	site_id: string;
	name: string;
	category: string;
	supplier: string | null;
	quantity: number;
	entry_date: string;
	exit_date: string | null;
	status: 'ACTIVE' | 'RETURNED';
	description: string | null;
	inventory_id: string;
	entry_photos_url: string | null;
	exit_photos_url: string | null;
}

export function useRentedEquipments(siteId: string) {
	const [equipments, setEquipments] = useState<RentedEquipment[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const supabase = createClient();

	const fetchEquipments = useCallback(async () => {
		setIsLoading(true);
		try {
			const { data, error } = await supabase
				.from('rented_equipments')
				.select('*')
				.eq('site_id', siteId)
				.order('entry_date', { ascending: false });

			if (error) throw error;
			setEquipments(data || []);
		} catch (err) {
			console.error('Unexpected error:', err);
		} finally {
			setIsLoading(false);
		}
	}, [siteId]);

	const registerEquipment = async (data: {
		companyId: string;
		userId: string;
		name: string;
		categoryId: string;
		categoryName: string;
		quantity: number;
		entryDate: string;
		observations: string;
	}) => {
		try {
			// 1. Obter a unidade de medida padrão (UN)
			const { data: units } = await supabase
				.from('measurement_units')
				.select('id')
				.eq('company_id', data.companyId)
				.eq('abbreviation', 'UN')
				.limit(1);

			const unitId = units?.[0]?.id || null;

			// 2. Criar o item no Catálogo (Catalogs)
			const { data: catalogItem, error: catalogError } = await supabase
				.from('catalogs')
				.insert({
					company_id: data.companyId,
					category_id: data.categoryId,
					unit_id: unitId,
					name: `[ALUGADO] ${data.name}`,
					is_stock_controlled: true,
					is_rented_equipment: true,
					is_tool: false,
				})
				.select('id')
				.single();

			if (catalogError) throw new Error(`Catálogo: ${catalogError.message}`);
			const catalogId = catalogItem.id;

			// 3. Adicionar ao Inventário da Obra
			const { data: inventoryItem, error: invError } = await supabase
				.from('site_inventory')
				.insert({
					site_id: siteId,
					catalog_id: catalogId,
					quantity: data.quantity,
				})
				.select('id')
				.single();

			if (invError) throw new Error(`Inventário: ${invError.message}`);
			const inventoryId = inventoryItem.id;

			// 4. Registrar Movimentação de Entrada
			const { error: moveError } = await supabase
				.from('site_movements')
				.insert({
					site_id: siteId,
					inventory_id: inventoryId,
					created_by: data.userId,
					type: 'IN',
					quantity_delta: data.quantity,
					reason: 'PURCHASE',
				});

			if (moveError) throw new Error(`Movimentação: ${moveError.message}`);

			// 5. Registrar o Equipamento Alugado
			const { error: rentError } = await supabase
				.from('rented_equipments')
				.insert({
					site_id: siteId,
					name: data.name,
					category: data.categoryName,
					quantity: data.quantity,
					entry_date: new Date(data.entryDate).toISOString(),
					status: 'ACTIVE',
					description: data.observations,
					inventory_id: inventoryId,
				});

			if (rentError) throw new Error(`Aluguel: ${rentError.message}`);

			fetchEquipments();
			return { success: true };
		} catch (error: any) {
			console.error('Erro ao registrar equipamento alugado:', error);
			return { success: false, error: error.message };
		}
	};

	useEffect(() => {
		if (siteId) {
			fetchEquipments();
		}
	}, [siteId, fetchEquipments]);

	return {
		equipments,
		isLoading,
		refetch: fetchEquipments,
		registerEquipment
	};
}
