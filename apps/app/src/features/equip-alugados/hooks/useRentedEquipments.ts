import { useState, useCallback, useEffect } from 'react';
import {
	getRentedEquipmentsAction,
	registerRentedEquipmentAction,
} from '@/app/actions/rentedActions';

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
	inventory_id: string | null;
	entry_photos_url: string | null;
	exit_photos_url: string | null;
}

export function useRentedEquipments(siteId: string) {
	const [equipments, setEquipments] = useState<RentedEquipment[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	const fetchEquipments = useCallback(async () => {
		setIsLoading(true);
		try {
			const data = await getRentedEquipmentsAction(siteId);
			setEquipments(data);
		} catch (err: unknown) {
			console.error('Unexpected error:', err);
		} finally {
			setIsLoading(false);
		}
	}, [siteId]);

	const registerEquipment = async (data: {
		name: string;
		categoryId: string;
		categoryName: string;
		quantity: number;
		entryDate: string;
		observations: string;
		entryPhotosUrl?: string;
	}) => {
		const result = await registerRentedEquipmentAction({
			siteId,
			name: data.name,
			categoryId: data.categoryId,
			categoryName: data.categoryName,
			quantity: data.quantity,
			entryDate: data.entryDate,
			observations: data.observations,
			entryPhotosUrl: data.entryPhotosUrl,
		});

		if (result.success) {
			fetchEquipments();
		}

		return result;
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
		registerEquipment,
	};
}
