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

interface RawActiveLoan {
	id: string;
	quantity: number;
	loan_date: string;
	status: string;
	inventory_id: string;
	site_inventory: {
		catalogs: {
			name: string;
			code: string | null;
		} | null;
	} | null;
	collaborators: {
		id: string;
		name: string;
	} | null;
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

			const formatted = ((data as unknown as RawActiveLoan[]) || []).map((loan) => ({
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
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : 'Erro ao buscar empréstimos ativos';
			console.error('Error fetching active loans:', err);
			setError(message);
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
