import React, { useState, useEffect } from 'react';
import { ERPLayout } from '../../../components/layout/ERPLayout';
import { useParams } from 'react-router-dom';
import { Search, UserPlus, Users, ChevronDown, X } from 'lucide-react';
import { supabase } from '../../../config/supabase';
import { useToast } from '../../../context/ToastContext';

export default function ColaboradoresProjeto() {
	const { id } = useParams();
	const { showToast } = useToast();
	const [searchTerm, setSearchTerm] = useState('');
	const [modalSearchTerm, setModalSearchTerm] = useState('');
	const [showAddModal, setShowAddModal] = useState(false);

	const [colaboradoresProjeto, setColaboradoresProjeto] = useState<any[]>([]);
	const [allColaboradores, setAllColaboradores] = useState<any[]>([]);
	const [selectedColabIds, setSelectedColabIds] = useState<string[]>([]);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const companyId = localStorage.getItem('selectedCompanyId');

	const fetchColaboradoresProjeto = async () => {
		if (!id) return;
		try {
			const { data, error } = await supabase
				.from('site_collaborators')
				.select(
					'id, collaborator_id, collaborators(id, name, role_title, status)',
				)
				.eq('site_id', id);
			if (error) throw error;
			setColaboradoresProjeto(data || []);
		} catch (err) {
			console.error(err);
		}
	};

	const fetchAllColaboradores = async () => {
		if (!companyId) return;
		try {
			const { data, error } = await supabase
				.from('collaborators')
				.select('*')
				.eq('company_id', companyId)
				.eq('status', 'ACTIVE');
			if (error) throw error;
			setAllColaboradores(data || []);
		} catch (err) {
			console.error(err);
		}
	};

	useEffect(() => {
		fetchColaboradoresProjeto();
		fetchAllColaboradores();
	}, [id, companyId]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (selectedColabIds.length === 0) {
			showToast('Selecione pelo menos um colaborador', 'error');
			return;
		}
		setIsSubmitting(true);
		try {
			const itemsToInsert = selectedColabIds.map((colabId) => ({
				site_id: id,
				collaborator_id: colabId,
			}));

			const { error } = await supabase
				.from('site_collaborators')
				.insert(itemsToInsert);

			if (error) throw error;

			showToast(
				`${selectedColabIds.length} colaborador(es) alocado(s) na obra`,
				'success',
			);
			setShowAddModal(false);
			setSelectedColabIds([]);
			fetchColaboradoresProjeto();
		} catch (err: any) {
			console.error(err);
			showToast('Erro ao alocar colaborador', 'error');
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleRemove = async (siteColabId: string) => {
		if (!confirm('Deseja realmente remover este colaborador da obra?'))
			return;
		try {
			const { error } = await supabase
				.from('site_collaborators')
				.delete()
				.eq('id', siteColabId);
			if (error) throw error;
			showToast('Colaborador removido da obra', 'success');
			fetchColaboradoresProjeto();
		} catch (err) {
			console.error(err);
			showToast('Erro ao remover colaborador', 'error');
		}
	};

	const filteredColaboradores = colaboradoresProjeto.filter((sc) => {
		const nome = sc.collaborators?.name?.toLowerCase() || '';
		const funcao = sc.collaborators?.role_title?.toLowerCase() || '';
		const searchLower = searchTerm.toLowerCase();
		return nome.includes(searchLower) || funcao.includes(searchLower);
	});

	const availableColabs = allColaboradores.filter(
		(c) => !colaboradoresProjeto.some((sc) => sc.collaborator_id === c.id),
	);
	const modalFilteredColabs = availableColabs.filter(
		(c) =>
			c.name.toLowerCase().includes(modalSearchTerm.toLowerCase()) ||
			c.role_title.toLowerCase().includes(modalSearchTerm.toLowerCase()),
	);

	return (
		<ERPLayout>
			<div className="space-y-6 w-full relative h-full">
				<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
					<div>
						<h1 className="text-2xl font-bold text-text-main flex items-center gap-2">
							<Users className="text-primary" /> Colaboradores da
							Obra
						</h1>
						<p className="text-text-muted mt-1">
							Gerenciamento da equipe alocada na obra atual
						</p>
					</div>

					<button
						onClick={() => setShowAddModal(true)}
						className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
					>
						<UserPlus size={20} />
						<span>Alocar Colaborador</span>
					</button>
				</div>

				<div className="bg-surface border border-border rounded-sm shadow-sm p-4 sm:p-6 overflow-hidden">
					<div className="flex flex-col sm:flex-row gap-4 mb-6">
						<div className="relative flex-1">
							<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
								<Search size={18} className="text-text-muted" />
							</div>
							<input
								type="text"
								placeholder="Buscar colaborador na obra..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-text-main focus:outline-none focus:border-primary transition-colors"
							/>
						</div>
					</div>

					<div className="overflow-x-auto bg-surface border border-border rounded-lg">
						<table className="w-full text-left [&_th]:border-b [&_th]:border-border [&_td]:border-b [&_td]:border-border [&_tbody_tr:last-child_td]:border-b-0">
							<thead>
								<tr className="border-b border-border bg-background/50">
									<th className="py-3 px-4 text-sm font-semibold text-text-muted">
										Nome
									</th>
									<th className="py-3 px-4 text-sm font-semibold text-text-muted">
										Função
									</th>
									<th className="py-3 px-4 text-sm font-semibold text-text-muted">
										Status
									</th>
									<th className="py-3 px-4 text-sm font-semibold text-text-muted text-right">
										Ações
									</th>
								</tr>
							</thead>
							<tbody>
								{filteredColaboradores.map((sc) => (
									<tr
										key={sc.id}
										className="border-b border-border hover:bg-black/5 dark:hover:bg-white/5 even:bg-black/[0.02] dark:even:bg-white/[0.02] transition-colors"
									>
										<td className="py-3 px-4 font-medium text-text-main">
											{sc.collaborators?.name}
										</td>
										<td className="py-3 px-4 text-text-muted">
											{sc.collaborators?.role_title}
										</td>
										<td className="py-3 px-4">
											<span className="inline-flex items-center justify-center bg-green-500/10 text-green-500 text-sm font-medium px-2 py-1 rounded-full">
												{sc.collaborators?.status ===
												'ACTIVE'
													? 'Ativo'
													: 'Inativo'}
											</span>
										</td>
										<td className="py-3 px-4 text-right">
											<button
												onClick={() =>
													handleRemove(sc.id)
												}
												className="text-red-500 hover:text-red-600 font-medium transition-colors"
											>
												Remover
											</button>
										</td>
									</tr>
								))}
								{filteredColaboradores.length === 0 && (
									<tr>
										<td
											colSpan={4}
											className="py-8 text-center text-text-muted bg-background/30"
										>
											Nenhum colaborador alocado nesta
											obra ainda.
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>
				</div>
			</div>

			{showAddModal && (
				<div
					className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
					onClick={() => setShowAddModal(false)}
				>
					<div
						className="bg-surface border border-border rounded-xl shadow-2xl w-full max-w-lg mb-[10vh]"
						onClick={(e) => e.stopPropagation()}
					>
						<div className="flex items-center justify-between p-5 border-b border-border">
							<div>
								<h2 className="text-xl font-bold text-text-main">
									Alocar Colaboradores
								</h2>
								<p className="text-sm text-text-muted mt-1">
									Selecione da mão de obra da sua empresa
								</p>
							</div>
							<button
								onClick={() => setShowAddModal(false)}
								className="p-2 text-text-muted hover:text-text-main hover:bg-background rounded-lg transition-colors -mt-4 -mr-2"
							>
								<X size={20} />
							</button>
						</div>

						<form onSubmit={handleSubmit} className="p-5 space-y-5">
							<div>
								<div className="flex justify-between items-center mb-2">
									<label className="block text-sm font-medium text-text-main">
										Colaboradores Disponíveis (
										{availableColabs.length})
									</label>
									<button
										type="button"
										className="text-xs text-primary hover:underline font-medium"
										onClick={() => {
											if (
												selectedColabIds.length ===
													modalFilteredColabs.length &&
												modalFilteredColabs.length > 0
											) {
												setSelectedColabIds([]);
											} else {
												setSelectedColabIds(
													modalFilteredColabs.map(
														(c) => c.id,
													),
												);
											}
										}}
									>
										Selecionar / Desmarcar Todos
									</button>
								</div>

								<div className="relative mb-3">
									<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
										<Search
											size={16}
											className="text-text-muted"
										/>
									</div>
									<input
										type="text"
										placeholder="Filtrar por nome ou função..."
										value={modalSearchTerm}
										onChange={(e) =>
											setModalSearchTerm(e.target.value)
										}
										className="w-full pl-9 pr-3 py-2 text-sm bg-background border border-border rounded-lg text-text-main focus:outline-none focus:border-primary transition-colors"
									/>
								</div>

								<div className="max-h-60 overflow-y-auto border border-border rounded-lg bg-background p-2 space-y-1">
									{modalFilteredColabs.map((colab) => {
										const isSelected =
											selectedColabIds.includes(colab.id);
										return (
											<label
												key={colab.id}
												className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors ${isSelected ? 'bg-primary/5 border-primary/20' : 'hover:bg-surface border-transparent'} border`}
											>
												<div className="flex items-center h-5">
													<input
														type="checkbox"
														checked={isSelected}
														onChange={(e) => {
															if (
																e.target.checked
															)
																setSelectedColabIds(
																	(prev) => [
																		...prev,
																		colab.id,
																	],
																);
															else
																setSelectedColabIds(
																	(prev) =>
																		prev.filter(
																			(
																				id,
																			) =>
																				id !==
																				colab.id,
																		),
																);
														}}
														className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary focus:ring-2"
													/>
												</div>
												<div className="flex flex-col">
													<span className="text-sm font-medium text-text-main">
														{colab.name}
													</span>
													<span className="text-xs text-text-muted">
														{colab.role_title}
													</span>
												</div>
											</label>
										);
									})}
									{modalFilteredColabs.length === 0 && (
										<div className="text-center py-4 text-sm text-text-muted">
											Nenhum colaborador encontrado.
										</div>
									)}
								</div>
							</div>

							<div className="flex justify-end pt-4 gap-3 border-t border-border">
								<button
									type="button"
									onClick={() => setShowAddModal(false)}
									className="px-4 py-2 text-text-muted hover:text-text-main font-medium transition-colors"
								>
									Cancelar
								</button>
								<button
									type="submit"
									disabled={
										isSubmitting ||
										selectedColabIds.length === 0
									}
									className="bg-primary hover:bg-primary-hover text-white font-medium py-2 px-6 rounded-lg transition-colors shadow-sm disabled:opacity-50"
								>
									{isSubmitting
										? 'Alocando...'
										: `Alocar (${selectedColabIds.length})`}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</ERPLayout>
	);
}
