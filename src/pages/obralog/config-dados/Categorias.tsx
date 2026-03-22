import React, { useState, useEffect } from 'react';
import { ERPLayout } from '../../../components/layout/ERPLayout';
import { Loader2, Plus, Edit, Trash2, X, Download, Upload } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { env } from '../../../config/env';

export default function Categorias() {
	const [categorias, setCategorias] = useState<any[]>([]);
	const [loading, setLoading] = useState(false);
	const [fetching, setFetching] = useState(true);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const { showToast } = useToast();

	const [formData, setFormData] = useState({
		entry_type: 'PRODUTO',
		primary_category: '',
		secondary_category: '',
	});

	useEffect(() => {
		fetchCategorias();
	}, []);

	const fetchCategorias = async () => {
		setFetching(true);
		try {
			const companyId = localStorage.getItem('selectedCompanyId');
			if (!companyId) return;

			const res = await fetch(
				`${env.VITE_API_URL}/api/categories?company_id=${companyId}`,
			);
			if (!res.ok) throw new Error('Erro ao buscar categorias');
			const data = await res.json();
			setCategorias(data);
		} catch (err) {
			console.error(err);
			showToast('Erro ao carregar categorias', 'error');
		} finally {
			setFetching(false);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const companyId = localStorage.getItem('selectedCompanyId');
		if (!companyId) return;

		setLoading(true);
		try {
			const res = await fetch(`${env.VITE_API_URL}/api/categories`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					...formData,
					company_id: companyId,
				}),
			});

			if (!res.ok) throw new Error('Erro ao cadastrar categoria');

			showToast('Categoria salva com sucesso', 'success');
			setIsModalOpen(false);
			setFormData({
				entry_type: 'PRODUTO',
				primary_category: '',
				secondary_category: '',
			});
			fetchCategorias();
		} catch (err) {
			console.error(err);
			showToast('Erro ao salvar', 'error');
		} finally {
			setLoading(false);
		}
	};

	return (
		<ERPLayout>
			<div className="space-y-6 max-w-5xl mx-auto">
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
					<div>
						<h1 className="text-2xl font-bold text-text-main">
							Categorias
						</h1>
						<p className="text-text-muted mt-1">
							Gerencie categorias de produtos e serviços.
						</p>
					</div>
					<button
						onClick={() => setIsModalOpen(true)}
						className="bg-primary hover:bg-primary-hover text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
					>
						<Plus size={18} />
						Nova Categoria
					</button>
				</div>

				{fetching ? (
					<div className="flex justify-center p-12">
						<Loader2 className="animate-spin text-primary w-8 h-8" />
					</div>
				) : (
					<div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
						<table className="w-full text-left">
							<thead className="bg-background border-b border-border">
								<tr>
									<th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">
										Tipo
									</th>
									<th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">
										Categoria
									</th>
									<th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">
										Subcategoria
									</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-border">
								{categorias.length === 0 ? (
									<tr>
										<td
											colSpan={3}
											className="px-6 py-8 text-center text-text-muted"
										>
											Nenhuma categoria cadastrada.
										</td>
									</tr>
								) : (
									categorias.map((cat) => (
										<tr
											key={cat.id}
											className="hover:bg-background/50 transition-colors"
										>
											<td className="px-6 py-4 text-sm font-medium text-text-main">
												{cat.entry_type === 'PRODUTO'
													? 'Produto'
													: 'Serviço'}
											</td>
											<td className="px-6 py-4 text-sm text-text-main">
												{cat.primary_category}
											</td>
											<td className="px-6 py-4 text-sm text-text-muted">
												{cat.secondary_category || '-'}
											</td>
										</tr>
									))
								)}
							</tbody>
						</table>
					</div>
				)}

				<div className="flex items-center justify-end gap-3 pt-6 border-t border-border mt-6">
					<button className="flex items-center gap-2 px-4 py-2 bg-surface border border-border text-text-main rounded-lg hover:bg-background transition-colors text-sm font-medium">
						<Download size={18} />
						Exportar Dados
					</button>
					<button className="flex items-center gap-2 px-4 py-2 bg-surface border border-border text-text-main rounded-lg hover:bg-background transition-colors text-sm font-medium">
						<Upload size={18} />
						Importar Dados
					</button>
				</div>

				{isModalOpen && (
					<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
						<div className="bg-surface border border-border rounded-xl shadow-2xl w-full max-w-md">
							<div className="flex items-center justify-between p-5 border-b border-border">
								<h2 className="text-xl font-bold text-text-main">
									Nova Categoria
								</h2>
								<button
									onClick={() => setIsModalOpen(false)}
									className="text-text-muted hover:text-text-main p-1.5 rounded-lg hover:bg-background"
								>
									<X size={20} />
								</button>
							</div>
							<form
								onSubmit={handleSubmit}
								className="p-5 space-y-4"
							>
								<div className="grid grid-cols-2 gap-4">
									<div>
										<label className="block text-sm font-medium text-text-main mb-1">
											Tipo
										</label>
										<select
											value={formData.entry_type}
											onChange={(e) =>
												setFormData({
													...formData,
													entry_type: e.target.value,
												})
											}
											className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text-main focus:ring-2 focus:ring-primary outline-none"
										>
											<option value="PRODUTO">
												Produto
											</option>
											<option value="SERVICO">
												Serviço
											</option>
										</select>
									</div>
									<div>
										<label className="block text-sm font-medium text-text-main mb-1">
											Cadastro
										</label>
										<select
											disabled
											className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text-muted opacity-50 outline-none"
										>
											<option>Padrão</option>
										</select>
									</div>
								</div>
								<div>
									<label className="block text-sm font-medium text-text-main mb-1">
										Categoria *
									</label>
									<input
										type="text"
										required
										value={formData.primary_category}
										onChange={(e) =>
											setFormData({
												...formData,
												primary_category:
													e.target.value,
											})
										}
										placeholder="Ex: Acabamentos"
										className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text-main focus:ring-2 focus:ring-primary outline-none"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-text-main mb-1">
										Subcategoria
									</label>
									<input
										type="text"
										value={formData.secondary_category}
										onChange={(e) =>
											setFormData({
												...formData,
												secondary_category:
													e.target.value,
											})
										}
										placeholder="Ex: Pisos, Azulejos..."
										className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text-main focus:ring-2 focus:ring-primary outline-none"
									/>
								</div>
								<div className="flex justify-end pt-4 gap-3">
									<button
										type="button"
										onClick={() => setIsModalOpen(false)}
										className="px-4 py-2 font-medium text-text-muted hover:text-text-main"
									>
										Cancelar
									</button>
									<button
										type="submit"
										disabled={loading}
										className="bg-primary hover:bg-primary-hover text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
									>
										{loading ? (
											<Loader2 className="w-4 h-4 animate-spin" />
										) : (
											'Salvar'
										)}
									</button>
								</div>
							</form>
						</div>
					</div>
				)}
			</div>
		</ERPLayout>
	);
}
