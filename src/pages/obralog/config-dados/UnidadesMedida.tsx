import React, { useState, useEffect } from 'react';
import { ERPLayout } from '../../../components/layout/ERPLayout';
import { Loader2, Plus, X, Download, Upload } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { env } from '../../../config/env';

export default function UnidadesMedida() {
	const [unidades, setUnidades] = useState<any[]>([]);
	const [loading, setLoading] = useState(false);
	const [fetching, setFetching] = useState(true);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const { showToast } = useToast();

	const [formData, setFormData] = useState({
		name: '',
		abbreviation: '',
	});

	useEffect(() => {
		fetchUnidades();
	}, []);

	const fetchUnidades = async () => {
		setFetching(true);
		try {
			const companyId = localStorage.getItem('selectedCompanyId');
			if (!companyId) return;

			const res = await fetch(
				`${env.VITE_API_URL}/api/measurement_units?company_id=${companyId}`,
			);
			if (!res.ok) throw new Error('Erro ao buscar unidades');
			const data = await res.json();
			setUnidades(data);
		} catch (err) {
			console.error(err);
			showToast('Erro ao carregar unidades', 'error');
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
			const res = await fetch(
				`${env.VITE_API_URL}/api/measurement_units`,
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						...formData,
						company_id: companyId,
					}),
				},
			);

			if (!res.ok) throw new Error('Erro ao cadastrar unidade');

			showToast('Unidade salva com sucesso', 'success');
			setIsModalOpen(false);
			setFormData({ name: '', abbreviation: '' });
			fetchUnidades();
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
							Unidades de Medida
						</h1>
						<p className="text-text-muted mt-1">
							Gerencie as unidades utilizadas no sistema.
						</p>
					</div>
					<button
						onClick={() => setIsModalOpen(true)}
						className="bg-primary hover:bg-primary-hover text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
					>
						<Plus size={18} />
						Nova Unidade
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
										Nome
									</th>
									<th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">
										Abreviação
									</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-border">
								{unidades.length === 0 ? (
									<tr>
										<td
											colSpan={2}
											className="px-6 py-8 text-center text-text-muted"
										>
											Nenhuma unidade cadastrada.
										</td>
									</tr>
								) : (
									unidades.map((und) => (
										<tr
											key={und.id}
											className="hover:bg-background/50 transition-colors"
										>
											<td className="px-6 py-4 text-sm text-text-main font-medium">
												{und.name}
											</td>
											<td className="px-6 py-4 text-sm text-text-muted">
												<span className="px-2 py-1 bg-background border border-border rounded-md font-mono text-xs">
													{und.abbreviation}
												</span>
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
									Nova Unidade
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
								<div>
									<label className="block text-sm font-medium text-text-main mb-1">
										Nome *
									</label>
									<input
										type="text"
										required
										value={formData.name}
										onChange={(e) =>
											setFormData({
												...formData,
												name: e.target.value,
											})
										}
										className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text-main focus:ring-2 focus:ring-primary outline-none"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-text-main mb-1">
										Abreviação *
									</label>
									<input
										type="text"
										required
										value={formData.abbreviation}
										onChange={(e) =>
											setFormData({
												...formData,
												abbreviation: e.target.value,
											})
										}
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
