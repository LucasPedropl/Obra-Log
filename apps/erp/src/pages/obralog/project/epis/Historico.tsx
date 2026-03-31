import React, { useState, useEffect } from 'react';
import { ERPLayout } from '../../../../components/layout/ERPLayout';
import { useParams } from 'react-router-dom';
import { supabase } from '../../../../config/supabase';
import { useToast } from '../../../../context/ToastContext';
import {
	Search,
	History,
	Users,
	ArrowLeft,
	Filter,
	ChevronDown,
	Shield,
	Eye,
	X,
} from 'lucide-react';

interface EpiWithdrawalHistory {
	id: string;
	site_id: string;
	collaborator_id: string;
	catalog_id: string;
	withdrawn_by: string;
	quantity: number;
	withdrawal_date: string;
	notes: string | null;
	photo_url?: string | null;
	catalogs?: {
		name: string;
		code: string;
	};
	collaborators?: {
		name: string;
		document: string;
		role_title: string;
	};
	auth_users?: {
		name?: string;
		email?: string;
	};
}

// Simple Modal for Details
function EpiDetailsModal({
	item,
	onClose,
}: {
	item: EpiWithdrawalHistory;
	onClose: () => void;
}) {
	return (
		<div
			className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
			onClick={onClose}
		>
			<div
				className="bg-surface border border-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="flex justify-between items-center p-5 border-b border-border">
					<h2 className="text-xl font-bold text-text-main flex items-center gap-2">
						<Shield className="text-primary" /> Detalhes da Entrega
						de EPI
					</h2>
					<button
						onClick={onClose}
						className="p-2 text-text-muted hover:bg-background rounded-lg transition-colors"
					>
						<X size={20} />
					</button>
				</div>
				<div className="p-6 space-y-6">
					<div className="grid grid-cols-2 gap-4">
						<div className="p-4 bg-background border border-border rounded-lg">
							<h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
								Colaborador
							</h3>
							<p className="font-medium text-text-main">
								{item.collaborators?.name || 'Não informado'}
							</p>
							<p className="text-sm text-text-muted">
								{item.collaborators?.role_title || 'N/A'}
							</p>
						</div>
						<div className="p-4 bg-background border border-border rounded-lg">
							<h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
								EPI
							</h3>
							<p className="font-medium text-text-main">
								{item.catalogs?.name || 'EPI Desconhecido'}
							</p>
							<p className="text-sm text-text-muted">
								Quantidade:{' '}
								<span className="font-bold text-primary">
									{item.quantity}
								</span>
							</p>
						</div>
					</div>
					<div className="p-4 bg-background border border-border rounded-lg">
						<h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
							Entrega
						</h3>
						<div className="grid grid-cols-1 gap-2 mt-2">
							<div>
								<span className="text-sm text-text-muted block">
									Data/Hora
								</span>
								<span className="text-sm font-medium text-text-main">
									{new Date(
										item.withdrawal_date,
									).toLocaleString('pt-BR')}
								</span>
							</div>
						</div>
						{item.notes && (
							<div className="mt-4 pt-4 border-t border-border">
								<span className="text-sm text-text-muted block">
									Observações
								</span>
								<p className="text-sm text-text-main">
									{item.notes}
								</p>
							</div>
						)}
					</div>
					{item.photo_url && (
						<div className="space-y-3">
							<h3 className="text-sm font-medium text-text-main border-b border-border pb-2">
								Evidências (Fotos)
							</h3>
							<div className="grid grid-cols-2 gap-3">
								{item.photo_url.split(',').map((url, i) => (
									<a
										key={i}
										href={url}
										target="_blank"
										rel="noreferrer"
										className="block relative aspect-video bg-background border border-border rounded-lg overflow-hidden group"
									>
										<img
											src={url}
											alt={`Evidência ${i + 1}`}
											className="w-full h-full object-cover"
											loading="lazy"
										/>
										<div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
											<span className="opacity-0 group-hover:opacity-100 bg-black/60 text-white px-2 py-1 rounded text-sm backdrop-blur-sm transition-opacity">
												Ver original
											</span>
										</div>
									</a>
								))}
							</div>
						</div>
					)}
				</div>
				<div className="p-5 border-t border-border flex justify-end">
					<button
						onClick={onClose}
						className="px-5 py-2 bg-background border border-border text-text-main rounded-lg hover:border-text-muted transition-colors font-medium"
					>
						Fechar
					</button>
				</div>
			</div>
		</div>
	);
}

export default function EPisHistorico() {
	const { id } = useParams();
	const { showToast } = useToast();
	const [activeTab, setActiveTab] = useState<
		'geral' | 'colaborador' | 'epis'
	>('geral');
	const [searchTerm, setSearchTerm] = useState('');
	const [selectedColaborador, setSelectedColaborador] = useState<
		string | null
	>(null);
	const [selectedEpi, setSelectedEpi] = useState<string | null>(null);
	const [viewDetails, setViewDetails] = useState<EpiWithdrawalHistory | null>(
		null,
	);

	const [historico, setHistorico] = useState<EpiWithdrawalHistory[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	const fetchHistorico = async () => {
		if (!id) return;
		try {
			setIsLoading(true);
			const { data, error } = await supabase
				.from('epi_withdrawals')
				.select(
					`
					*,
					catalogs ( name, code ),
					collaborators ( name, document, role_title )
				`,
				)
				.eq('site_id', id)
				.order('withdrawal_date', { ascending: false });

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

	const filteredHistorico = historico.filter((item) => {
		const searchLower = searchTerm.toLowerCase();
		const epiName = item.catalogs?.name?.toLowerCase() || '';
		const collabName = item.collaborators?.name?.toLowerCase() || '';
		return (
			epiName.includes(searchLower) || collabName.includes(searchLower)
		);
	});

	// Map for Colaboradores list
	const colaboradoresMap = new Map();
	historico.forEach((item) => {
		if (item.collaborator_id) {
			if (!colaboradoresMap.has(item.collaborator_id)) {
				colaboradoresMap.set(item.collaborator_id, {
					id: item.collaborator_id,
					name: item.collaborators?.name || 'Desconhecido',
					role: item.collaborators?.role_title || 'N/A',
					qtdEpis: 0,
					historico: [],
				});
			}
			const c = colaboradoresMap.get(item.collaborator_id);
			c.qtdEpis += item.quantity;
			c.historico.push(item);
		}
	});
	const listColaboradores = Array.from(colaboradoresMap.values()).filter(
		(c) => c.name.toLowerCase().includes(searchTerm.toLowerCase()),
	);

	// Map for EPIs list
	const episMap = new Map();
	historico.forEach((item) => {
		if (item.catalog_id) {
			if (!episMap.has(item.catalog_id)) {
				episMap.set(item.catalog_id, {
					id: item.catalog_id,
					name: item.catalogs?.name || 'EPI Desconhecido',
					code: item.catalogs?.code || '',
					qtdEntregue: 0,
					historico: [],
				});
			}
			const e = episMap.get(item.catalog_id);
			e.qtdEntregue += item.quantity;
			e.historico.push(item);
		}
	});
	const listEpis = Array.from(episMap.values()).filter((e) =>
		e.name.toLowerCase().includes(searchTerm.toLowerCase()),
	);

	const renderGeral = (listToRender = filteredHistorico) => (
		<div className="overflow-x-auto bg-surface border border-border rounded-lg">
			<table className="w-full text-left [&_th]:border-b [&_th]:border-border [&_td]:border-b [&_td]:border-border [&_tbody_tr:last-child_td]:border-b-0">
				<thead>
					<tr className="border-b border-border">
						<th className="py-3 px-4 text-sm font-semibold text-text-muted">
							Data/Hora
						</th>
						<th className="py-3 px-4 text-sm font-semibold text-text-muted">
							EPI Entregue
						</th>
						<th className="py-3 px-4 text-sm font-semibold text-text-muted">
							Qtd
						</th>
						<th className="py-3 px-4 text-sm font-semibold text-text-muted">
							Colaborador
						</th>
						<th className="py-3 px-4 text-sm font-semibold text-text-muted text-center">
							Ações
						</th>
					</tr>
				</thead>
				<tbody>
					{listToRender.length === 0 ? (
						<tr>
							<td
								colSpan={5}
								className="py-6 text-center text-text-muted"
							>
								Nenhum registro encontrado.
							</td>
						</tr>
					) : (
						listToRender.map((item) => (
							<tr
								key={item.id}
								className="border-b border-border hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
							>
								<td className="py-3 px-4 text-text-main text-sm">
									{new Date(
										item.withdrawal_date,
									).toLocaleString('pt-BR')}
								</td>
								<td className="py-3 px-4 font-medium text-text-main text-sm">
									{item.catalogs?.name}
								</td>
								<td className="py-3 px-4 font-medium text-text-main text-sm">
									{item.quantity}
								</td>
								<td className="py-3 px-4 text-text-main text-sm">
									{item.collaborators?.name}
								</td>
								<td className="py-3 px-4 text-center">
									<button
										onClick={() => setViewDetails(item)}
										title="Ver Detalhes"
										className="p-1.5 bg-background border border-border rounded-md text-text-muted hover:text-primary transition-colors"
									>
										<Eye size={16} />
									</button>
								</td>
							</tr>
						))
					)}
				</tbody>
			</table>
		</div>
	);

	const renderListaColaboradores = () => (
		<div className="overflow-x-auto bg-surface border border-border rounded-lg">
			<table className="w-full text-left [&_th]:border-b [&_th]:border-border [&_td]:border-b [&_td]:border-border [&_tbody_tr:last-child_td]:border-b-0">
				<thead>
					<tr className="bg-background/50">
						<th className="py-3 px-4 text-sm font-semibold text-text-muted">
							Colaborador
						</th>
						<th className="py-3 px-4 text-sm font-semibold text-text-muted">
							Função/Cargo
						</th>
						<th className="py-3 px-4 text-sm font-semibold text-text-muted">
							Total de EPIs Recebidos
						</th>
					</tr>
				</thead>
				<tbody>
					{listColaboradores.length === 0 ? (
						<tr>
							<td
								colSpan={3}
								className="py-6 text-center text-text-muted"
							>
								Nenhum colaborador encontrado.
							</td>
						</tr>
					) : (
						listColaboradores.map((colab) => (
							<tr
								key={colab.id}
								onClick={() => setSelectedColaborador(colab.id)}
								className="hover:bg-primary/5 transition-colors cursor-pointer group"
							>
								<td className="py-3 px-4 font-medium text-text-main text-sm">
									{colab.name}
								</td>
								<td className="py-3 px-4 text-text-muted text-sm border-x border-border">
									{colab.role}
								</td>
								<td className="py-3 px-4 text-text-main text-sm">
									<div className="flex items-center gap-2">
										<Shield
											size={16}
											className="text-primary"
										/>
										<span className="font-semibold">
											{colab.qtdEpis}
										</span>{' '}
										unidades
									</div>
								</td>
							</tr>
						))
					)}
				</tbody>
			</table>
		</div>
	);

	const renderListaEpis = () => (
		<div className="overflow-x-auto bg-surface border border-border rounded-lg">
			<table className="w-full text-left [&_th]:border-b [&_th]:border-border [&_td]:border-b [&_td]:border-border [&_tbody_tr:last-child_td]:border-b-0">
				<thead>
					<tr className="bg-background/50">
						<th className="py-3 px-4 text-sm font-semibold text-text-muted">
							EPI
						</th>
						<th className="py-3 px-4 text-sm font-semibold text-text-muted">
							Cód. Almoxarifado
						</th>
						<th className="py-3 px-4 text-sm font-semibold text-text-muted">
							Total Entregue (Unidades)
						</th>
					</tr>
				</thead>
				<tbody>
					{listEpis.length === 0 ? (
						<tr>
							<td
								colSpan={3}
								className="py-6 text-center text-text-muted"
							>
								Nenhum EPI encontrado.
							</td>
						</tr>
					) : (
						listEpis.map((epi) => (
							<tr
								key={epi.id}
								onClick={() => setSelectedEpi(epi.id)}
								className="hover:bg-primary/5 transition-colors cursor-pointer group"
							>
								<td className="py-3 px-4 font-medium text-text-main text-sm">
									{epi.name}
								</td>
								<td className="py-3 px-4 text-text-muted text-sm border-x border-border">
									{epi.code || '-'}
								</td>
								<td className="py-3 px-4 text-text-main text-sm">
									<div className="flex items-center gap-2">
										<Users
											size={16}
											className="text-yellow-500"
										/>
										<span className="font-semibold">
											{epi.qtdEntregue}
										</span>{' '}
										entregues
									</div>
								</td>
							</tr>
						))
					)}
				</tbody>
			</table>
		</div>
	);

	return (
		<ERPLayout>
			<div className="space-y-6 flex flex-col h-full relative w-full">
				<div>
					<h1 className="text-2xl font-bold text-text-main flex items-center gap-2">
						<History className="text-primary" /> Histórico de EPIs
					</h1>
					<p className="text-text-muted mt-1">
						Acompanhe as entregas de equipamentos para a equipe
					</p>
				</div>

				<div className="bg-surface border border-border rounded-sm shadow-sm p-4 sm:p-6 overflow-hidden min-h-[400px]">
					{!selectedColaborador && !selectedEpi && (
						<div className="flex border-b border-border mb-6 w-full">
							<button
								onClick={() => setActiveTab('geral')}
								className={`flex-1 flex justify-center items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 ${activeTab === 'geral' ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-text-main'}`}
							>
								<History size={18} /> Histórico Geral
							</button>
							<button
								onClick={() => setActiveTab('colaborador')}
								className={`flex-1 flex justify-center items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 ${activeTab === 'colaborador' ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-text-main'}`}
							>
								<Users size={18} /> Por Colaborador
							</button>
							<button
								onClick={() => setActiveTab('epis')}
								className={`flex-1 flex justify-center items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 ${activeTab === 'epis' ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-text-main'}`}
							>
								<Shield size={18} /> Por EPI
							</button>
						</div>
					)}

					{(selectedColaborador || selectedEpi) && (
						<div className="flex items-center gap-4 mb-6 pb-4 border-b border-border">
							<button
								onClick={() => {
									setSelectedColaborador(null);
									setSelectedEpi(null);
								}}
								className="p-2 border border-border text-text-muted hover:text-text-main hover:bg-background rounded-lg transition-colors"
							>
								<ArrowLeft size={18} />
							</button>
							<div>
								<h2 className="text-xl font-bold text-text-main">
									{selectedColaborador
										? colaboradoresMap.get(
												selectedColaborador,
											)?.name
										: episMap.get(selectedEpi)?.name}
								</h2>
								<p className="text-sm text-text-muted">
									Visualizando histórico específico
								</p>
							</div>
						</div>
					)}

					<div className="flex flex-col sm:flex-row gap-4 mb-6">
						<div className="relative flex-1">
							<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
								<Search size={18} className="text-text-muted" />
							</div>
							<input
								type="text"
								placeholder="Buscar no histórico..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-text-main focus:outline-none focus:border-primary transition-colors"
							/>
						</div>
					</div>

					{isLoading ? (
						<div className="flex justify-center p-8 text-text-muted">
							Carregando histórico...
						</div>
					) : (
						<>
							{selectedColaborador &&
								renderGeral(
									colaboradoresMap
										.get(selectedColaborador)
										?.historico.filter((h: any) =>
											h.catalogs?.name
												?.toLowerCase()
												.includes(
													searchTerm.toLowerCase(),
												),
										),
								)}
							{selectedEpi &&
								renderGeral(
									episMap
										.get(selectedEpi)
										?.historico.filter((h: any) =>
											h.collaborators?.name
												?.toLowerCase()
												.includes(
													searchTerm.toLowerCase(),
												),
										),
								)}

							{!selectedColaborador && !selectedEpi && (
								<>
									{activeTab === 'geral' && renderGeral()}
									{activeTab === 'colaborador' &&
										renderListaColaboradores()}
									{activeTab === 'epis' && renderListaEpis()}
								</>
							)}
						</>
					)}
				</div>
			</div>

			{viewDetails && (
				<EpiDetailsModal
					item={viewDetails}
					onClose={() => setViewDetails(null)}
				/>
			)}
		</ERPLayout>
	);
}
