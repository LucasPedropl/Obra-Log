import { useState, useEffect } from 'react';
import { createClient } from '@/config/supabase';

export interface EPIHistoryItem {
	id: string; // epi_withdrawals.id
	epiName: string;
	epiCode: string;
	collaboratorName: string;
	collaboratorCpf: string;
	withdrawnByName: string;
	quantity: number;
	withdrawalDate: string;
	notes: string;
}

export function useEPIHistory(siteId: string) {
	const [history, setHistory] = useState<EPIHistoryItem[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const supabase = createClient();

	const fetchHistory = async () => {
		try {
			setIsLoading(true);
			setError(null);

			const { data, error: fetchError } = await supabase
				.from('epi_withdrawals')
				.select(
					`
          id,
          quantity,
          withdrawal_date,
          notes,
          catalogs (
            name,
            code
          ),
          collaborators (
            name,
            cpf
          ),
          users!epi_withdrawals_withdrawn_by_fkey (
            full_name
          )
        `,
				)
				.eq('site_id', siteId)
				.order('withdrawal_date', { ascending: false });

			if (fetchError) throw fetchError;

			const formatted: EPIHistoryItem[] = (data || []).map((t: any) => ({
				id: t.id,
				epiName: t.catalogs?.name || 'EPI Desconhecido',
				epiCode: t.catalogs?.code || '-',
				collaboratorName:
					t.collaborators?.name || 'Colaborador Desconhecido',
				collaboratorCpf: t.collaborators?.cpf || '-',
				withdrawnByName: t.users?.full_name || 'Usuário',
				quantity: t.quantity,
				withdrawalDate: t.withdrawal_date,
				notes: t.notes || '',
			}));

			setHistory(formatted);
		} catch (err: any) {
			console.error('Error fetching epi history:', err);
			setError(err.message);
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
