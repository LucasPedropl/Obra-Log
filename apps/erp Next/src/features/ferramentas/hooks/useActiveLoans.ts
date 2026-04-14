import { useState, useEffect } from 'react';
import { createClient } from '@/config/supabase';

export interface ActiveLoanItem {
	id: string;
	inventoryId: string;
	toolName: string;
	toolCode: string;
	collaboratorName: string;
	collaboratorId: string;
	quantity: number;
	loanDate: string;
	status: string;
}

export function useActiveLoans(siteId: string) {
	const [loans, setLoans] = useState<ActiveLoanItem[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const supabase = createClient();
	const fetchLoans = async () => {
		try {
			setIsLoading(true);
			setError(null);

			const { data, error: loansError } = await supabase
				.from('tool_loans')
				.select(
					`
          id,
          quantity,
          loan_date,
          status,
          inventory_id,
          site_inventory (
            catalogs (
              name,
              code
            )
          ),
          collaborators (
            id,
            name
          )
        `,
				)
				.eq('site_id', siteId)
				.eq('status', 'OPEN')
				.order('loan_date', { ascending: false });

			if (loansError) throw loansError;

			const formatted = (data || []).map((loan: any) => ({
				id: loan.id,
				inventoryId: loan.inventory_id,
				toolName: loan.site_inventory?.catalogs?.name || 'Sem nome',
				toolCode: loan.site_inventory?.catalogs?.code || '-',
				collaboratorId: loan.collaborators?.id || loan.id,
				collaboratorName: loan.collaborators?.name || 'Desconhecido',
				quantity: loan.quantity,
				loanDate: loan.loan_date,
				status: loan.status,
			}));

			setLoans(formatted);
		} catch (err: any) {
			console.error('Error fetching active loans:', err);
			setError(err.message);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		if (siteId) {
			fetchLoans();
		}
	}, [siteId]);

	return { loans, isLoading, error, refetch: fetchLoans };
}
