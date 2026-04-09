import React, { useState, useEffect } from 'react';
import { ERPLayout } from '../../components/layout/ERPLayout';
import { Loader2, Plus, HardHat, FileX2, X } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { env } from '../../config/env';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../config/supabase';

export default function NovaObra() {
	const [obras, setObras] = useState<any[]>([]);
	const [obraname, setObraName] = useState('');
	const [loading, setLoading] = useState(false);
	const [fetching, setFetching] = useState(true);
	const [isCreating, setIsCreating] = useState(false);
	const { showToast } = useToast();
	const navigate = useNavigate();

	useEffect(() => {
		fetchObras();
	}, []);

	const fetchObras = async () => {
		setFetching(true);
		try {
			const companyId = localStorage.getItem('selectedCompanyId');
			if (!companyId) return;

			const { data: sessionData } = await supabase.auth.getSession();
			const token = sessionData?.session?.access_token;

			const res = await fetch(
				`${env.VITE_API_URL}/api/construction_sites?company_id=${companyId}`,
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				},
			);
			if (!res.ok) throw new Error('Erro ao buscar obras');
			const data = await res.json();
			setObras(data);
		} catch (err) {
			console.error(err);
			showToast('Erro ao carregar obras', 'error');
		} finally {
			setFetching(false);
		}
	};

	const handleCreateObra = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!obraname.trim()) return;

		const companyId = localStorage.getItem('selectedCompanyId');
		if (!companyId) {
			showToast(
				'Erro de contexto. Nenhuma empresa selecionada.',
				'error',
			);
			return;
		}

		setLoading(true);
		try {
			const { data: sessionData } = await supabase.auth.getSession();
			const token = sessionData?.session?.access_token;

			const res = await fetch(
				`${env.VITE_API_URL}/api/construction_sites`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({
						name: obraname.trim(),
						company_id: companyId,
						status: 'ACTIVE',
					}),
				},
			);

			if (!res.ok) {
				const errData = await res.json();
				throw new Error(errData.error || 'Erro ao cadastrar obra');
			}

			showToast('Obra cadastrada com sucesso!', 'success');
			setObraName('');
			setIsCreating(false);
			fetchObras();
		} catch (err: any) {
			console.error(err);
			showToast(err.message || 'Erro ao cadastrar obra', 'error');
		} finally {
			setLoading(false);
		}
	};

	const handleCloseModal = () => {
		if (obraname.trim()) {
			if (
				window.confirm(
					'Você tem dados não salvos. Realmente quer fechar?',
				)
			) {
				setIsCreating(false);
				setObraName('');
			}
		} else {
			setIsCreating(false);
			setObraName('');
		}
	};

	return (
		<ERPLayout>
			<div className="space-y-6 w-full">
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
					<div>
						<h1 className="text-2xl font-bold text-text-main flex items-center gap-2">
							<HardHat className="text-primary" />
							Gestão de Obras
						</h1>
						<p className="text-text-muted mt-1">
							Cadastre um novo projeto ou canteiro de obras.
						</p>
					</div>
					<button
						onClick={() => setIsCreating(true)}
						className="bg-primary hover:bg-primary-hover text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
					>
						<Plus size={18} />
						Nova Obra
					</button>
				</div>

				{fetching ? (
					<div className="flex justify-center p-12">
						<Loader2 className="animate-spin text-primary w-8 h-8" />
					</div>
				) : (
					<>
						{/* Estado Vazio ou Listagem */}
						{obras.length === 0 ? (
							<div className="flex flex-col items-center justify-center py-24 px-4 text-center bg-surface border border-border rounded-xl">
								<div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
									<FileX2 className="w-8 h-8 text-primary" />
								</div>
								<h3 className="text-xl font-semibold text-text-main mb-2">
									Nenhuma obra cadastrada
								</h3>
								<p className="text-text-muted max-w-md mb-6">
									Você ainda não possui nenhum canteiro de
									obras. Comece cadastrando o primeiro projeto
									para gerenciar requisições e equipamentos.
								</p>
								<button
									onClick={() => setIsCreating(true)}
									className="bg-primary hover:bg-primary-hover text-white font-medium py-2 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
								>
									<Plus size={18} />
									Cadastrar Primeira Obra
								</button>
							</div>
						) : (
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
								{obras.map((obra) => (
									<div
										key={obra.id}
										onClick={() =>
											navigate(
												`/app/obras/${obra.id}/visao-geral`,
											)
										}
										className="bg-surface border border-border rounded-xl p-5 hover:border-primary/50 transition-colors shadow-sm cursor-pointer"
									>
										<div className="flex items-start justify-between mb-3">
											<div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
												<HardHat className="text-primary w-5 h-5" />
											</div>
											<span
												className={`px-2.5 py-1 text-xs font-medium rounded-full ${
													obra.status === 'ACTIVE'
														? 'bg-emerald-500/10 text-emerald-500'
														: 'bg-slate-500/10 text-slate-500'
												}`}
											>
												{obra.status === 'ACTIVE'
													? 'Ativo'
													: 'Inativo'}
											</span>
										</div>
										<h3
											className="text-lg font-semibold text-text-main line-clamp-1"
											title={obra.name}
										>
											{obra.name}
										</h3>
										<p className="text-xs text-text-muted mt-2">
											Criado em{' '}
											{new Date(
												obra.created_at,
											).toLocaleDateString('pt-BR')}
										</p>
									</div>
								))}
							</div>
						)}
					</>
				)}

				{/* Modal de Criação */}
				{isCreating && (
					<div
						className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
						onMouseDown={handleCloseModal}
					>
						<div
							className="bg-surface border border-border rounded-xl shadow-2xl w-full max-w-lg mb-[10vh]"
							onMouseDown={(e) => e.stopPropagation()}
						>
							<div className="flex items-center justify-between p-5 border-b border-border">
								<h2 className="text-xl font-bold text-text-main">
									Cadastrar Nova Obra
								</h2>
								<button
									onClick={handleCloseModal}
									className="p-2 text-text-muted hover:text-text-main hover:bg-background rounded-lg transition-colors"
								>
									<X size={20} />
								</button>
							</div>

							<form
								onSubmit={handleCreateObra}
								className="p-5 space-y-5"
							>
								<div>
									<label className="block text-sm font-medium text-text-main mb-1">
										Nome da Obra
									</label>
									<input
										type="text"
										value={obraname}
										onChange={(e) =>
											setObraName(e.target.value)
										}
										required
										autoFocus
										className="w-full px-4 py-2.5 bg-background border border-border text-text-main rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-text-muted"
										placeholder="Ex: Residencial Alphaville"
									/>
								</div>

								<div className="flex justify-end pt-4 gap-3">
									<button
										type="button"
										onClick={handleCloseModal}
										className="px-4 py-2 text-text-muted hover:text-text-main font-medium transition-colors"
									>
										Cancelar
									</button>
									<button
										disabled={loading}
										type="submit"
										className="bg-primary hover:bg-primary-hover disabled:opacity-70 text-white font-medium py-2 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
									>
										{loading ? (
											<Loader2 className="animate-spin w-4 h-4" />
										) : (
											<Plus size={18} />
										)}
										{loading
											? 'Cadastrando...'
											: 'Cadastrar Obra'}
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
