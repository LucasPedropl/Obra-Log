import React, { useState, useEffect } from 'react';
import { ERPLayout } from '../../../../components/layout/ERPLayout';
import { useParams } from 'react-router-dom';
import { Search, Plus, Shield, UserPlus, X } from 'lucide-react';
import { supabase } from '../../../../config/supabase';
import { SearchableSelect } from '../../../../components/ui/SearchableSelect';
import { useToast } from '../../../../context/ToastContext';

export default function EPisDisponiveis() {
	const { id } = useParams();
	const { showToast } = useToast();
	const [searchTerm, setSearchTerm] = useState('');
	const [showAddModal, setShowAddModal] = useState(false);

	const [epis, setEpis] = useState<any[]>([]);
	const [inventoryEpis, setInventoryEpis] = useState<any[]>([]);
	const [selectedInventoryId, setSelectedInventoryId] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);

	const fetchInventoryEpis = async () => {
		if (!id) return;
		try {
			const { data, error } = await supabase
				.from('site_inventory')
				.select('id, quantity, catalogs(id, name, code, is_tool)')
				.eq('site_id', id);
			if (error) throw error;

			const epiItems = (data || []).filter(
				(item: any) => item.catalogs && item.catalogs.is_tool === false,
			);
			setInventoryEpis(epiItems);
		} catch (err) {
			console.error(err);
		}
	};

	const fetchEpis = async () => {
		if (!id) return;
		try {
			const { data, error } = await supabase
				.from('site_epis')
				.select(
					'id, inventory_id, site_inventory(quantity, catalogs(name, code))',
				)
				.eq('site_id', id);
			if (error) throw error;
			setEpis(data || []);
		} catch (err) {
			console.error(err);
		}
	};

	useEffect(() => {
		fetchEpis();
		fetchInventoryEpis();
	}, [id]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!selectedInventoryId) {
			showToast('Selecione um EPI do almoxarifado', 'error');
			return;
		}
		setIsSubmitting(true);
		try {
			const { error } = await supabase.from('site_epis').insert({
				site_id: id,
				inventory_id: selectedInventoryId,
			});
			if (error) {
				if (error.code === '42P01') {
					showToast(
						'Por favor, execute o script SQL para criar as tabelas de vínculo!',
						'error',
					);
				} else {
					throw error;
				}
				return;
			}
			showToast('EPI adicionado à lista', 'success');
			setShowAddModal(false);
			setSelectedInventoryId('');
			fetchEpis();
		} catch (err: any) {
			console.error(err);
			showToast('Erro ao adicionar EPI', 'error');
		} finally {
			setIsSubmitting(false);
		}
	};

	const getRatioColor = (disponivel: number, total: number) => {
		if (disponivel === 0) return 'text-red-500 bg-red-500/10';
		if (disponivel < total) return 'text-yellow-500 bg-yellow-500/10';
		return 'text-green-500 bg-green-500/10';
	};

	return (
		<ERPLayout>
			<div className="space-y-6">
				<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
					<div>
						<h1 className="text-2xl font-bold text-text-main flex items-center gap-2">
							<Shield className="text-primary" /> EPIs Disponíveis
						</h1>
						<p className="text-text-muted mt-1">
							Gestão de Equipamentos de Proteção Individual na
							obra
						</p>
					</div>
					<button
						onClick={() => setShowAddModal(true)}
						className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
					>
						<Plus size={20} />
						<span>Novo EPI</span>
					</button>
				</div>

				<div className="bg-surface border border-border rounded-xl p-4 sm:p-6">
					<div className="flex mb-6">
						<div className="relative flex-1 max-w-md">
							<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
								<Search size={18} className="text-text-muted" />
							</div>
							<input
								type="text"
								placeholder="Buscar EPI..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-text-main focus:outline-none focus:border-primary transition-colors"
							/>
						</div>
					</div>

					<div className="overflow-x-auto">
						<table className="w-full text-left border-collapse">
							<thead>
								<tr className="border-b border-border">
									<th className="py-3 px-4 text-sm font-semibold text-text-muted">
										EPI
									</th>
									<th className="py-3 px-4 text-sm font-semibold text-text-muted">
										Estoque (Disponível/Total)
									</th>
									<th className="py-3 px-4 text-sm font-semibold text-text-muted text-right">
										Ação
									</th>
								</tr>
							</thead>
							<tbody>
								{epis.length === 0 ? (
									<tr>
										<td
											colSpan={3}
											className="py-8 text-center text-text-muted"
										>
											Nenhum EPI alocado ainda
										</td>
									</tr>
								) : (
									epis.map((epi) => {
										const nome =
											epi.site_inventory?.catalogs
												?.name || 'Desconhecido';
										const codigo =
											epi.site_inventory?.catalogs
												?.code || '';
										const qtd =
											epi.site_inventory?.quantity || 0;
										return (
											<tr
												key={epi.id}
												className="border-b border-border hover:bg-background/50 transition-colors"
											>
												<td className="py-3 px-4">
													<div className="font-medium text-text-main">
														{nome}
													</div>
													<div className="text-xs text-text-muted">
														Cód: {codigo}
													</div>
												</td>
												<td className="py-3 px-4">
													<span
														className={`inline-flex items-center justify-center px-2 py-1 rounded-full text-sm font-medium ${getRatioColor(qtd, qtd)}`}
													>
														{qtd} / {qtd}
													</span>
												</td>
												<td className="py-3 px-4 text-right">
													<button
														disabled={qtd === 0}
														className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors font-medium text-sm ${qtd > 0 ? 'bg-primary/10 text-primary hover:bg-primary hover:text-white' : 'bg-background border border-border text-text-muted cursor-not-allowed'}`}
													>
														<UserPlus size={16} />{' '}
														Entregar ao Colaborador
													</button>
												</td>
											</tr>
										);
									})
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
									Adicionar EPI à Lista
								</h2>
								<p className="text-sm text-text-muted mt-1">
									Selecione um EPI já disponível no
									almoxarifado desta obra.
								</p>
							</div>
							<button
								onClick={() => setShowAddModal(false)}
								className="p-2 text-text-muted hover:text-text-main hover:bg-background rounded-lg transition-colors -mt-4 -mr-2"
							>
								<X size={20} />
							</button>
						</div>

						<form className="p-5 space-y-5" onSubmit={handleSubmit}>
							<div>
								<label className="block text-sm font-medium text-text-main mb-1">
									EPI (Do Almoxarifado) *
								</label>
								<SearchableSelect
									options={inventoryEpis
										.filter(
											(inv) =>
												!epis.some(
													(e) =>
														e.inventory_id ===
														inv.id,
												),
										)
										.map((inv) => ({
											value: inv.id,
											label: inv.catalogs?.code
												? `[${inv.catalogs.code}] ${inv.catalogs.name}`
												: inv.catalogs?.name,
										}))}
									value={selectedInventoryId}
									onChange={setSelectedInventoryId}
									placeholder="Buscar EPI..."
								/>
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
									disabled={isSubmitting}
									className="bg-primary hover:bg-primary-hover text-white font-medium py-2 px-6 rounded-lg transition-colors shadow-sm disabled:opacity-50"
								>
									{isSubmitting
										? 'Adicionando...'
										: 'Adicionar'}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</ERPLayout>
	);
}
