import { useState, useEffect } from 'react';
import { createClient } from '@/config/supabase';

export interface ToolHistoryItem {
	id: string;
	inventoryId: string;
	toolName: string;
	toolCode: string;
	collaboratorName: string;
	collaboratorId: string;
	quantity: number;
	loanDate: string;
	returnedDate: string | null;
	status: string; // 'OPEN' | 'RETURNED' | 'LOST'
	notesOnLoan: string;
	notesOnReturn: string;
}

interface RawToolLoan {
	id: string;
	quantity: number;
	loan_date: string;
	returned_date: string | null;
	status: string;
	notes_on_loan: string | null;
	notes_on_return: string | null;
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

export function useToolHistory(siteId: string) {
	const [history, setHistory] = useState<ToolHistoryItem[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const supabase = createClient();
	const fetchHistory = async () => {
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
          returned_date,
          status,
          notes_on_loan,
          notes_on_return,
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
				.order('loan_date', { ascending: false });

			if (loansError) throw loansError;

			const formatted = ((data as unknown as RawToolLoan[]) || []).map((loan) => ({
				id: loan.id,
				inventoryId: loan.inventory_id,
				toolName:
					loan.site_inventory?.catalogs?.name ||
					'Ferramenta Removida',
				toolCode: loan.site_inventory?.catalogs?.code || '-',
				collaboratorId: loan.collaborators?.id || loan.id,
				collaboratorName:
					loan.collaborators?.name || 'Colaborador Removido',
				quantity: loan.quantity,
				loanDate: loan.loan_date,
				returnedDate: loan.returned_date,
				status: loan.status,
				notesOnLoan: loan.notes_on_loan || '',
				notesOnReturn: loan.notes_on_return || '',
			}));

			setHistory(formatted);
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : 'Erro ao buscar histórico de ferramentas';
			console.error('Error fetching history:', err);
			setError(message);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		if (siteId) {
			fetchHistory();
		}
	}, [siteId]);

	return { history, isLoading, error, refetch: fetchHistory };
}
