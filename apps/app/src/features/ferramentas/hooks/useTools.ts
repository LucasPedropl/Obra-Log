import { useState, useEffect } from 'react';
import { getToolItemsAdmin } from '@/app/actions/adminActions';

export interface ToolItem {
	id: string; // site_tools.id
	inventoryId: string;
	name: string; // from catalog
	category: string; // from category
	code: string; // from catalog
	totalQuantity: number; // from site_inventory
	availableQuantity: number; // calculated
}

export function useTools(siteId: string) {
	const [tools, setTools] = useState<ToolItem[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchTools = async () => {
		try {
			setIsLoading(true);
			setError(null);
			const formattedTools = await getToolItemsAdmin(siteId);
			setTools(formattedTools);
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : 'Erro ao buscar ferramentas da obra';
			console.error('Error fetching tools:', err);
			setError(message);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		if (siteId) {
			fetchTools();
		}
	}, [siteId]);

	return { tools, isLoading, error, refetch: fetchTools };
}
