import React, { useState, useEffect } from 'react';
import { ERPLayout } from '../../../../components/layout/ERPLayout';
import { useParams } from 'react-router-dom';
import { Search, Plus, Filter, Wrench, X } from 'lucide-react';
import { supabase } from '../../../../config/supabase';
import { SearchableSelect } from '../../../../components/ui/SearchableSelect';
import { useToast } from '../../../../context/ToastContext';

export default function FerramentasDisponiveis() {
	const { id } = useParams();
	const { showToast } = useToast();
	const [searchTerm, setSearchTerm] = useState('');
	const [showAddModal, setShowAddModal] = useState(false);

	const [ferramentas, setFerramentas] = useState<any[]>([]);
	const [inventoryTools, setInventoryTools] = useState<any[]>([]);
	const [selectedInventoryId, setSelectedInventoryId] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);

	const fetchInventoryTools = async () => {
		if (!id) return;
		try {
			const { data, error } = await supabase
				.from('site_inventory')
				.select('id, quantity, catalogs(id, name, code, is_tool)')
				.eq('site_id', id);
			if (error) throw error;
			const funTools = (data || []).filter(
				(item) => item.catalogs?.is_tool === true,
			);
			setInventoryTools(funTools);
		} catch (err) {
			console.error(err);
		}
	};

	const fetchFerramentas = async () => {
		if (!id) return;
		try {
			const { data, error } = await supabase
				.from('site_tools')
				.select(
					'id, inventory_id, site_inventory(quantity, catalogs(name, code))',
				)
				.eq('site_id', id);
			if (error) throw error;
			setFerramentas(data || []);
		} catch (err) {
			console.error(err);
		}
	};

	useEffect(() => {
		fetchFerramentas();
		fetchInventoryTools();
	}, [id]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!selectedInventoryId) {
			showToast('Selecione uma ferramenta', 'error');
			return;
		}
		setIsSubmitting(true);
		try {
			const { error } = await supabase.from('site_tools').insert({
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
			showToast('Ferramenta adicionada à lista', 'success');
			setShowAddModal(false);
			setSelectedInventoryId('');
			fetchFerramentas();
		} catch (err: any) {
			console.error(err);
			showToast('Erro ao adicionar ferramenta', 'error');
		} finally {
			setIsSubmitting(false);
		}
	};

	// Mock color for purely display consistency now that we don't track inside vs outside yet
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
							<Wrench className="text-primary" /> Ferramentas
							Disponíveis
						</h1>
						<p className="text-text-muted mt-1">
							Controle de quais ferramentas estão disponíveis para
							a obra
						</p>
					</div>
					<button
						onClick={() => setShowAddModal(true)}
						className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
					>
						<Plus size={20} />
						<span>Nova Ferramenta</span>
					</button>
				</div>

				<div className="bg-surface border border-border rounded-xl p-4 sm:p-6">
					<div className="flex flex-col sm:flex-row gap-4 mb-6">
						<div className="relative flex-1">
							<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
								<Search size={18} className="text-text-muted" />
							</div>
							<input
								type="text"
								placeholder="Buscar ferramenta..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-text-main focus:outline-none focus:border-primary transition-colors"
							/>
						</div>
						<button className="flex items-center gap-2 bg-background border border-border text-text-main px-4 py-2 rounded-lg hover:border-primary transition-colors">
							<Filter size={20} />
							<span>Filtros</span>
						</button>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{ferramentas.length === 0 ? (
							<div className="col-span-full py-8 text-center text-text-muted">
								Nenhuma ferramenta cadastrada nesta lista ainda.
							</div>
						) : (
							ferramentas.map((ferramenta) => {
								const nome =
									ferramenta.site_inventory?.catalogs?.name ||
									'Desconhecida';
								const codigo =
									ferramenta.site_inventory?.catalogs?.code ||
									'';
								const qtd =
									ferramenta.site_inventory?.quantity || 0;
								return (
									<div
										key={ferramenta.id}
										className="bg-background border border-border rounded-xl p-4 hover:border-primary/50 transition-colors"
									>
										<div className="flex justify-between items-start mb-4">
											<div>
												<h3 className="font-semibold text-text-main">
													{nome}
												</h3>
												<p className="text-sm text-text-muted">
													{codigo}
												</p>
											</div>
											<div
												className={`px-2 py-1 rounded-md text-sm font-bold flex items-center bg-green-500/10 text-green-500`}
											>
												{qtd} Disponíveis
											</div>
										</div>
										<div className="flex gap-2 mt-4">
											<button
												className="flex-1 text-center py-2 text-sm font-medium bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
												disabled={qtd === 0}
											>
												Emprestar
											</button>
										</div>
									</div>
								);
							})
						)}
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
									Adicionar Ferramenta à Obra
								</h2>
								<p className="text-sm text-text-muted mt-1">
									Selecione uma ferramenta já disponível no
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
									Selecione a Ferramenta *
								</label>
								<SearchableSelect
									options={inventoryTools
										.filter(
											(inv) =>
												!ferramentas.some(
													(f) =>
														f.inventory_id ===
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
									placeholder="Buscar ferramenta..."
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
										: 'Adicionar à Lista'}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</ERPLayout>
	);
}
