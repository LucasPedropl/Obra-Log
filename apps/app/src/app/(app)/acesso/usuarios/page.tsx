'use client';

import { DataTable, DetailRow } from '@/components/shared/DataTable';
import { PageHeader } from '@/components/shared/PageHeader';
import { TableSearch } from '@/components/shared/TableSearch';
import { FilterPanel } from '@/components/shared/FilterPanel';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { Can } from '@/components/shared/Can';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toaster';
import { UserForm } from '@/features/admin/components/UserForm';
import { getGlobalUsersAction, getAllProfilesAction, saveGlobalUserAction } from '@/app/actions/globalUsers';
import { getActiveCompanyId } from '@/lib/utils';
import { Info, Loader2, Plus, UserCheck, Users as UsersIcon, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface CompanyUser {
	id: string;
	email: string;
	full_name: string;
	is_company_admin: boolean;
	profile_name?: string;
	status: string;
}

export default function UsuariosPage() {
	const [users, setUsers] = useState<CompanyUser[]>([]);
	const [profiles, setProfiles] = useState<any[]>([]);
	const [sites, setSites] = useState<any[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [isSaved, setIsSaved] = useState(false);
	const [searchTerm, setSearchTerm] = useState('');
	const [showFilters, setShowFilters] = useState(false);
	const [typeFilter, setTypeFilter] = useState<'ALL' | 'ADMIN' | 'RESTRICTED'>('ALL');
	const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
	const [isNewUser, setIsNewUser] = useState(false);
	const { addToast } = useToast();

	const loadData = async () => {
		try {
			setIsLoading(true);
			const [usersRes, profilesRes, sitesRes] = await Promise.all([
				getGlobalUsersAction(),
				getAllProfilesAction(),
				import('@/app/actions/globalUsers').then(m => m.getCompanySitesAction())
			]);

			if (usersRes.success) {
				setUsers((usersRes.users as unknown as CompanyUser[]) || []);
			} else {
				addToast('Erro ao carregar usuários: ' + usersRes.error, 'error');
			}

			if (profilesRes.success) {
				setProfiles(profilesRes.profiles || []);
			}

			if (sitesRes.success) {
				setSites(sitesRes.sites || []);
			}
		} catch (error) {
			addToast('Erro desconhecido ao carregar dados', 'error');
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		loadData();
	}, []);

	const handleSearchChange = (val: string) => {
		setSearchTerm(val);
	};

	const filteredUsers = users.filter((user) => {
		const searchLower = searchTerm.toLowerCase();
		const matchesSearch = !searchTerm ||
			user.full_name?.toLowerCase().includes(searchLower) ||
			user.email?.toLowerCase().includes(searchLower);

		const matchesType = typeFilter === 'ALL' ||
			(typeFilter === 'ADMIN' && user.is_company_admin) ||
			(typeFilter === 'RESTRICTED' && !user.is_company_admin);

		return matchesSearch && matchesType;
	});

	const handleSaveUser = async (data: any) => {
		try {
			setIsSaving(true);
			const response = await saveGlobalUserAction({
				email: data.email,
				fullName: data.full_name,
				isCompanyAdmin: data.is_company_admin,
				profileId: data.profile_id,
				siteIds: data.site_ids,
			});

			if (response.success) {
				setGeneratedPassword(response.tempPassword ?? null);
				setIsNewUser(!!response.isNewUser);
				setIsSaved(true);
				addToast('Usuário cadastrado com sucesso!', 'success');
			} else {
				throw new Error(response.error || 'Erro ao salvar usuário');
			}
		} catch (error: any) {
			addToast(error.message || 'Erro ao salvar usuário', 'error');
		} finally {
			setIsSaving(false);
		}
	};

	const handleFormClose = () => {
		setIsFormOpen(false);
		setIsSaved(false);
		setGeneratedPassword(null);
		loadData();
	};

	return (
		<ProtectedRoute resource="usuarios">
			<div className="w-full flex flex-col gap-6 relative">
				<Can 
					on="usuarios" 
					perform="create"
					fallback={
						<PageHeader
							title="Usuários do Sistema"
							description="Gerencie os usuários e seus respectivos níveis de acesso na empresa."
						/>
					}
				>
					<PageHeader
						title="Usuários do Sistema"
						description="Gerencie os usuários e seus respectivos níveis de acesso na empresa."
						onAdd={() => setIsFormOpen(true)}
						addLabel="Novo Usuário"
					/>
				</Can>

				{isFormOpen && (
					<div
						className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto"
						onClick={handleFormClose}
					>
						<div
							className="relative w-full max-w-lg mt-8 md:mt-0 animate-in fade-in zoom-in duration-300 bg-white rounded-xl shadow-2xl p-6"
							onClick={(e) => e.stopPropagation()}
						>
							<button
								onClick={handleFormClose}
								className="absolute top-4 right-4 z-10 p-2 text-muted-foreground hover:bg-muted/30 rounded-full transition-colors"
							>
								<X size={20} />
							</button>

							{isSaved ? (
								<div className="bg-white rounded-xl p-8 text-center flex flex-col items-center gap-4">
									<div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
										<UserCheck className="w-8 h-8 text-green-600" />
									</div>
									<h3 className="text-xl font-bold text-gray-900">
										{isNewUser ? 'Usuário Criado!' : 'Usuário Vinculado!'}
									</h3>
									<p className="text-gray-500">
										{isNewUser 
											? 'O acesso foi configurado com sucesso para esta empresa.'
											: 'Este e-mail já possui cadastro no sistema e foi vinculado à empresa atual.'
										}
									</p>
									
									{generatedPassword ? (
										<div className="w-full bg-blue-50 border border-blue-100 rounded-lg p-4 mt-2">
											<p className="text-xs font-bold text-blue-600 uppercase mb-2">Credenciais de Acesso</p>
											<div className="flex flex-col gap-2 text-left">
												<p className="text-sm font-medium text-gray-700">Senha Provisória:</p>
												<code className="bg-white px-3 py-2 rounded border border-blue-200 text-blue-700 font-mono text-lg block">
													{generatedPassword}
												</code>
												<p className="text-[10px] text-blue-500 mt-1 italic">
													* Informe esta senha ao usuário. Ele poderá alterá-la no primeiro acesso.
												</p>
											</div>
										</div>
									) : !isNewUser && (
										<div className="w-full bg-amber-50 border border-orange-100 rounded-lg p-4 mt-2 flex items-start gap-3 text-left">
											<Info className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
											<p className="text-sm text-orange-800">
												Como o usuário já existe, ele deve utilizar a <strong>senha atual</strong> para entrar. Se ele não lembrar, poderá usar a função "Esqueci minha senha" na tela de login.
											</p>
										</div>
									)}

									<Button onClick={handleFormClose} className="w-full mt-4">
										Concluir e Voltar
									</Button>
								</div>
							) : (
								<UserForm
									companyId={getActiveCompanyId() || ''}
									profiles={profiles}
									sites={sites}
									onSubmit={handleSaveUser}
									onCancel={handleFormClose}
									isLoading={isSaving}
								/>
							)}
						</div>
					</div>
				)}

				{isLoading && users.length === 0 ? (
					<div className="flex justify-center p-12">
						<Loader2 className="w-8 h-8 animate-spin text-gray-400" />
					</div>
				) : users.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50/50">
						<UsersIcon className="w-12 h-12 text-gray-400 mb-4" />
						<h3 className="text-lg font-medium text-gray-900 mb-1">
							Nenhum usuário encontrado
						</h3>
						<p className="text-gray-500 text-sm mb-6 text-center max-w-md">
							Cadastre seu primeiro usuário para que ele possa acessar o sistema e gerenciar a empresa.
						</p>
						<Can on="usuarios" perform="create">
							<Button onClick={() => setIsFormOpen(true)}>
								<Plus className="w-4 h-4 mr-2" />
								Cadastrar Primeiro Usuário
							</Button>
						</Can>
					</div>
				) : (
					<div className="space-y-4">
						<TableSearch
							value={searchTerm}
							onChange={handleSearchChange}
							placeholder="Buscar usuários por nome ou e-mail..."
							onFilterClick={() => setShowFilters(!showFilters)}
						/>

						<FilterPanel
							isOpen={showFilters}
							onClose={() => setShowFilters(false)}
							onClear={() => {
								setTypeFilter('ALL');
							}}
						>
							<div className="flex flex-col gap-1.5">
								<label className="text-sm font-medium text-gray-700">
									Tipo de Usuário
								</label>
								<select
									value={typeFilter}
									onChange={(e) => setTypeFilter(e.target.value as any)}
									className="h-10 px-3 py-2 rounded-[5px] border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent w-full"
								>
									<option value="ALL">Todos os Tipos</option>
									<option value="ADMIN">Administradores</option>
									<option value="RESTRICTED">Usuários Restritos</option>
								</select>
							</div>
						</FilterPanel>

						<div className="flex flex-col gap-6">
							<DataTable
								data={filteredUsers}
								keyExtractor={(item) => item.id}
								columns={[
									{ 
										header: 'Nome', 
										accessorKey: 'full_name',
										className: 'font-medium'
									},
									{ 
										header: 'E-mail', 
										accessorKey: 'email'
									},
									{ 
										header: 'Perfil / Papel', 
										cell: (item) => (
											<span className={cn(
												"px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border",
												item.is_company_admin
													? "bg-purple-50 text-purple-700 border-purple-100"
													: "bg-blue-50 text-blue-700 border-blue-100"
											)}>
												{item.is_company_admin ? 'Admin Empresa' : (item.profile_name || 'Usuário Restrito')}       
											</span>
										)
									},
									{ 
										header: 'Status', 
										cell: (item) => (
											<span className={cn(
												"px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border",
												item.status === 'ACTIVE'
													? "bg-green-50 text-green-700 border-green-100"
													: "bg-red-50 text-red-700 border-red-100"
											)}>
												{item.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
											</span>
										)
									},
								]}
								/>						</div>
					</div>
				)}
			</div>
		</ProtectedRoute>
	);
}
