import { useState, useEffect } from 'react';
import { createClient } from '@/config/supabase';

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
	const supabase = createClient();
	const fetchTools = async () => {
		try {
			setIsLoading(true);
			setError(null);

			// Fetch tools with inventory and catalog info
			const { data: toolsData, error: toolsError } = await supabase
				.from('site_tools')
				.select(
					`
          id,
          inventory_id,
          site_inventory (
            quantity,
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

			if (toolsError) throw toolsError;

			// Fetch open loans to calculate availability
			const { data: loansData, error: loansError } = await supabase
				.from('tool_loans')
				.select('inventory_id, quantity')
				.eq('site_id', siteId)
				.eq('status', 'OPEN');

			if (loansError) throw loansError;

			const loansByInventory = loansData.reduce(
				(acc, loan) => {
					acc[loan.inventory_id] =
						(acc[loan.inventory_id] || 0) + loan.quantity;
					return acc;
				},
				{} as Record<string, number>,
			);

			const formattedTools = toolsData.map((t: any) => {
				const totalQty = t.site_inventory?.quantity || 0;
				const loanedQty = loansByInventory[t.inventory_id] || 0;

				return {
					id: t.id,
					inventoryId: t.inventory_id,
					name:
						t.site_inventory?.catalogs?.name ||
						'Ferramenta Desconhecida',
					category:
						t.site_inventory?.catalogs?.categories
							?.primary_category || 'Sem Categoria',
					code: t.site_inventory?.catalogs?.code || '-',
					totalQuantity: totalQty,
					availableQuantity: Math.max(0, totalQty - loanedQty),
				};
			});

			setTools(formattedTools);
		} catch (err: any) {
			console.error(
				'Error fetching tools CODE:',
				err.code,
				'MSG:',
				err.message,
				'HINT:',
				err.hint,
				'DETAILS:',
				err.details,
			);
			setError(err.message);
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
