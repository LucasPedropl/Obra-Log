import React, { useState, useEffect } from 'react';
import { ERPLayout } from '../../../components/layout/ERPLayout';
import { supabase } from '../../../config/supabase';
import { useParams } from 'react-router-dom';
import { useToast } from '../../../context/ToastContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
	Search,
	ArrowRightLeft,
	Filter,
	ChevronDown,
	Settings2,
} from 'lucide-react';

interface Movimentacao {
	id: string;
	data: string;
	tipo: string;
	item: string;
	qtd: number;
	responsavel: string;
	origemDestino: string;
}

export default function Movimentacoes() {
	const { id: siteId } = useParams();
	const { showToast } = useToast();
	const [searchTerm, setSearchTerm] = useState('');
	const [showFilters, setShowFilters] = useState(false);
	const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		if (siteId) fetchMovimentacoes();
	}, [siteId]);

	const fetchMovimentacoes = async () => {
		setIsLoading(true);
		try {
			// Fetch 1: Insumos (site_movements)
			const { data: moveData, error: moveError } = await supabase
				.from('site_movements')
				.select(`
					id, type, quantity_delta, action_date, reason,
					created_by:users ( full_name ),
					inventory:site_inventory (
						catalog:catalogs ( name )
					)
				`)
				.eq('site_id', siteId);

			if (moveError) throw moveError;

			// Fetch 2: Ferramentas (tool_loans)
			const { data: toolData, error: toolError } = await supabase
				.from('tool_loans')
				.select(`
					id, quantity, loan_date, returned_date, status, notes_on_loan, notes_on_return,
					collaborator:collaborators ( name ),
					inventory:site_inventory (
						catalog:catalogs ( name )
					)
				`)
				.eq('site_id', siteId);

			if (toolError) throw toolError;

			// Fetch 3: EPIs (epi_withdrawals)
			const { data: epiData, error: epiError } = await supabase
				.from('epi_withdrawals')
				.select(`
					id, quantity, withdrawal_date, notes,
					collaborator:collaborators ( name ),
					catalog:catalogs ( name )
				`)
				.eq('site_id', siteId);

			if (epiError) throw epiError;

			// Fetch 4: Equipamentos Alugados (rented_equipments)
			const { data: rentData, error: rentError } = await supabase
				.from('rented_equipments')
				.select(`
					id, quantity, entry_date, exit_date, status, description, supplier,
					inventory:site_inventory (
						catalog:catalogs ( name )
					)
				`)
				.eq('site_id', siteId);

			if (rentError) throw rentError;

			const feed: Movimentacao[] = [];

			// Parse movements
			moveData?.forEach((m: any) => {
				const isEntrada = m.type === 'IN';
				const tipoLabel = isEntrada ? 'Entrada (Insumo)' : 'Saída (Insumo)';
				const responsavel = Array.isArray(m.created_by) ? m.created_by[0]?.full_name : m.created_by?.full_name;
				const itemName = Array.isArray(m.inventory) ? m.inventory[0]?.catalog?.name : m.inventory?.catalog?.name;

				feed.push({
					id: `mov-${m.id}`,
					data: m.action_date,
					tipo: tipoLabel,
					item: itemName || 'Item desconhecido',
					qtd: Math.abs(m.quantity_delta),
					responsavel: responsavel || 'Usuário',
					origemDestino: `Motivo: ${m.reason || 'N/A'}`
				});
			});

			// Parse tools
			toolData?.forEach((t: any) => {
				const itemName = Array.isArray(t.inventory) ? t.inventory[0]?.catalog?.name : t.inventory?.catalog?.name;
				const colaborador = Array.isArray(t.collaborator) ? t.collaborator[0]?.name : t.collaborator?.name;
				
				feed.push({
					id: `tool-loan-${t.id}`,
					data: t.loan_date,
					tipo: 'Empréstimo (Ferramenta)',
					item: itemName || 'Ferramenta',
					qtd: t.quantity,
					responsavel: colaborador || 'Desconhecido',
					origemDestino: `Retirada${t.notes_on_loan ? ' - ' + t.notes_on_loan : ''}`
				});

				if (t.status === 'RETURNED' && t.returned_date) {
					feed.push({
						id: `tool-return-${t.id}`,
						data: t.returned_date,
						tipo: 'Devolução (Ferramenta)',
						item: itemName || 'Ferramenta',
						qtd: t.quantity,
						responsavel: colaborador || 'Desconhecido',
						origemDestino: `Devolução${t.notes_on_return ? ' - ' + t.notes_on_return : ''}`
					});
				}
			});

			// Parse EPIs
			epiData?.forEach((e: any) => {
				const itemName = Array.isArray(e.catalog) ? e.catalog[0]?.name : e.catalog?.name;
				const colaborador = Array.isArray(e.collaborator) ? e.collaborator[0]?.name : e.collaborator?.name;

				feed.push({
					id: `epi-${e.id}`,
					data: e.withdrawal_date,
					tipo: 'Entrega (EPI)',
					item: itemName || 'EPI',
					qtd: e.quantity,
					responsavel: colaborador || 'Desconhecido',
					origemDestino: e.notes ? `Obs: ${e.notes}` : 'Entrega'
				});
			});

			// Parse rented equipments
			rentData?.forEach((r: any) => {
				const itemName = Array.isArray(r.inventory) 
					? r.inventory[0]?.catalog?.name 
					: r.inventory?.catalog?.name || r.name || 'Equipamento desconhecido';
				const fornecedor = r.supplier || 'Fornecedor';

				feed.push({
					id: `rent-entry-${r.id}`,
					data: r.entry_date,
					tipo: 'Entrada (Locação)',
					item: itemName || 'Equipamento',
					qtd: r.quantity,
					responsavel: fornecedor,
					origemDestino: r.description ? `Locação - ${r.description}` : 'Início Locação'
				});

				if (r.status === 'RETURNED' && r.exit_date) {
					feed.push({
						id: `rent-exit-${r.id}`,
						data: r.exit_date,
						tipo: 'Devolução (Locação)',
						item: itemName || 'Equipamento',
						qtd: r.quantity,
						responsavel: fornecedor,
						origemDestino: 'Fim Locação'
					});
				}
			});

			feed.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
			setMovimentacoes(feed);

		} catch (error: any) {
			console.error('Error fetching movements:', error);
			showToast(error.message || 'Erro ao buscar movimentações', 'error');
		} finally {
			setIsLoading(false);
		}
	};

	const getTipoStyle = (tipo: string) => {
		if (tipo.includes('Entrada') || tipo.includes('Devolução')) {
			return 'bg-green-500/10 text-green-500';
		}
		if (
			tipo.includes('Saída') ||
			tipo.includes('Empréstimo') ||
			tipo.includes('Entrega')
		) {
			return 'bg-blue-500/10 text-blue-500';
		}
		return 'bg-zinc-500/10 text-zinc-500';
	};

	const filteredMovimentacoes = movimentacoes.filter((mov) => {
		const searchLower = searchTerm.toLowerCase();
		return (
			mov.item.toLowerCase().includes(searchLower) ||
			mov.responsavel.toLowerCase().includes(searchLower) ||
			mov.tipo.toLowerCase().includes(searchLower)
		);
	});

	return (
		<ERPLayout>
			<div className="space-y-6 flex flex-col h-full relative w-full">
				<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
					<div>
						<h1 className="text-2xl font-bold text-text-main flex items-center gap-2">
							<ArrowRightLeft className="text-primary" />{' '}
							Movimentações da Obra
						</h1>
						<p className="text-text-muted mt-1">
							Histórico global de todas as entradas, saídas,
							locações e empréstimos
						</p>
					</div>
				</div>

				<div className="bg-surface border border-border rounded-sm shadow-sm p-4 sm:p-6 overflow-hidden">
					<div className="flex flex-col sm:flex-row gap-4 mb-6">
						<div className="relative flex-1">
							<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
								<Search size={18} className="text-text-muted" />
							</div>
							<input
								type="text"
								placeholder="Buscar por item, responsável ou tipo..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-text-main focus:outline-none focus:border-primary transition-colors"
							/>
						</div>
						<div className="relative flex gap-2">
							<button
								onClick={() => setShowFilters(!showFilters)}
								className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
									showFilters
										? 'bg-primary/10 border-primary text-primary'
										: 'bg-background border-border text-text-main hover:border-primary/50'
								}`}
							>
								<Settings2 size={20} />
								<span>Filtros</span>
							</button>

							{showFilters && (
								<div className="absolute right-0 top-full mt-2 w-72 bg-surface border border-border rounded-xl shadow-xl z-50 p-4 animate-in fade-in slide-in-from-top-2 text-left z-[100]">
									<h3 className="text-sm font-medium mb-3 text-text-main border-b border-border pb-2">
										Filtros
									</h3>
									<div className="space-y-4">
										<div>
											<label className="block text-xs font-medium text-text-muted mb-1">
												Período
											</label>
											<select className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:border-primary text-text-main">
												<option>Últimos 7 dias</option>
												<option>Últimos 30 dias</option>
												<option>Todos</option>
											</select>
										</div>
									</div>
								</div>
							)}
						</div>
					</div>

					<div className="overflow-x-auto bg-surface border border-border rounded-lg">
						<table className="w-full text-left [&_th]:border-b [&_th]:border-border [&_td]:border-b [&_td]:border-border [&_tbody_tr:last-child_td]:border-b-0">
							<thead>
								<tr className="border-b border-border bg-background/50">
									<th className="py-3 px-4 text-sm font-semibold text-text-muted rounded-tl-lg">
										Data/Hora
									</th>
									<th className="py-3 px-4 text-sm font-semibold text-text-muted">
										Tipo
									</th>
									<th className="py-3 px-4 text-sm font-semibold text-text-muted">
										Item Movimentado
									</th>
									<th className="py-3 px-4 text-sm font-semibold text-text-muted text-center">
										Qtd
									</th>
									<th className="py-3 px-4 text-sm font-semibold text-text-muted">
										Responsável
									</th>
									<th className="py-3 px-4 text-sm font-semibold text-text-muted rounded-tr-lg">
										Origem/Destino/Obs
									</th>
								</tr>
							</thead>
							<tbody>
								{isLoading ? (
									<tr>
										<td colSpan={6} className="py-8 text-center text-text-muted">
											Carregando movimentações...
										</td>
									</tr>
								) : filteredMovimentacoes.length === 0 ? (
									<tr>
										<td colSpan={6} className="py-8 text-center text-text-muted">
											Nenhuma movimentação encontrada.
										</td>
									</tr>
								) : (
									filteredMovimentacoes.map((mov) => (
										<tr
											key={mov.id}
											className="border-b border-border hover:bg-black/5 dark:hover:bg-white/5 transition-colors group"
										>
											<td className="py-3 px-4 text-text-main whitespace-nowrap">
												{mov.data ? format(new Date(mov.data), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : '-'}
											</td>
											<td className="py-3 px-4">
												<span
													className={`inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-bold ${getTipoStyle(mov.tipo)}`}
												>
													{mov.tipo}
												</span>
											</td>
											<td className="py-3 px-4 font-medium text-text-main">
												{mov.item}
											</td>
											<td className="py-3 px-4 text-center font-bold text-text-main">
												{mov.qtd}
											</td>
											<td className="py-3 px-4 text-text-main">
												{mov.responsavel}
											</td>
											<td className="py-3 px-4 text-text-muted text-sm max-w-xs truncate" title={mov.origemDestino}>
												{mov.origemDestino}
											</td>
										</tr>
									))
								)}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</ERPLayout>
	);
}
