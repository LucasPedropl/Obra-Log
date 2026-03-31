import React, { useState, useEffect } from 'react';
import { ERPLayout } from '../../../../components/layout/ERPLayout';
import { useParams } from 'react-router-dom';
import { supabase } from '../../../../config/supabase';
import { useToast } from '../../../../context/ToastContext';
import {
	Search,
	History,
	Settings2,
	FilterX,
	Wrench,
	Users,
	User,
	ChevronDown,
} from 'lucide-react';
import { LoanDetailsModal } from './LoanDetailsModal';

interface ToolLoanHistory {
	id: string;
	inventory_id: string;
	collaborator_id: string;
	quantity: number;
	loan_date: string;
	returned_date: string | null;
	notes_on_loan: string | null;
	notes_on_return: string | null;
	photo_url?: string | null;
	return_photo_url?: string | null;
	status: 'OPEN' | 'RETURNED' | 'LOST';
	site_inventory?: {
		catalogs?: {
			name: string;
			code: string;
		};
	};
	collaborators?: {
		name: string;
	};
}

export default function FerramentasHistorico() {
	const { id } = useParams();
	const { showToast } = useToast();
	const [searchTerm, setSearchTerm] = useState('');
	const [showFilters, setShowFilters] = useState(false);
	const [filterStatus, setFilterStatus] = useState('all');

	const [historico, setHistorico] = useState<ToolLoanHistory[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	const [activeTab, setActiveTab] = useState<
		'geral' | 'colaboradores' | 'ferramentas'
	>('geral');
	const [selectedColaborador, setSelectedColaborador] = useState<
		string | null
	>(null);
	const [selectedFerramenta, setSelectedFerramenta] = useState<string | null>(
		null,
	);
	const [viewLoanDetails, setViewLoanDetails] =
		useState<ToolLoanHistory | null>(null);

	const fetchHistorico = async () => {
		if (!id) return;
		try {
			setIsLoading(true);
			const { data, error } = await supabase
				.from('tool_loans')
				.select(
					`
					id, quantity, loan_date, returned_date, notes_on_loan, notes_on_return, photo_url, return_photo_url, status, inventory_id, collaborator_id,
					site_inventory (
						catalogs ( name, code )
					),
					collaborators ( name )
				`,
				)
				.eq('site_id', id)
				.order('loan_date', { ascending: false });

			if (error) throw error;
			setHistorico((data as any) || []);
		} catch (err) {
			console.error('Error fetching history:', err);
			showToast('Erro ao carregar histórico', 'error');
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchHistorico();
	}, [id]);

	const filteredHistorico = historico.filter((hist) => {
		const searchLower = searchTerm.toLowerCase();
		const toolName =
			hist.site_inventory?.catalogs?.name?.toLowerCase() || '';
		const collabName = hist.collaborators?.name?.toLowerCase() || '';

		const matchesSearch =
			toolName.includes(searchLower) || collabName.includes(searchLower);

		let matchesStatus = true;
		if (filterStatus !== 'all') {
			if (filterStatus === 'aberto') {
				matchesStatus = hist.status === 'OPEN';
			} else if (filterStatus === 'ok') {
				matchesStatus = hist.status === 'RETURNED'; // Could also check avaria
			}
		}

		return matchesSearch && matchesStatus;
	});

	const colaboradoresMap = new Map();
	historico.forEach((hist) => {
		if (hist.collaborator_id) {
			if (!colaboradoresMap.has(hist.collaborator_id)) {
				colaboradoresMap.set(hist.collaborator_id, {
					id: hist.collaborator_id,
					name: hist.collaborators?.name || 'Desconhecido',
					totalLoans: 0,
					activeLoans: 0,
					historico: [],
				});
			}
			const c = colaboradoresMap.get(hist.collaborator_id);
			c.totalLoans += 1;
			if (hist.status === 'OPEN') c.activeLoans += 1;
			c.historico.push(hist);
		}
	});

	const colaboradoresList = Array.from(colaboradoresMap.values()).filter(
		(c) => c.name.toLowerCase().includes(searchTerm.toLowerCase()),
	);

	const ferramentasMap = new Map();
	historico.forEach((hist) => {
		if (hist.inventory_id) {
			if (!ferramentasMap.has(hist.inventory_id)) {
				ferramentasMap.set(hist.inventory_id, {
					id: hist.inventory_id,
					name:
						hist.site_inventory?.catalogs?.name ||
						'Ferramenta Desconhecida',
					totalLoans: 0,
					activeLoans: 0,
					historico: [],
				});
			}
			const f = ferramentasMap.get(hist.inventory_id);
			f.totalLoans += 1;
			if (hist.status === 'OPEN') f.activeLoans += 1;
			f.historico.push(hist);
		}
	});

	const ferramentasList = Array.from(ferramentasMap.values()).filter((f) =>
		f.name.toLowerCase().includes(searchTerm.toLowerCase()),
	);

	return (
		<ERPLayout>
			<div className="space-y-6 flex flex-col h-full relative w-full">
				<div>
					<h1 className="text-2xl font-bold text-text-main flex items-center gap-2">
						<History className="text-primary" /> Histórico de
						Ferramentas
					</h1>
					<p className="text-text-muted mt-1">
						Registro visual de todas as movimentações e devoluções
					</p>
				</div>

				<div className="bg-surface border border-border rounded-sm shadow-sm p-4 sm:p-6 overflow-hidden min-h-[400px]">
					{!selectedColaborador && !selectedFerramenta && (
						<div className="flex border-b border-border mb-6 w-full">
							<button
								onClick={() => setActiveTab('geral')}
								className={`flex-1 flex justify-center items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 ${
									activeTab === 'geral'
										? 'border-primary text-primary'
										: 'border-transparent text-text-muted hover:text-text-main'
								}`}
							>
								<History size={18} /> Histórico Geral
							</button>
							<button
								onClick={() => setActiveTab('colaboradores')}
								className={`flex-1 flex justify-center items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 ${
									activeTab === 'colaboradores'
										? 'border-primary text-primary'
										: 'border-transparent text-text-muted hover:text-text-main'
								}`}
							>
								<Users size={18} /> Por Colaborador
							</button>
							<button
								onClick={() => setActiveTab('ferramentas')}
								className={`flex-1 flex justify-center items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 ${
									activeTab === 'ferramentas'
										? 'border-primary text-primary'
										: 'border-transparent text-text-muted hover:text-text-main'
								}`}
							>
								<Wrench size={18} /> Por Ferramenta
							</button>
						</div>
					)}

					<div className="flex flex-col sm:flex-row gap-4 mb-6">
						<div className="relative flex-1">
							<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
								<Search size={18} className="text-text-muted" />
							</div>
							<input
								type="text"
								placeholder={
									selectedColaborador
										? 'Buscar no histórico do colaborador...'
										: selectedFerramenta
											? 'Buscar no histórico da ferramenta...'
											: activeTab === 'colaboradores'
												? 'Buscar colaborador...'
												: activeTab === 'ferramentas'
													? 'Buscar ferramenta...'
													: 'Buscar por ferramenta ou data...'
								}
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-text-main focus:outline-none focus:border-primary transition-colors"
							/>
						</div>
						{activeTab === 'geral' &&
							!selectedColaborador &&
							!selectedFerramenta && (
								<div className="relative flex gap-2">
									<button
										onClick={() =>
											setShowFilters(!showFilters)
										}
										className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
											showFilters ||
											filterStatus !== 'all'
												? 'bg-primary/10 border-primary text-primary'
												: 'bg-background border-border text-text-main hover:border-primary/50'
										}`}
									>
										<Settings2 size={20} />
										<span>Filtros</span>
									</button>

									{showFilters && (
										<div className="absolute right-0 top-full mt-2 w-72 bg-surface border border-border rounded-xl shadow-xl z-50 p-4 animate-in fade-in slide-in-from-top-2 text-left">
											<div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
												<h3 className="font-semibold text-text-main">
													Filtros
												</h3>
												{filterStatus !== 'all' && (
													<button
														onClick={() =>
															setFilterStatus(
																'all',
															)
														}
														className="text-xs flex items-center gap-1 text-red-500 hover:text-red-600 transition-colors"
													>
														<FilterX size={14} />
														Limpar
													</button>
												)}
											</div>
											<div className="space-y-4">
												<div>
													<label className="block text-xs font-medium text-text-muted mb-1">
														Status de Devolução
													</label>
													<select
														value={filterStatus}
														onChange={(e) =>
															setFilterStatus(
																e.target.value,
															)
														}
														className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:border-primary text-text-main"
													>
														<option value="all">
															Todos
														</option>
														<option value="aberto">
															Em Aberto
														</option>
														<option value="ok">
															Devolvidos
														</option>
													</select>
												</div>
											</div>
										</div>
									)}
								</div>
							)}
					</div>

					<div className="overflow-x-auto bg-surface border border-border rounded-lg">
						{isLoading ? (
							<div className="p-8 flex justify-center items-center h-48">
								<div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
							</div>
						) : activeTab === 'geral' &&
						  !selectedColaborador &&
						  !selectedFerramenta ? (
							filteredHistorico.length === 0 ? (
								<div className="p-12 text-center flex flex-col items-center justify-center">
									<div className="w-16 h-16 bg-background border border-border rounded-full flex items-center justify-center mb-4">
										<History className="w-8 h-8 text-text-muted" />
									</div>
									<p className="text-text-main font-medium mb-1">
										Nenhum registro encontrado
									</p>
									<p className="text-text-muted text-sm max-w-md">
										O histórico de movimentações está vazio
										ou não corresponde aos filtros atuais.
									</p>
								</div>
							) : (
								<table className="w-full text-left [&_th]:border-b [&_th]:border-border [&_td]:border-b [&_td]:border-border [&_tbody_tr:last-child_td]:border-b-0">
									<thead>
										<tr className="border-b border-border bg-background/50">
											<th className="py-3 px-4 text-sm font-semibold text-text-muted rounded-tl-lg">
												Data/Hora Retirada
											</th>
											<th className="py-3 px-4 text-sm font-semibold text-text-muted">
												Ferramenta
											</th>
											<th className="py-3 px-4 text-sm font-semibold text-text-muted">
												Colaborador (Responsável)
											</th>
											<th className="py-3 px-4 text-sm font-semibold text-text-muted">
												Qtd
											</th>
											<th className="py-3 px-4 text-sm font-semibold text-text-muted">
												Status da Devolução
											</th>
											<th className="py-3 px-4 text-sm font-semibold text-text-muted text-right rounded-tr-lg">
												Data/Hora Devolução
											</th>
										</tr>
									</thead>
									<tbody>
										{filteredHistorico.map((hist) => (
											<tr
												key={hist.id}
												onClick={() =>
													setViewLoanDetails(hist)
												}
												className="cursor-pointer border-b border-border hover:bg-black/5 dark:hover:bg-white/5 even:bg-black/[0.02] dark:even:bg-white/[0.02] transition-colors group"
											>
												<td className="py-3 px-4 text-text-main text-sm flex flex-col">
													<span>
														{new Date(
															hist.loan_date,
														).toLocaleDateString(
															'pt-BR',
														)}
													</span>
													<span className="text-xs text-text-muted">
														{new Date(
															hist.loan_date,
														).toLocaleTimeString(
															'pt-BR',
															{
																hour: '2-digit',
																minute: '2-digit',
															},
														)}
													</span>
												</td>
												<td className="py-3 px-4">
													<div className="flex items-center gap-3">
														<div className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center">
															<Wrench className="w-4 h-4 text-text-muted" />
														</div>
														<div>
															<div className="font-medium text-text-main text-sm">
																{
																	hist
																		.site_inventory
																		?.catalogs
																		?.name
																}
															</div>
															<div className="text-xs text-text-muted">
																{
																	hist
																		.site_inventory
																		?.catalogs
																		?.code
																}
															</div>
														</div>
													</div>
												</td>
												<td className="py-3 px-4 text-text-main text-sm">
													{hist.collaborators?.name}
												</td>
												<td className="py-3 px-4 text-text-main text-sm">
													{hist.quantity}
												</td>
												<td className="py-3 px-4">
													<span
														className={`inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-medium ${
															hist.status ===
															'OPEN'
																? 'bg-yellow-500/10 text-yellow-600'
																: hist.status ===
																	  'RETURNED'
																	? 'bg-green-500/10 text-green-500'
																	: 'bg-red-500/10 text-red-500'
														}`}
													>
														{hist.status === 'OPEN'
															? 'Em Uso'
															: hist.status ===
																  'RETURNED'
																? 'Devolvido'
																: 'Extraviado'}
													</span>
												</td>
												<td className="py-3 px-4 text-right text-text-muted text-sm">
													{hist.returned_date ? (
														<div className="flex flex-col items-end">
															<span>
																{new Date(
																	hist.returned_date,
																).toLocaleDateString(
																	'pt-BR',
																)}
															</span>
															<span className="text-xs">
																{new Date(
																	hist.returned_date,
																).toLocaleTimeString(
																	'pt-BR',
																	{
																		hour: '2-digit',
																		minute: '2-digit',
																	},
																)}
															</span>
														</div>
													) : (
														'-'
													)}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							)
						) : activeTab === 'colaboradores' &&
						  !selectedColaborador ? (
							colaboradoresList.length === 0 ? (
								<div className="p-12 text-center flex flex-col items-center justify-center">
									<div className="w-16 h-16 bg-background border border-border rounded-full flex items-center justify-center mb-4">
										<Users className="w-8 h-8 text-text-muted" />
									</div>
									<p className="text-text-main font-medium mb-1">
										Nenhum colaborador encontrado
									</p>
									<p className="text-text-muted text-sm max-w-md">
										Não há histórico de empréstimo para os
										colaboradores.
									</p>
								</div>
							) : (
								<table className="w-full text-left [&_th]:border-b [&_th]:border-border [&_td]:border-b [&_td]:border-border [&_tbody_tr:last-child_td]:border-b-0">
									<thead>
										<tr className="border-b border-border bg-background/50">
											<th className="py-3 px-4 text-sm font-semibold text-text-muted rounded-tl-lg">
												Colaborador
											</th>
											<th className="py-3 px-4 text-sm font-semibold text-text-muted text-center">
												Total Empréstimos
											</th>
											<th className="py-3 px-4 text-sm font-semibold text-text-muted text-center">
												Empréstimos Ativos
											</th>
											<th className="py-3 px-4 text-sm font-semibold text-text-muted text-right rounded-tr-lg">
												Histórico
											</th>
										</tr>
									</thead>
									<tbody>
										{colaboradoresList.map((colab) => (
											<tr
												key={colab.id}
												className="border-b border-border hover:bg-black/5 dark:hover:bg-white/5 even:bg-black/[0.02] dark:even:bg-white/[0.02] transition-colors group cursor-pointer"
												onClick={() =>
													setSelectedColaborador(
														colab.id,
													)
												}
											>
												<td className="py-3 px-4">
													<div className="flex items-center gap-3">
														<div className="w-10 h-10 rounded-lg bg-background border border-border flex items-center justify-center">
															<User className="w-5 h-5 text-text-muted" />
														</div>
														<span className="font-medium text-text-main">
															{colab.name}
														</span>
													</div>
												</td>
												<td className="py-3 px-4 text-center text-sm text-text-main">
													{colab.totalLoans}
												</td>
												<td className="py-3 px-4 text-center">
													<span
														className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-bold ${colab.activeLoans > 0 ? 'bg-amber-500/10 text-amber-600' : 'bg-green-500/10 text-green-600'}`}
													>
														{colab.activeLoans}
													</span>
												</td>
												<td className="py-3 px-4 text-right">
													<button className="p-2 text-text-muted hover:text-primary transition-colors bg-background border border-border rounded-lg hover:border-primary/50">
														<History size={18} />
													</button>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							)
						) : activeTab === 'colaboradores' &&
						  selectedColaborador ? (
							<div className="p-4 sm:p-6">
								<div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
									<div>
										<h2 className="text-xl font-bold text-text-main flex items-center gap-2">
											<button
												onClick={() =>
													setSelectedColaborador(null)
												}
												className="p-1 hover:bg-background rounded-lg text-text-muted transition-colors mr-2"
											>
												<ChevronDown
													className="rotate-90"
													size={20}
												/>
											</button>
											<User
												className="text-primary"
												size={24}
											/>
											Histórico de:{' '}
											{
												colaboradoresList.find(
													(c) =>
														c.id ===
														selectedColaborador,
												)?.name
											}
										</h2>
									</div>
								</div>

								<div className="space-y-4">
									{colaboradoresList
										.find(
											(c) => c.id === selectedColaborador,
										)
										?.historico.filter(
											(h: any) =>
												h.site_inventory?.catalogs?.name
													?.toLowerCase()
													.includes(
														searchTerm.toLowerCase(),
													) ||
												h.status
													.toLowerCase()
													.includes(
														searchTerm.toLowerCase(),
													),
										)
										.map((hist: any) => (
											<div
												key={hist.id}
												onClick={() =>
													setViewLoanDetails(hist)
												}
												className="cursor-pointer bg-background border border-border p-4 rounded-xl flex flex-col sm:flex-row justify-between gap-4 hover:border-primary/50 transition-colors shadow-sm hover:shadow-md"
											>
												<div className="flex gap-4 items-start">
													<div className="w-12 h-12 rounded-lg bg-surface border border-border flex items-center justify-center shrink-0">
														<Wrench className="w-6 h-6 text-text-muted" />
													</div>
													<div>
														<h4 className="font-semibold text-text-main flex items-center gap-2">
															{
																hist
																	.site_inventory
																	?.catalogs
																	?.name
															}
															<span className="text-sm font-normal text-text-muted bg-surface px-2 py-0.5 rounded-full border border-border">
																Qtd:{' '}
																{hist.quantity}
															</span>
															<span
																className={`text-xs px-2 py-0.5 rounded-full font-medium ${
																	hist.status ===
																	'OPEN'
																		? 'bg-amber-500/10 text-amber-500'
																		: 'bg-green-500/10 text-green-500'
																}`}
															>
																{hist.status ===
																'OPEN'
																	? 'Em Uso'
																	: 'Devolvido'}
															</span>
														</h4>
														<div className="text-sm text-text-muted mt-2 space-y-1">
															<p>
																<strong>
																	Emprestado
																	em:
																</strong>{' '}
																{new Date(
																	hist.loan_date,
																).toLocaleString(
																	'pt-BR',
																)}
															</p>
															{hist.returned_date && (
																<p>
																	<strong>
																		Devolvido
																		em:
																	</strong>{' '}
																	{new Date(
																		hist.returned_date,
																	).toLocaleString(
																		'pt-BR',
																	)}
																</p>
															)}
														</div>
													</div>
												</div>
											</div>
										))}
								</div>
							</div>
						) : activeTab === 'ferramentas' &&
						  !selectedFerramenta ? (
							ferramentasList.length === 0 ? (
								<div className="p-12 text-center flex flex-col items-center justify-center">
									<div className="w-16 h-16 bg-background border border-border rounded-full flex items-center justify-center mb-4">
										<Wrench className="w-8 h-8 text-text-muted" />
									</div>
									<p className="text-text-main font-medium mb-1">
										Nenhuma ferramenta encontrada
									</p>
									<p className="text-text-muted text-sm max-w-md">
										Não há histórico de empréstimo para as
										ferramentas.
									</p>
								</div>
							) : (
								<table className="w-full text-left [&_th]:border-b [&_th]:border-border [&_td]:border-b [&_td]:border-border [&_tbody_tr:last-child_td]:border-b-0">
									<thead>
										<tr className="border-b border-border bg-background/50">
											<th className="py-3 px-4 text-sm font-semibold text-text-muted rounded-tl-lg">
												Ferramenta
											</th>
											<th className="py-3 px-4 text-sm font-semibold text-text-muted text-center">
												Total Empréstimos
											</th>
											<th className="py-3 px-4 text-sm font-semibold text-text-muted text-center">
												Empréstimos Ativos
											</th>
											<th className="py-3 px-4 text-sm font-semibold text-text-muted text-right rounded-tr-lg">
												Histórico
											</th>
										</tr>
									</thead>
									<tbody>
										{ferramentasList.map((ferr) => (
											<tr
												key={ferr.id}
												className="border-b border-border hover:bg-black/5 dark:hover:bg-white/5 even:bg-black/[0.02] dark:even:bg-white/[0.02] transition-colors group cursor-pointer"
												onClick={() =>
													setSelectedFerramenta(
														ferr.id,
													)
												}
											>
												<td className="py-3 px-4">
													<div className="flex items-center gap-3">
														<div className="w-10 h-10 rounded-lg bg-background border border-border flex items-center justify-center">
															<Wrench className="w-5 h-5 text-text-muted" />
														</div>
														<span className="font-medium text-text-main">
															{ferr.name}
														</span>
													</div>
												</td>
												<td className="py-3 px-4 text-center text-sm text-text-main">
													{ferr.totalLoans}
												</td>
												<td className="py-3 px-4 text-center">
													<span
														className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-bold ${ferr.activeLoans > 0 ? 'bg-amber-500/10 text-amber-600' : 'bg-green-500/10 text-green-600'}`}
													>
														{ferr.activeLoans}
													</span>
												</td>
												<td className="py-3 px-4 text-right">
													<button className="p-2 text-text-muted hover:text-primary transition-colors bg-background border border-border rounded-lg hover:border-primary/50">
														<History size={18} />
													</button>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							)
						) : activeTab === 'ferramentas' &&
						  selectedFerramenta ? (
							<div className="p-4 sm:p-6">
								<div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
									<div>
										<h2 className="text-xl font-bold text-text-main flex items-center gap-2">
											<button
												onClick={() =>
													setSelectedFerramenta(null)
												}
												className="p-1 hover:bg-background rounded-lg text-text-muted transition-colors mr-2"
											>
												<ChevronDown
													className="rotate-90"
													size={20}
												/>
											</button>
											<Wrench
												className="text-primary"
												size={24}
											/>
											Histórico de:{' '}
											{
												ferramentasList.find(
													(f) =>
														f.id ===
														selectedFerramenta,
												)?.name
											}
										</h2>
									</div>
								</div>

								<div className="space-y-4">
									{ferramentasList
										.find(
											(f) => f.id === selectedFerramenta,
										)
										?.historico.filter(
											(h: any) =>
												h.collaborators?.name
													?.toLowerCase()
													.includes(
														searchTerm.toLowerCase(),
													) ||
												h.status
													.toLowerCase()
													.includes(
														searchTerm.toLowerCase(),
													),
										)
										.map((hist: any) => (
											<div
												key={hist.id}
												onClick={() =>
													setViewLoanDetails(hist)
												}
												className="cursor-pointer bg-background border border-border p-4 rounded-xl flex flex-col sm:flex-row justify-between gap-4 hover:border-primary/50 transition-colors shadow-sm hover:shadow-md"
											>
												<div className="flex gap-4 items-start">
													<div className="w-12 h-12 rounded-lg bg-surface border border-border flex items-center justify-center shrink-0">
														<User className="w-6 h-6 text-text-muted" />
													</div>
													<div>
														<h4 className="font-semibold text-text-main flex items-center gap-2">
															{
																hist
																	.collaborators
																	?.name
															}
															<span className="text-sm font-normal text-text-muted bg-surface px-2 py-0.5 rounded-full border border-border">
																Qtd:{' '}
																{hist.quantity}
															</span>
															<span
																className={`text-xs px-2 py-0.5 rounded-full font-medium ${
																	hist.status ===
																	'OPEN'
																		? 'bg-amber-500/10 text-amber-500'
																		: 'bg-green-500/10 text-green-500'
																}`}
															>
																{hist.status ===
																'OPEN'
																	? 'Em Uso'
																	: 'Devolvido'}
															</span>
														</h4>
														<div className="text-sm text-text-muted mt-2 space-y-1">
															<p>
																<strong>
																	Emprestado
																	em:
																</strong>{' '}
																{new Date(
																	hist.loan_date,
																).toLocaleString(
																	'pt-BR',
																)}
															</p>
															{hist.returned_date && (
																<p>
																	<strong>
																		Devolvido
																		em:
																	</strong>{' '}
																	{new Date(
																		hist.returned_date,
																	).toLocaleString(
																		'pt-BR',
																	)}
																</p>
															)}
														</div>
													</div>
												</div>
											</div>
										))}
								</div>
							</div>
						) : null}
					</div>
				</div>
			</div>

			{viewLoanDetails && (
				<LoanDetailsModal
					loan={viewLoanDetails}
					onClose={() => setViewLoanDetails(null)}
				/>
			)}
		</ERPLayout>
	);
}
