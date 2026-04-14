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
	const supabase = createClient();
	const [equipments, setEquipments] = useState<RentedEquipment[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	const fetchEquipments = useCallback(async () => {
		setIsLoading(true);
		try {
			const { data, error } = await supabase
				.from('rented_equipments')
				.select('*')
				.eq('site_id', siteId)
				.order('entry_date', { ascending: false });

			if (error) {
				console.error('Error fetching rented equipments:', error);
				return;
			}

			setEquipments(data || []);
		} catch (err) {
			console.error('Unexpected error:', err);
		} finally {
			setIsLoading(false);
		}
	}, [siteId]);

	useEffect(() => {
		if (siteId) {
			fetchEquipments();
		}
	}, [siteId, fetchEquipments]);

	return {
		equipments,
		isLoading,
		refetch: fetchEquipments,
	};
}
