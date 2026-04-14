import { useState, useEffect } from 'react';
import { getEPIItemsAdmin } from '@/app/actions/adminActions';

export interface EPIItem {
	id: string; // site_epis.id
	inventoryId: string;
	catalogId: string;
	name: string; // from catalog
	category: string; // from category
	code: string; // from catalog
	totalQuantity: number; // from site_inventory (which is current available)
	minThreshold: number; // from site_inventory
}

export function useEPIs(siteId: string) {
	const [epis, setEPIs] = useState<EPIItem[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchEPIs = async () => {
		try {
			setIsLoading(true);
			setError(null);
			const formattedEPIs = await getEPIItemsAdmin(siteId);
			setEPIs(formattedEPIs);
		} catch (err: any) {
			console.error('Error fetching EPIs:', err);
			setError(err.message);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		if (siteId) {
			fetchEPIs();
		}
	}, [siteId]);

	return { epis, isLoading, error, refetch: fetchEPIs };
}
