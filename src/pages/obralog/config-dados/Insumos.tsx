import React, { useState, useEffect, useRef } from 'react';
import { ERPLayout } from '../../../components/layout/ERPLayout';
import {
	Loader2,
	Plus,
	X,
	Search,
	ChevronDown,
	Download,
	Upload,
} from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { env } from '../../../config/env';
import { useNavigate } from 'react-router-dom';

export default function Insumos() {
	const navigate = useNavigate();
	const [insumos, setInsumos] = useState<any[]>([]);
	const [categorias, setCategorias] = useState<any[]>([]);
	const [unidades, setUnidades] = useState<any[]>([]);

	const [loading, setLoading] = useState(false);
	const [fetching, setFetching] = useState(true);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const { showToast } = useToast();

	const [formData, setFormData] = useState({
		name: '',
		category_id: '',
		unit_id: '',
		entry_type: 'PRODUTO',
		is_stock_controlled: false,
		min_threshold: 0,
		price: 0,
	});

	// Combobox state
	const [catSearch, setCatSearch] = useState('');
	const [catOpen, setCatOpen] = useState(false);
	const [unitSearch, setUnitSearch] = useState('');
	const [unitOpen, setUnitOpen] = useState(false);

	const catRef = useRef<HTMLDivElement>(null);
	const unitRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		fetchData();

		const handleClickOutside = (e: MouseEvent) => {
			if (catRef.current && !catRef.current.contains(e.target as Node))
				setCatOpen(false);
			if (unitRef.current && !unitRef.current.contains(e.target as Node))
				setUnitOpen(false);
		};
		document.addEventListener('mousedown', handleClickOutside);
		return () =>
			document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	const fetchData = async () => {
		setFetching(true);
		try {
			const companyId = localStorage.getItem('selectedCompanyId');
			if (!companyId) return;

			const [catRes, unRes, insRes] = await Promise.all([
				fetch(
					`${env.VITE_API_URL}/api/categories?company_id=${companyId}`,
				),
				fetch(
					`${env.VITE_API_URL}/api/measurement_units?company_id=${companyId}`,
				),
				fetch(
					`${env.VITE_API_URL}/api/catalogs?company_id=${companyId}`,
				),
			]);

			if (catRes.ok) setCategorias(await catRes.json());
			if (unRes.ok) setUnidades(await unRes.json());
			if (insRes.ok) setInsumos(await insRes.json());
		} catch (err) {
			console.error(err);
			showToast('Erro ao carregar dados', 'error');
		} finally {
			setFetching(false);
		}
	};

	const fetchInsumosOnly = async () => {
		try {
			const companyId = localStorage.getItem('selectedCompanyId');
			const res = await fetch(
				`${env.VITE_API_URL}/api/catalogs?company_id=${companyId}`,
			);
			if (res.ok) setInsumos(await res.json());
		} catch (err) {
			console.error(err);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const companyId = localStorage.getItem('selectedCompanyId');
		if (!companyId) return;

		if (!formData.category_id || !formData.unit_id) {
			showToast('Categoria e Unidade são obrigatórios', 'error');
			return;
		}

		setLoading(true);
		try {
			const payload = {
				name: formData.name,
				category_id: formData.category_id,
				unit_id: formData.unit_id,
				is_stock_controlled: formData.is_stock_controlled,
				min_threshold: formData.min_threshold,
				company_id: companyId,
			};

			const res = await fetch(`${env.VITE_API_URL}/api/catalogs`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload),
			});

			if (!res.ok) throw new Error('Erro ao cadastrar insumo');

			showToast('Insumo salvo com sucesso', 'success');
			setIsModalOpen(false);
			setFormData({
				name: '',
				category_id: '',
				unit_id: '',
				entry_type: 'PRODUTO',
				is_stock_controlled: false,
				min_threshold: 0,
				price: 0,
			});
			fetchInsumosOnly();
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
							Insumos
						</h1>
						<p className="text-text-muted mt-1">
							Gerencie catálogo de materiais e serviços.
						</p>
					</div>
					<button
						onClick={() => setIsModalOpen(true)}
						className="bg-primary hover:bg-primary-hover text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
					>
						<Plus size={18} />
						Novo Insumo
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
										Estoque
									</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-border">
								{insumos.length === 0 ? (
									<tr>
										<td
											colSpan={2}
											className="px-6 py-8 text-center text-text-muted"
										>
											Nenhum insumo cadastrado.
										</td>
									</tr>
								) : (
									insumos.map((ins) => (
										<tr
											key={ins.id}
											className="hover:bg-background/50 transition-colors"
										>
											<td className="px-6 py-4 text-sm font-medium text-text-main">
												{ins.name}
											</td>
											<td className="px-6 py-4 text-sm text-text-muted">
												{ins.is_stock_controlled
													? `Sim (Min: ${ins.min_threshold})`
													: 'Não'}
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
						<div className="bg-surface border border-border rounded-xl shadow-2xl w-full max-w-2xl">
							<div className="flex items-center justify-between p-5 border-b border-border">
								<div>
									<h2 className="text-xl font-bold text-text-main">
										Cadastro de Insumo
									</h2>
									<p className="text-sm text-text-muted">
										Preencha os dados do novo material
									</p>
								</div>
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
										placeholder="Ex: Cimento CP-II"
										className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text-main focus:ring-2 focus:ring-primary outline-none"
									/>
								</div>

								<div className="grid grid-cols-2 gap-4">
									<div ref={catRef} className="relative">
										<label className="block text-sm font-medium text-text-main mb-1">
											Categoria *
										</label>
										<div
											onClick={() => setCatOpen(!catOpen)}
											className="w-full flex items-center justify-between px-3 py-2 bg-background border border-border rounded-lg text-text-main cursor-pointer"
										>
											<span
												className={
													formData.category_id
														? 'text-text-main'
														: 'text-text-muted'
												}
											>
												{formData.category_id
													? categorias.find(
															(c) =>
																c.id ===
																formData.category_id,
														)?.primary_category
													: 'Selecione ou digite...'}
											</span>
											<ChevronDown
												size={16}
												className="text-text-muted"
											/>
										</div>

										{catOpen && (
											<div className="absolute top-full mt-1 w-full bg-surface border border-border rounded-lg shadow-xl z-50 overflow-hidden">
												<div className="p-2 border-b border-border flex items-center gap-2">
													<Search
														size={16}
														className="text-text-muted"
													/>
													<input
														autoFocus
														type="text"
														placeholder="Pesquisar categoria..."
														value={catSearch}
														onChange={(e) =>
															setCatSearch(
																e.target.value,
															)
														}
														className="w-full bg-transparent border-none outline-none text-sm text-text-main"
													/>
												</div>
												<div className="max-h-48 overflow-y-auto">
													{categorias
														.filter((c) =>
															c.primary_category
																.toLowerCase()
																.includes(
																	catSearch.toLowerCase(),
																),
														)
														.map((c) => (
															<div
																key={c.id}
																onClick={() => {
																	setFormData(
																		{
																			...formData,
																			category_id:
																				c.id,
																		},
																	);
																	setCatOpen(
																		false,
																	);
																	setCatSearch(
																		'',
																	);
																}}
																className="px-3 py-2 text-sm text-text-main hover:bg-background cursor-pointer"
															>
																{
																	c.primary_category
																}
															</div>
														))}
												</div>
												<div
													onClick={() =>
														navigate(
															'/app/config-dados/categorias',
														)
													}
													className="p-2 border-t border-border mt-1 cursor-pointer bg-background hover:bg-border/30 transition-colors"
												>
													<span className="text-primary text-sm font-medium flex items-center gap-1">
														<Plus size={16} />{' '}
														Cadastrar nova Categoria
													</span>
												</div>
											</div>
										)}
									</div>
									<div>
										<label className="block text-sm font-medium text-text-main mb-1">
											Tipo custo *
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
								</div>

								<div className="grid grid-cols-2 gap-4">
									<div ref={unitRef} className="relative">
										<label className="block text-sm font-medium text-text-main mb-1">
											Und. orçamento *
										</label>
										<div
											onClick={() =>
												setUnitOpen(!unitOpen)
											}
											className="w-full flex items-center justify-between px-3 py-2 bg-background border border-border rounded-lg text-text-main cursor-pointer"
										>
											<span
												className={
													formData.unit_id
														? 'text-text-main'
														: 'text-text-muted'
												}
											>
												{formData.unit_id
													? unidades.find(
															(u) =>
																u.id ===
																formData.unit_id,
														)?.abbreviation
													: 'Selecione ou digite...'}
											</span>
											<ChevronDown
												size={16}
												className="text-text-muted"
											/>
										</div>

										{unitOpen && (
											<div className="absolute top-full mt-1 w-full bg-surface border border-border rounded-lg shadow-xl z-50 overflow-hidden">
												<div className="p-2 border-b border-border flex items-center gap-2">
													<Search
														size={16}
														className="text-text-muted"
													/>
													<input
														autoFocus
														type="text"
														placeholder="Pesquisar unidade..."
														value={unitSearch}
														onChange={(e) =>
															setUnitSearch(
																e.target.value,
															)
														}
														className="w-full bg-transparent border-none outline-none text-sm text-text-main"
													/>
												</div>
												<div className="max-h-48 overflow-y-auto">
													{unidades
														.filter(
															(u) =>
																u.name
																	.toLowerCase()
																	.includes(
																		unitSearch.toLowerCase(),
																	) ||
																u.abbreviation
																	.toLowerCase()
																	.includes(
																		unitSearch.toLowerCase(),
																	),
														)
														.map((u) => (
															<div
																key={u.id}
																onClick={() => {
																	setFormData(
																		{
																			...formData,
																			unit_id:
																				u.id,
																		},
																	);
																	setUnitOpen(
																		false,
																	);
																	setUnitSearch(
																		'',
																	);
																}}
																className="px-3 py-2 text-sm text-text-main hover:bg-background cursor-pointer flex justify-between"
															>
																<span>
																	{
																		u.abbreviation
																	}
																</span>
																<span className="text-text-muted text-xs">
																	{u.name}
																</span>
															</div>
														))}
												</div>
												<div
													onClick={() =>
														navigate(
															'/app/config-dados/unidades',
														)
													}
													className="p-2 border-t border-border mt-1 cursor-pointer bg-background hover:bg-border/30 transition-colors"
												>
													<span className="text-primary text-sm font-medium flex items-center gap-1">
														<Plus size={16} />{' '}
														Cadastrar nova Unidade
													</span>
												</div>
											</div>
										)}
									</div>
									<div>
										<label className="block text-sm font-medium text-text-main mb-1">
											Vlr. unitário
										</label>
										<input
											type="number"
											step="0.01"
											value={formData.price}
											onChange={(e) =>
												setFormData({
													...formData,
													price: parseFloat(
														e.target.value,
													),
												})
											}
											placeholder="R$ 0,00"
											className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text-main focus:ring-2 focus:ring-primary outline-none"
										/>
									</div>
								</div>

								<div className="grid grid-cols-2 gap-4 pt-2">
									<div>
										<label className="block text-sm font-medium text-text-main mb-2">
											Controle de estoque
										</label>
										<div className="flex gap-4">
											<label className="flex items-center gap-2 cursor-pointer">
												<input
													type="radio"
													name="stock"
													checked={
														!formData.is_stock_controlled
													}
													onChange={() =>
														setFormData({
															...formData,
															is_stock_controlled: false,
														})
													}
													className="text-primary"
												/>
												<span className="text-sm">
													Não
												</span>
											</label>
											<label className="flex items-center gap-2 cursor-pointer">
												<input
													type="radio"
													name="stock"
													checked={
														formData.is_stock_controlled
													}
													onChange={() =>
														setFormData({
															...formData,
															is_stock_controlled: true,
														})
													}
													className="text-primary"
												/>
												<span className="text-sm">
													Sim
												</span>
											</label>
										</div>
									</div>
									{formData.is_stock_controlled && (
										<div>
											<label className="block text-sm font-medium text-text-main mb-1">
												Qtd. mínima estoque
											</label>
											<input
												type="number"
												min="0"
												step="0.01"
												value={formData.min_threshold}
												onChange={(e) =>
													setFormData({
														...formData,
														min_threshold:
															parseFloat(
																e.target.value,
															),
													})
												}
												className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text-main focus:ring-2 focus:ring-primary outline-none"
											/>
										</div>
									)}
								</div>

								<div className="flex justify-end pt-6 gap-3 border-t border-border mt-6">
									<button
										type="button"
										onClick={() => setIsModalOpen(false)}
										className="px-6 py-2 border border-border rounded-lg text-text-main hover:bg-background transition-colors font-medium"
									>
										Cancelar
									</button>
									<button
										type="submit"
										disabled={loading}
										className="bg-[#5a5fec] hover:bg-[#4a4fcf] text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
									>
										{loading ? (
											<Loader2 className="w-4 h-4 animate-spin" />
										) : (
											'Salvar Insumo'
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
