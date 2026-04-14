import { useState, useCallback, useEffect } from 'react';
import { createClient } from '@/config/supabase';

export interface Movimentacao {
	id: string; // generated unique id for the combined list
	original_id: string;
	date: string;
	module: 'ALMOXARIFADO' | 'FERRAMENTAS' | 'EPI' | 'ALUGADOS';
	type: 'IN' | 'OUT';
	action: string;
	item_name: string;
	quantity: number;
	user_name?: string;
	collaborator_name?: string;
	reason?: string;
	status?: string;
}

export function useMovimentacoes(siteId: string) {
	const supabase = createClient();
	const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	const fetchMovimentacoes = useCallback(async () => {
		setIsLoading(true);
		try {
			// 1. Fetch site_movements
			const { data: movementsData, error: movementsError } =
				await supabase
					.from('site_movements')
					.select(
						`
					id,
					type,
					reason,
					quantity_delta,
					action_date,
					users ( full_name ),
					site_inventory (
						catalogs ( name, is_tool )
					)
				`,
					)
					.eq('site_id', siteId);

			if (movementsError) throw movementsError;

			// 2. Fetch tool_loans
			const { data: toolLoansData, error: toolLoansError } =
				await supabase
					.from('tool_loans')
					.select(
						`
					id,
					quantity,
					loan_date,
					returned_date,
					status,
					collaborators ( name ),
					site_inventory (
						catalogs ( name )
					)
				`,
					)
					.eq('site_id', siteId);

			if (toolLoansError) throw toolLoansError;

			// 3. Fetch epi_withdrawals
			const { data: epiData, error: epiError } = await supabase
				.from('epi_withdrawals')
				.select(
					`
					id,
					quantity,
					withdrawal_date,
					users ( full_name ),
					collaborators ( name ),
					catalogs ( name )
				`,
				)
				.eq('site_id', siteId);

			if (epiError) throw epiError;

			// 4. Fetch rented equipments movements (entry/return)
			const { data: rentedData, error: rentedError } = await supabase
				.from('rented_equipments')
				.select(
					`
					id,
					name,
					quantity,
					entry_date,
					exit_date,
					status
				`,
				)
				.eq('site_id', siteId);

			if (rentedError) throw rentedError;

			const combinedList: Movimentacao[] = [];

			// Process site_movements
			(movementsData || []).forEach((mov: any) => {
				const isTool = mov.site_inventory?.catalogs?.is_tool;
				const moduleName: Movimentacao['module'] = isTool
					? 'FERRAMENTAS'
					: 'ALMOXARIFADO';

				const itemName =
					mov.site_inventory?.catalogs?.name || 'Desconhecido';

				// Determine Action
				let action = 'Movimentação';
				if (mov.reason === 'PURCHASE') action = 'Entrada / Compra';
				if (mov.reason === 'WASTE') action = 'Perda / Desperdício';
				if (mov.reason === 'APPLICATION') action = 'Aplicação na Obra';
				if (mov.reason === 'TRANSFER') action = 'Transferência';
				if (mov.reason === 'ADJUSTMENT') action = 'Ajuste de Estoque';

				combinedList.push({
					id: `mov-${mov.id}`,
					original_id: mov.id,
					date: mov.action_date,
					module: moduleName,
					type: mov.type as 'IN' | 'OUT',
					action,
					item_name: itemName,
					quantity: mov.quantity_delta,
					user_name: mov.users?.full_name,
					reason: mov.reason,
				});
			});

			// Process tool_loans
			(toolLoansData || []).forEach((loan: any) => {
				const itemName =
					loan.site_inventory?.catalogs?.name ||
					'Ferramenta Desconhecida';

				// LOAN OUT
				combinedList.push({
					id: `loan-out-${loan.id}`,
					original_id: loan.id,
					date: loan.loan_date,
					module: 'FERRAMENTAS',
					type: 'OUT',
					action: 'Empréstimo de Ferramenta',
					item_name: itemName,
					quantity: loan.quantity,
					collaborator_name: loan.collaborators?.name,
					status: loan.status,
				});

				// LOAN RETURNED
				if (loan.status === 'RETURNED' && loan.returned_date) {
					combinedList.push({
						id: `loan-in-${loan.id}`,
						original_id: loan.id,
						date: loan.returned_date,
						module: 'FERRAMENTAS',
						type: 'IN',
						action: 'Devolução de Ferramenta',
						item_name: itemName,
						quantity: loan.quantity,
						collaborator_name: loan.collaborators?.name,
						status: loan.status,
					});
				}
			});

			// Process epi_withdrawals
			// (Note: Some EPI withdrawals might also trigger site_movements, so we need to be careful to not show it twice? The prompt mentioned "cadastro de almoxarifado, devolução de... tem que ser listado aqui tudo", users will want to see everything.)
			// We can filter out 'EPI' from site_movements if they match?
			// Wait, the Provide EPI form triggers a site_movement. Thus, it will show up as APPLICATION in ALMOXARIFADO.
			// Let's add EPI specifically to identify it was an EPI withdrawal.
			(epiData || []).forEach((epi: any) => {
				combinedList.push({
					id: `epi-${epi.id}`,
					original_id: epi.id,
					date: epi.withdrawal_date,
					module: 'EPI',
					type: 'OUT',
					action: 'Entrega de EPI',
					item_name: epi.catalogs?.name || 'EPI Desconhecido',
					quantity: epi.quantity,
					user_name: epi.users?.full_name,
					collaborator_name: epi.collaborators?.name,
				});
			});

			// Process rented equipments
			(rentedData || []).forEach((rent: any) => {
				combinedList.push({
					id: `rented-in-${rent.id}`,
					original_id: rent.id,
					date: rent.entry_date,
					module: 'ALUGADOS',
					type: 'IN',
					action: 'Chegada de Equipamento (Aluguel)',
					item_name: rent.name || 'Aluguel Desconhecido',
					quantity: rent.quantity,
				});

				if (rent.status === 'RETURNED' && rent.exit_date) {
					combinedList.push({
						id: `rented-out-${rent.id}`,
						original_id: rent.id,
						date: rent.exit_date,
						module: 'ALUGADOS',
						type: 'OUT',
						action: 'Devolução de Equipamento (Aluguel)',
						item_name: rent.name || 'Aluguel Desconhecido',
						quantity: rent.quantity,
					});
				}
			});

			// Sort combinations by descending date
			combinedList.sort(
				(a, b) =>
					new Date(b.date).getTime() - new Date(a.date).getTime(),
			);

			setMovimentacoes(combinedList);
		} catch (error) {
			console.error('Error fetching movimentacoes:', error);
		} finally {
			setIsLoading(false);
		}
	}, [siteId, supabase]);

	useEffect(() => {
		if (siteId) {
			fetchMovimentacoes();
		}
	}, [siteId, fetchMovimentacoes]);

	return { movimentacoes, isLoading, refetch: fetchMovimentacoes };
}
