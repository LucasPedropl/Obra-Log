import React, { useState, useEffect, useMemo } from 'react';
import { ERPLayout } from '../../components/layout/ERPLayout';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import {
	Building2,
	Plus,
	ArrowRight,
	Loader2,
	AlertCircle,
	Wrench,
	ShieldAlert,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { env } from '../../config/env';
import { supabase } from '../../config/supabase';

export default function ObraLogDashboard() {
	const { showToast } = useToast();
	const { isAllowed } = useAuth();
	const navigate = useNavigate();

	const [obras, setObras] = useState<any[]>([]);
	const [toolLoans, setToolLoans] = useState<any[]>([]);
	const [epiWithdrawals, setEpiWithdrawals] = useState<any[]>([]);

	const [selectedObraId, setSelectedObraId] = useState<string>('ALL');
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchDashboardData = async () => {
			try {
				setLoading(true);
				const companyId = localStorage.getItem('selectedCompanyId');
				if (!companyId) return;

				const { data: sessionData } = await supabase.auth.getSession();
				const token = sessionData?.session?.access_token || '';

				// Fetch construction sites from our API
				const res = await fetch(
					`${env.VITE_API_URL}/api/construction_sites?company_id=${companyId}`,
					{
						headers: { Authorization: `Bearer ${token}` },
					},
				);

				if (!res.ok) throw new Error('Falha ao carregar as obras');
				const obrasData = await res.json();
				setObras(obrasData);

				if (obrasData.length > 0) {
					const siteIds = obrasData.map((o: any) => o.id);

					// Fetch Tool Loans
					const { data: toolsData } = await supabase
						.from('tool_loans')
						.select(
							'id, quantity, loan_date, status, site_id, collaborator_id, collaborators(name), site_inventory(catalogs(name))',
						)
						.in('site_id', siteIds);

					if (toolsData) setToolLoans(toolsData);

					// Fetch EPI Withdrawals
					const { data: episData } = await supabase
						.from('epi_withdrawals')
						.select(
							'id, quantity, withdrawal_date, site_id, collaborator_id, collaborators(name), catalogs(name)',
						)
						.in('site_id', siteIds);

					if (episData) setEpiWithdrawals(episData);
				}
			} catch (err: any) {
				showToast(err.message, 'error');
			} finally {
				setLoading(false);
			}
		};

		fetchDashboardData();
	}, []);

	// Filtering Data based on selected Obra
	const filteredTools = useMemo(() => {
		if (selectedObraId === 'ALL') return toolLoans;
		return toolLoans.filter((t) => t.site_id === selectedObraId);
	}, [toolLoans, selectedObraId]);

	const filteredEpis = useMemo(() => {
		if (selectedObraId === 'ALL') return epiWithdrawals;
		return epiWithdrawals.filter((e) => e.site_id === selectedObraId);
	}, [epiWithdrawals, selectedObraId]);

	const filteredObras = useMemo(() => {
		if (selectedObraId === 'ALL') return obras;
		return obras.filter((o) => o.id === selectedObraId);
	}, [obras, selectedObraId]);

	// Aggregations & Metrics
	const activeLoans = filteredTools.filter((t) => t.status === 'OPEN');

	const isLate = (dateString: string) => {
		const diffMs = new Date().getTime() - new Date(dateString).getTime();
		const diffDays = diffMs / (1000 * 60 * 60 * 24);
		return diffDays > 7; // consider > 7 days as late
	};

	const lateLoans = activeLoans.filter((t) => isLate(t.loan_date));

	// Top Collaborators
	const topCollaborators = useMemo(() => {
		const counts: Record<
			string,
			{ name: string; tools: number; epis: number; total: number }
		> = {};

		filteredTools.forEach((t) => {
			const cId = t.collaborator_id;
			if (!counts[cId])
				counts[cId] = {
					name: t.collaborators?.name || 'Desconhecido',
					tools: 0,
					epis: 0,
					total: 0,
				};
			counts[cId].tools += t.quantity || 1;
			counts[cId].total += t.quantity || 1;
		});

		filteredEpis.forEach((e) => {
			const cId = e.collaborator_id;
			if (!counts[cId])
				counts[cId] = {
					name: e.collaborators?.name || 'Desconhecido',
					tools: 0,
					epis: 0,
					total: 0,
				};
			counts[cId].epis += e.quantity || 1;
			counts[cId].total += e.quantity || 1;
		});

		return Object.values(counts)
			.sort((a, b) => b.total - a.total)
			.slice(0, 5);
	}, [filteredTools, filteredEpis]);

	const maxItems = Math.max(...topCollaborators.map((c) => c.total), 1); // for calculating bar width percentage

	return (
		<ERPLayout>
			<div className="space-y-6 w-full flex flex-col h-full">
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
					<div>
						<h1 className="text-2xl font-bold text-text-main">
							Dashboard de Controle
						</h1>
						<p className="text-text-muted mt-1">
							Visão geral de empréstimos, EPIs e recursos da sua
							operação.
						</p>
					</div>
					<div className="flex items-center gap-3">
						<select
							value={selectedObraId}
							onChange={(e) => setSelectedObraId(e.target.value)}
							className="px-4 py-2 bg-surface text-text-main border border-border rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary/50 outline-none"
						>
							<option value="ALL">Todas as Obras</option>
							{obras.map((o) => (
								<option key={o.id} value={o.id}>
									{o.name}
								</option>
							))}
						</select>

						{isAllowed('obras', 'create') && (
							<Link
								to="/app/obras/nova"
								className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
							>
								<Plus size={18} />
								Nova Obra
							</Link>
						)}
					</div>
				</div>

				{loading ? (
					<div className="flex justify-center items-center py-20 flex-1">
						<Loader2
							size={40}
							className="text-primary animate-spin"
						/>
					</div>
				) : (
					<div className="space-y-6">
						<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
							<div className="bg-surface border border-border rounded-xl p-5 shadow-sm">
								<div className="text-text-muted text-sm font-medium mb-1">
									Total de Obras Cadastradas
								</div>
								<div className="text-3xl font-bold text-text-main">
									{obras.length}
								</div>
							</div>
							<div className="bg-surface border border-border rounded-xl p-5 shadow-sm">
								<div className="text-text-muted text-sm font-medium mb-1">
									Retiradas de EPIs
								</div>
								<div className="text-3xl font-bold text-blue-500">
									{filteredEpis.length}
								</div>
							</div>
							<div className="bg-surface border border-border rounded-xl p-5 shadow-sm">
								<div className="text-text-muted text-sm font-medium mb-1">
									Emp. Ferramentas Ativos
								</div>
								<div className="text-3xl font-bold text-blue-500">
									{activeLoans.length}
								</div>
							</div>
							<div className="bg-surface border border-red-500/30 rounded-xl p-5 shadow-sm relative overflow-hidden">
								<div className="absolute top-0 right-0 p-4 opacity-10">
									<AlertCircle
										size={64}
										className="text-red-500"
									/>
								</div>
								<div className="text-red-500/80 text-sm font-medium mb-1 relative z-10">
									Empréstimos Atrasados (&gt; 7 dias)
								</div>
								<div className="text-3xl font-bold text-red-500 relative z-10">
									{lateLoans.length}
								</div>
							</div>
						</div>

						<div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
							<div className="lg:col-span-8 bg-surface border border-border rounded-xl p-6 shadow-sm flex flex-col">
								<h2 className="text-base font-bold text-text-main mb-6 flex items-center gap-2">
									<Wrench
										size={18}
										className="text-primary"
									/>{' '}
									Colaboradores com mais Retiradas
									(Ferramentas + EPIs)
								</h2>
								<div className="flex-1 space-y-5">
									{topCollaborators.length === 0 ? (
										<div className="text-center py-10 text-text-muted text-sm">
											Nenhum dado encontrado para o filtro
											atual.
										</div>
									) : (
										topCollaborators.map((c, i) => (
											<div
												key={i}
												className="flex flex-col gap-2"
											>
												<div className="flex justify-between text-sm">
													<span className="font-medium text-text-main">
														{c.name}
													</span>
													<span className="text-text-muted">
														{c.total} Itens
													</span>
												</div>
												<div className="w-full bg-background rounded-full h-3 overflow-hidden flex">
													<div
														className="bg-blue-500 h-full transition-all duration-500"
														style={{
															width: `${(c.tools / maxItems) * 100}%`,
														}}
														title={`${c.tools} Ferramentas`}
													/>
													<div
														className="bg-emerald-500 h-full transition-all duration-500"
														style={{
															width: `${(c.epis / maxItems) * 100}%`,
														}}
														title={`${c.epis} EPIs`}
													/>
												</div>
												<div className="flex justify-between text-xs text-text-muted mt-1">
													<span>
														Ferramentas:{' '}
														<span className="font-medium text-blue-500">
															{c.tools}
														</span>
													</span>
													<span>
														EPIs:{' '}
														<span className="font-medium text-emerald-500">
															{c.epis}
														</span>
													</span>
												</div>
											</div>
										))
									)}
								</div>
							</div>

							<div className="lg:col-span-4 bg-surface border border-border rounded-xl p-6 shadow-sm flex flex-col">
								<h2 className="text-base font-bold text-text-main mb-6 flex items-center gap-2">
									<AlertCircle
										size={18}
										className="text-red-500"
									/>{' '}
									Ferramentas em Atraso
								</h2>
								<div className="flex-1 overflow-y-auto pr-2 space-y-4 max-h-[400px]">
									{lateLoans.length === 0 ? (
										<div className="text-center py-10 text-text-muted text-sm flex flex-col items-center">
											<ShieldAlert
												size={32}
												className="opacity-20 mb-3"
											/>
											Nenhum empréstimo em atraso
											detectado.
										</div>
									) : (
										lateLoans.map((loan) => (
											<div
												key={loan.id}
												className="p-3 rounded-lg border border-red-500/20 bg-red-500/5"
											>
												<div className="font-medium text-sm text-text-main mb-1">
													{loan.site_inventory
														?.catalogs?.name ||
														'Ferramenta Desconhecida'}{' '}
													({loan.quantity}x)
												</div>
												<div className="text-xs text-text-muted mb-2">
													Com:{' '}
													<span className="font-medium">
														{loan.collaborators
															?.name ||
															'Desconhecido'}
													</span>
												</div>
												<div className="flex justify-between items-center text-xs">
													<span className="text-red-600/80 font-medium">
														Atrasado
													</span>
													<span className="text-text-muted">
														{new Date(
															loan.loan_date,
														).toLocaleDateString(
															'pt-BR',
														)}
													</span>
												</div>
											</div>
										))
									)}
								</div>
							</div>
						</div>

						<div className="pb-10">
							<h2 className="text-base font-bold text-text-main mb-4">
								Obras Filtradas ({filteredObras.length})
							</h2>

							{filteredObras.length === 0 ? (
								<div className="bg-surface border border-border rounded-xl p-10 text-center">
									<Building2
										size={40}
										className="mx-auto text-text-muted/30 mb-3"
									/>
									<h3 className="text-base font-bold text-text-main mb-1">
										Nenhuma obra encontrada
									</h3>
									<p className="text-text-muted text-sm">
										Ajuste o filtro ou cadastre uma nova
										obra.
									</p>
								</div>
							) : (
								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
									{filteredObras.map((obra) => (
										<div
											key={obra.id}
											onClick={() =>
												isAllowed(
													'obras.pages.visao_geral',
													'view',
												) || isAllowed('obras', 'view')
													? navigate(
															`/app/obras/${obra.id}/visao-geral`,
														)
													: null
											}
											className={`bg-surface border border-border rounded-xl p-4 flex flex-col transition-colors ${
												isAllowed(
													'obras.pages.visao_geral',
													'view',
												) || isAllowed('obras', 'view')
													? 'cursor-pointer hover:border-primary/50 hover:bg-primary/5'
													: 'opacity-80'
											}`}
										>
											<div className="flex items-center gap-3 mb-3">
												<div className="p-2 bg-background rounded-lg text-primary">
													<Building2 size={20} />
												</div>
												<h3
													className="text-sm font-bold text-text-main line-clamp-1"
													title={obra.name}
												>
													{obra.name}
												</h3>
											</div>
											<div className="mt-auto pt-3 border-t border-border flex justify-between items-center text-xs">
												<span className="text-text-muted">
													Entrar no painel
												</span>
												<ArrowRight
													size={14}
													className="text-text-muted"
												/>
											</div>
										</div>
									))}
								</div>
							)}
						</div>
					</div>
				)}
			</div>
		</ERPLayout>
	);
}
