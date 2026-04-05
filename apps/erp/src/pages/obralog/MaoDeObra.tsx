import React, { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { useEscape } from '../../hooks/useEscape';
import { ERPLayout } from '../../components/layout/ERPLayout';
import {
	Plus,
	Download,
	Upload,
	X,
	UploadCloud,
	UserCircle,
	Search,
	ChevronDown,
	Pencil,
	Trash,
} from 'lucide-react';

export default function MaoDeObra() {
	const { showToast } = useToast();
	const { isAllowed } = useAuth();
	const [collaborators, setCollaborators] = useState<any[]>([]);
	const [profiles, setProfiles] = useState<any[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [activeTab, setActiveTab] = useState<'dados' | 'anexos'>('dados');

	useEscape(() => setIsModalOpen(false));

	const [formData, setFormData] = useState({
		name: '',
		cpf: '',
		rg: '',
		birth_date: '',
		phone: '',
		cellphone: '',
		email: '',
		cep: '',
		street: '',
		number: '',
		neighborhood: '',
		complement: '',
		state: '',
		city: '',
		profile_id: '',
	});
	const [isSubmitting, setIsSubmitting] = useState(false);

	const companyId = localStorage.getItem('selectedCompanyId');

	const [searchTerm, setSearchTerm] = useState('');

	useEffect(() => {
		if (companyId) {
			fetchCollaborators();
			fetchProfiles();
		}
	}, [companyId]);

	const fetchCollaborators = async () => {
		try {
			setIsLoading(true);
			const API_URL =
				import.meta.env.VITE_API_URL || 'http://localhost:5005';
			const res = await fetch(
				`${API_URL}/api/collaborators?company_id=${companyId}`,
			);
			if (res.ok) {
				const data = await res.json();
				setCollaborators(data);
			}
		} catch (err) {
			console.error(err);
		} finally {
			setIsLoading(false);
		}
	};

	const fetchProfiles = async () => {
		try {
			const API_URL =
				import.meta.env.VITE_API_URL || 'http://localhost:5005';
			const res = await fetch(
				`${API_URL}/api/access_profiles?company_id=${companyId}`,
			);
			if (res.ok) {
				const data = await res.json();
				setProfiles(data);
			}
		} catch (err) {
			console.error(err);
		}
	};

	const handleInputChange = (field: string, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!formData.name || !formData.phone) {
			showToast(
				'Por favor, preencha os campos obrigatórios (*).',
				'error',
			);
		}

		setIsSubmitting(true);
		try {
			const API_URL =
				import.meta.env.VITE_API_URL || 'http://localhost:5005';
			const res = await fetch(`${API_URL}/api/collaborators`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					company_id: companyId,
					...formData,
				}),
			});

			if (!res.ok) {
				const errData = await res.json();
				throw new Error(errData.error || 'Erro ao cadastrar');
			}

			if (formData.profile_id && formData.email) {
				await fetch(`${API_URL}/api/tenant/users`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						company_id: companyId,
						full_name: formData.name,
						email: formData.email,
						profile_id: formData.profile_id,
					}),
				}).catch((e) => console.warn('Erro ao criar user', e));
			}

			setIsModalOpen(false);
			setFormData({
				name: '',
				cpf: '',
				rg: '',
				birth_date: '',
				phone: '',
				cellphone: '',
				email: '',
				cep: '',
				street: '',
				number: '',
				neighborhood: '',
				complement: '',
				state: '',
				city: '',
				profile_id: '',
			});
			setActiveTab('dados');
			fetchCollaborators();
		} catch (err: any) {
			showToast(err.message, 'error');
		} finally {
			setIsSubmitting(false);
		}
	};

	const brazilianStates = [
		'AC',
		'AL',
		'AP',
		'AM',
		'BA',
		'CE',
		'DF',
		'ES',
		'GO',
		'MA',
		'MT',
		'MS',
		'MG',
		'PA',
		'PB',
		'PR',
		'PE',
		'PI',
		'RJ',
		'RN',
		'RS',
		'RO',
		'RR',
		'SC',
		'SP',
		'SE',
		'TO',
	];

	const filteredCollaborators = collaborators.filter(
		(c) =>
			c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			c.document?.includes(searchTerm) ||
			c.cpf?.includes(searchTerm) ||
			c.role_title?.toLowerCase().includes(searchTerm.toLowerCase()),
	);

	return (
		<ERPLayout>
			<div className="space-y-6 w-full">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-2xl font-bold text-text-main">
							Mão de Obra
						</h1>
						<p className="text-text-muted mt-1">
							Gestão de colaboradores.
						</p>
					</div>
					{isAllowed('mao_de_obra', 'create') && (
						<button
							onClick={() => {
								setEditingId(null);
								setFormData({
									name: '',
									cpf: '',
									rg: '',
									birth_date: '',
									phone: '',
									cellphone: '',
									email: '',
									cep: '',
									street: '',
									number: '',
									neighborhood: '',
									complement: '',
									state: '',
									city: '',
									profile_id: '',
								});
								setActiveTab('dados');
								setIsModalOpen(true);
							}}
							className="bg-primary hover:bg-primary-hover text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
						>
							<Plus size={18} />
							Novo Colaborador
						</button>
					)}
				</div>

				<div className="bg-surface border border-border rounded-sm p-4 sm:p-6 shadow-sm overflow-hidden">
					<div className="flex flex-col sm:flex-row gap-4 mb-6">
						<div className="relative flex-1">
							<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
								<Search size={18} className="text-text-muted" />
							</div>
							<input
								type="text"
								placeholder="Pesquisar colaborador..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-text-main focus:outline-none focus:border-primary transition-colors"
							/>
						</div>
						<div className="flex gap-2">
							<button className="flex items-center gap-2 bg-background border border-border text-text-main px-4 py-2 rounded-lg hover:border-primary/50 transition-colors">
								<ChevronDown size={20} />
								<span>Filtros</span>
							</button>
						</div>
					</div>

					<div className="overflow-x-auto bg-surface border border-border rounded-lg">
						<table className="w-full text-left [&_th]:border-b [&_th]:border-border [&_td]:border-b [&_td]:border-border [&_tbody_tr:last-child_td]:border-b-0">
							<thead className="bg-background border-b border-border">
								<tr>
									<th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider whitespace-nowrap">
										Nome
									</th>
									<th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider whitespace-nowrap">
										Documento (CPF)
									</th>
									<th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider whitespace-nowrap">
										Função / Cargo
									</th>
									<th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider whitespace-nowrap">
										Status
									</th>
									<th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider whitespace-nowrap text-right">
										Ações
									</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-border">
								{isLoading ? (
									<tr>
										<td
											colSpan={5}
											className="px-6 py-8 text-center text-text-muted"
										>
											Carregando...
										</td>
									</tr>
								) : filteredCollaborators.length === 0 ? (
									<tr>
										<td
											colSpan={5}
											className="px-6 py-8 text-center text-text-muted"
										>
											Nenhum colaborador encontrado.
										</td>
									</tr>
								) : (
									filteredCollaborators.map((c, idx) => (
										<tr
											key={idx}
											className="hover:bg-black/5 dark:hover:bg-white/5 even:bg-black/[0.02] dark:even:bg-white/[0.02] transition-colors"
										>
											<td className="px-6 py-4 font-medium text-text-main">
												{c.name}
											</td>
											<td className="px-6 py-4 text-text-muted">
												{c.document || c.cpf || '-'}
											</td>
											<td className="px-6 py-4 text-text-muted">
												{c.role_title}
											</td>
											<td className="px-6 py-4">
												<span
													className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${c.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
												>
													{c.status === 'ACTIVE'
														? 'Ativo'
														: 'Desligado'}
												</span>
											</td>
											<td className="px-6 py-4 text-right">
												<div className="flex items-center justify-end gap-2">
													{isAllowed(
														'mao_de_obra',
														'edit',
													) && (
														<button
															className="p-2 text-text-muted hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
															title="Editar"
															onClick={() => {
																setEditingId(
																	c.id,
																);
																setFormData({
																	name:
																		c.name ||
																		'',
																	cpf:
																		c.cpf ||
																		'',
																	rg:
																		c.rg ||
																		'',
																	birth_date:
																		c.birth_date ||
																		'',
																	phone:
																		c.phone ||
																		'',
																	cellphone:
																		c.cellphone ||
																		'',
																	email:
																		c.email ||
																		'',
																	cep:
																		c.cep ||
																		'',
																	street:
																		c.street ||
																		'',
																	number:
																		c.number ||
																		'',
																	neighborhood:
																		c.neighborhood ||
																		'',
																	complement:
																		c.complement ||
																		'',
																	state:
																		c.state ||
																		'',
																	city:
																		c.city ||
																		'',
																	profile_id:
																		c.profile_id ||
																		'',
																});
																setIsModalOpen(
																	true,
																);
															}}
														>
															<Pencil size={18} />
														</button>
													)}
													{isAllowed(
														'mao_de_obra',
														'delete',
													) && (
														<button
															className="p-2 text-text-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
															title="Excluir"
															onClick={() => {
																if (
																	window.confirm(
																		'Tem certeza que deseja excluir ' +
																			c.name +
																			'?',
																	)
																) {
																	handleDelete(
																		c.id,
																	);
																}
															}}
														>
															<Trash size={18} />
														</button>
													)}
												</div>
											</td>
										</tr>
									))
								)}
							</tbody>
						</table>
					</div>
				</div>
			</div>

			{isModalOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm sm:items-center">
					<div className="bg-surface w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-xl border border-border flex flex-col overflow-hidden">
						{/* Cabeçalho do Modal */}
						<div className="flex items-center justify-between px-6 py-4 border-b border-border bg-background">
							<h2 className="text-xl font-bold text-text-main">
								{editingId
									? 'Editar Colaborador'
									: 'Novo Colaborador'}
							</h2>
							<button
								onClick={() => setIsModalOpen(false)}
								className="p-2 hover:bg-surface rounded-lg text-text-muted hover:text-text-main transition-colors"
							>
								<X size={20} />
							</button>
						</div>

						{/* Sistema de Tabs */}
						<div className="flex px-6 border-b border-border bg-background pt-2 gap-6">
							<button
								onClick={() => setActiveTab('dados')}
								className={`pb-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'dados' ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-text-main'}`}
							>
								Dados
							</button>
							<button
								onClick={() => setActiveTab('anexos')}
								className={`pb-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'anexos' ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-text-main'}`}
							>
								Anexos
							</button>
						</div>

						{/* Corpo do Formulário */}
						<div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
							<form
								id="collabForm"
								onSubmit={handleSubmit}
								className="space-y-6"
							>
								{activeTab === 'dados' ? (
									<>
										{/* Sessão Topo com Foto à direita apenas aqui */}
										<div className="flex flex-col md:flex-row gap-8">
											<div className="flex-1 space-y-5">
												<div className="space-y-1.5 focus-within:text-primary">
													<label className="text-sm font-semibold text-text-main">
														Empresa *
													</label>
													<select
														disabled
														className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-text-main opacity-70 appearance-none"
													>
														<option>
															Empresa Selecionada
															(Contexto Atual)
														</option>
													</select>
												</div>

												<div className="space-y-1.5 border-l-2 border-primary pl-3 bg-primary/5 py-4 px-4 rounded-r-lg">
													<label className="text-sm font-bold text-text-main block mb-1">
														Acesso Opcional ao
														Sistema
													</label>
													<p className="text-xs text-text-muted mb-3">
														Selecione um perfil de
														acesso caso este
														colaborador precise
														entrar como usuário no
														sistema ERP. O email
														abaixo será usado como
														login.
													</p>
													<select
														value={
															formData.profile_id
														}
														onChange={(e) =>
															handleInputChange(
																'profile_id',
																e.target.value,
															)
														}
														className="w-full bg-surface border border-border rounded-lg px-4 py-2 text-text-main focus:ring-2 focus:ring-primary/50"
													>
														<option value="">
															Sem acesso ao
															sistema
														</option>
														{profiles.map((p) => (
															<option
																key={p.id}
																value={p.id}
															>
																{p.name}
															</option>
														))}
													</select>
												</div>
											</div>
											<div className="w-full md:w-48 flex flex-col items-center pt-2">
												<div className="w-32 h-32 border-2 border-dashed border-border rounded-full flex flex-col items-center justify-center text-text-muted hover:border-primary hover:text-primary transition-colors cursor-pointer bg-background">
													<UserCircle className="w-12 h-12 mb-1 opacity-50" />
													<span className="text-[10px] font-medium text-center px-2">
														Foto do Perfil
													</span>
												</div>
											</div>
										</div>

										<div className="space-y-5 mt-2">
											<div className="space-y-1.5">
												<label className="text-sm font-medium text-text-main">
													Nome *
												</label>
												<input
													type="text"
													required
													value={formData.name}
													onChange={(e) =>
														handleInputChange(
															'name',
															e.target.value,
														)
													}
													className="w-full bg-background border border-border rounded-lg px-4 py-2 text-text-main focus:ring-2 focus:ring-primary/50"
												/>
											</div>

											<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
												<div className="space-y-1.5">
													<label className="text-sm font-medium text-text-main">
														CPF
													</label>
													<input
														type="text"
														value={formData.cpf}
														onChange={(e) =>
															handleInputChange(
																'cpf',
																e.target.value,
															)
														}
														className="w-full bg-background border border-border rounded-lg px-4 py-2 text-text-main focus:ring-2 focus:ring-primary/50"
													/>
												</div>
												<div className="space-y-1.5">
													<label className="text-sm font-medium text-text-main">
														RG
													</label>
													<input
														type="text"
														value={formData.rg}
														onChange={(e) =>
															handleInputChange(
																'rg',
																e.target.value,
															)
														}
														className="w-full bg-background border border-border rounded-lg px-4 py-2 text-text-main focus:ring-2 focus:ring-primary/50"
													/>
												</div>
												<div className="space-y-1.5">
													<label className="text-sm font-medium text-text-main">
														Dt. Nascimento
													</label>
													<input
														type="date"
														value={
															formData.birth_date
														}
														onChange={(e) =>
															handleInputChange(
																'birth_date',
																e.target.value,
															)
														}
														className="w-full bg-background border border-border rounded-lg px-4 py-2 text-text-main focus:ring-2 focus:ring-primary/50"
													/>
												</div>
											</div>

											<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
												<div className="space-y-1.5">
													<label className="text-sm font-medium text-text-main">
														Telefone *
													</label>
													<input
														type="text"
														required
														value={formData.phone}
														onChange={(e) =>
															handleInputChange(
																'phone',
																e.target.value,
															)
														}
														className="w-full bg-background border border-border rounded-lg px-4 py-2 text-text-main focus:ring-2 focus:ring-primary/50"
													/>
												</div>
												<div className="space-y-1.5">
													<label className="text-sm font-medium text-text-main">
														Celular
													</label>
													<input
														type="text"
														value={
															formData.cellphone
														}
														onChange={(e) =>
															handleInputChange(
																'cellphone',
																e.target.value,
															)
														}
														className="w-full bg-background border border-border rounded-lg px-4 py-2 text-text-main focus:ring-2 focus:ring-primary/50"
													/>
												</div>
												<div className="space-y-1.5">
													<label className="text-sm font-medium text-text-main">
														Email
													</label>
													<input
														type="email"
														value={formData.email}
														onChange={(e) =>
															handleInputChange(
																'email',
																e.target.value,
															)
														}
														className="w-full bg-background border border-border rounded-lg px-4 py-2 text-text-main focus:ring-2 focus:ring-primary/50"
													/>
												</div>
											</div>
										</div>

										<div className="pt-6 pb-2">
											<h3 className="text-lg font-bold text-text-main border-b border-border pb-2">
												Endereço
											</h3>
										</div>

										<div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
											<div className="space-y-1.5 sm:col-span-1">
												<label className="text-sm font-medium text-text-main">
													CEP
												</label>
												<input
													type="text"
													value={formData.cep}
													onChange={(e) =>
														handleInputChange(
															'cep',
															e.target.value,
														)
													}
													className="w-full bg-background border border-border rounded-lg px-4 py-2 text-text-main focus:ring-2 focus:ring-primary/50"
												/>
											</div>
											<div className="space-y-1.5 sm:col-span-3">
												<label className="text-sm font-medium text-text-main">
													Logradouro
												</label>
												<input
													type="text"
													value={formData.street}
													onChange={(e) =>
														handleInputChange(
															'street',
															e.target.value,
														)
													}
													className="w-full bg-background border border-border rounded-lg px-4 py-2 text-text-main focus:ring-2 focus:ring-primary/50"
												/>
											</div>
										</div>

										<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
											<div className="space-y-1.5">
												<label className="text-sm font-medium text-text-main">
													Número
												</label>
												<input
													type="text"
													value={formData.number}
													onChange={(e) =>
														handleInputChange(
															'number',
															e.target.value,
														)
													}
													className="w-full bg-background border border-border rounded-lg px-4 py-2 text-text-main focus:ring-2 focus:ring-primary/50"
												/>
											</div>
											<div className="space-y-1.5">
												<label className="text-sm font-medium text-text-main">
													Bairro
												</label>
												<input
													type="text"
													value={
														formData.neighborhood
													}
													onChange={(e) =>
														handleInputChange(
															'neighborhood',
															e.target.value,
														)
													}
													className="w-full bg-background border border-border rounded-lg px-4 py-2 text-text-main focus:ring-2 focus:ring-primary/50"
												/>
											</div>
											<div className="space-y-1.5">
												<label className="text-sm font-medium text-text-main">
													Complemento
												</label>
												<input
													type="text"
													value={formData.complement}
													onChange={(e) =>
														handleInputChange(
															'complement',
															e.target.value,
														)
													}
													className="w-full bg-background border border-border rounded-lg px-4 py-2 text-text-main focus:ring-2 focus:ring-primary/50"
												/>
											</div>
										</div>

										<div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pb-4">
											<div className="space-y-1.5 sm:col-span-1">
												<label className="text-sm font-medium text-text-main">
													UF
												</label>
												<select
													value={formData.state}
													onChange={(e) =>
														handleInputChange(
															'state',
															e.target.value,
														)
													}
													className="w-full bg-background border border-border rounded-lg px-4 py-2 text-text-main focus:ring-2 focus:ring-primary/50"
												>
													<option value="">
														Selecione...
													</option>
													{brazilianStates.map(
														(uf) => (
															<option
																key={uf}
																value={uf}
															>
																{uf}
															</option>
														),
													)}
												</select>
											</div>
											<div className="space-y-1.5 sm:col-span-3">
												<label className="text-sm font-medium text-text-main">
													Cidade
												</label>
												<input
													type="text"
													value={formData.city}
													onChange={(e) =>
														handleInputChange(
															'city',
															e.target.value,
														)
													}
													className="w-full bg-background border border-border rounded-lg px-4 py-2 text-text-main focus:ring-2 focus:ring-primary/50"
												/>
											</div>
										</div>
									</>
								) : (
									<div className="py-12 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl bg-background/50">
										<UploadCloud className="w-12 h-12 text-primary/60 mb-4" />
										<p className="text-text-main font-medium">
											Arraste e solte arquivos aqui
										</p>
										<p className="text-sm text-text-muted mt-1 mb-6">
											PDF, PNG, JPG até 10MB
										</p>
										<button
											type="button"
											className="px-4 py-2 bg-surface border border-border text-sm font-medium rounded-lg text-text-main hover:bg-border/50 transition-colors"
										>
											Selecionar do computador
										</button>
									</div>
								)}
							</form>
						</div>

						{/* Rodapé e Botões */}
						<div className="px-6 py-4 border-t border-border bg-background flex justify-end gap-3 rounded-b-2xl">
							<button
								type="button"
								onClick={() => setIsModalOpen(false)}
								className="px-5 py-2.5 text-text-main font-medium hover:bg-surface border border-transparent hover:border-border rounded-lg transition-all"
							>
								Cancelar
							</button>
							<button
								type="submit"
								form="collabForm"
								disabled={isSubmitting}
								className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white font-medium rounded-lg transition-colors shadow-sm disabled:opacity-50"
							>
								{isSubmitting ? 'Salvando...' : 'Salvar'}
							</button>
						</div>
					</div>
				</div>
			)}
		</ERPLayout>
	);
}
