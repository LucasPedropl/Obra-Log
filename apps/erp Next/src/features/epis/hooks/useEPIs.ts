import { useState, useEffect } from 'react';
import { createClient } from '@/config/supabase';

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
	const supabase = createClient();

	const fetchEPIs = async () => {
		try {
			setIsLoading(true);
			setError(null);

			const { data: episData, error: episError } = await supabase
				.from('site_epis')
				.select(
					`
          id,
          inventory_id,
          site_inventory (
            quantity,
            min_threshold,
            catalog_id,
            catalogs (
              name,
              code,
              categories (
                primary_category
              )
            )
          )
        `,
				)
				.eq('site_id', siteId);

			if (episError) throw episError;

			const formattedEPIs = (episData || []).map((t: any) => {
				return {
					id: t.id,
					inventoryId: t.inventory_id,
					catalogId: t.site_inventory?.catalog_id,
					name:
						t.site_inventory?.catalogs?.name || 'EPI Desconhecido',
					category:
						t.site_inventory?.catalogs?.categories
							?.primary_category || 'Sem Categoria',
					code: t.site_inventory?.catalogs?.code || '-',
					totalQuantity: t.site_inventory?.quantity || 0,
					minThreshold: t.site_inventory?.min_threshold || 0,
				};
			});

			setEPIs(formattedEPIs);
		} catch (err: any) {
			console.error('Error fetching epis:', err);
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
