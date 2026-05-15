'use client';

import { DataTable, DetailRow } from '@/components/shared/DataTable';
import { PageHeader } from '@/components/shared/PageHeader';
import { TableSearch } from '@/components/shared/TableSearch';
import { FilterPanel } from '@/components/shared/FilterPanel';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toaster';
import { UserForm } from '@/features/admin/components/UserForm';
import { getGlobalUsersAction, getAllProfilesAction, saveGlobalUserAction } from '@/app/actions/globalUsers';
import { getActiveCompanyId } from '@/lib/utils';
import { Loader2, Plus, UserCheck, Users as UsersIcon, X } from 'lucide-react';
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
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [searchTerm, setSearchTerm] = useState('');
	const [showFilters, setShowFilters] = useState(false);
	const [typeFilter, setTypeFilter] = useState<'ALL' | 'ADMIN' | 'RESTRICTED'>('ALL');
	const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
	const { addToast } = useToast();

	const loadData = async () => {
		try {
			setIsLoading(true);
			const [usersRes, profilesRes] = await Promise.all([
				getGlobalUsersAction(),
				getAllProfilesAction()
			]);

			if (usersRes.success) {
				setUsers((usersRes.users as unknown as CompanyUser[]) || []);
			} else {
				addToast(usersRes.error || 'Erro ao carregar usuários', 'error');
			}

			if (profilesRes.success) {
				setProfiles(profilesRes.profiles || []);
			}
		} catch (error) {
			console.error(error);
			addToast('Erro ao carregar dados', 'error');
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		loadData();
	}, []);

	const handleFormClose = () => {
		setIsFormOpen(false);
		setGeneratedPassword(null);
	};

	const handleSaveUser = async (data: any) => {
		try {
			setIsSaving(true);
			const response = await saveGlobalUserAction({
				email: data.email,
				fullName: data.full_name,
				isCompanyAdmin: data.is_company_admin,
				profileId: data.profile_id,
			});

			if (response.success) {
				setGeneratedPassword(response.tempPassword ?? null);
				addToast('Usuário cadastrado com sucesso!', 'success');
				await loadData();
			} else {
				throw new Error(response.error || 'Erro ao salvar usuário');
			}
		} catch (error: any) {
			addToast(error.message || 'Erro ao salvar usuário', 'error');
		} finally {
			setIsSaving(false);
		}
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

	return (
		<div className="w-full flex flex-col gap-6 relative">
			<PageHeader
				title="Usuários do Sistema"
				description="Gerencie os usuários e seus respectivos níveis de acesso na empresa."
				onAdd={() => setIsFormOpen(true)}
				addLabel="Novo Usuário"
			/>

			{isFormOpen && (
				<div
					className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto"
					onClick={handleFormClose}
				>
					<div
						className="relative w-full max-w-2xl mt-8 md:mt-0 animate-in fade-in zoom-in duration-300 bg-white p-8 rounded-2xl shadow-2xl border overflow-hidden max-h-[90vh]"
						onClick={(e) => e.stopPropagation()}
					>
						<button
							onClick={handleFormClose}
							className="absolute top-4 right-4 z-10 p-2 text-muted-foreground hover:bg-muted/30 rounded-full transition-colors"
						>
							<X size={20} />
						</button>

						{generatedPassword ? (
							<div className="text-center space-y-4 py-8">
								<div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
									<UserCheck className="w-8 h-8 text-green-600" />
								</div>
								<h3 className="text-xl font-medium text-gray-900">
									Usuário Criado com Sucesso!
								</h3>
								<p className="text-gray-500 max-w-sm mx-auto">
									A senha temporária do usuário foi gerada.
									Copie-a agora, pois não será mostrada novamente.
								</p>
								<div className="bg-gray-100 p-4 rounded-lg flex items-center justify-center gap-3 max-w-xs mx-auto my-6">
									<code className="text-xl font-mono font-bold tracking-wider">
										{generatedPassword}
									</code>
								</div>
								<Button
									onClick={handleFormClose}
									className="w-full max-w-xs"
								>
									Concluir
								</Button>
							</div>
						) : (
							<UserForm
								companyId={getActiveCompanyId() || ''}
								profiles={profiles}
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
					<Button onClick={() => setIsFormOpen(true)}>
						<Plus className="w-4 h-4 mr-2" />
						Cadastrar Primeiro Usuário
					</Button>
				</div>
			) : (
				<div className="space-y-4">
					<TableSearch
						value={searchTerm}
						onChange={setSearchTerm}
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
								onChange={(e) =>
									setTypeFilter(e.target.value as any)
								}
								className="h-10 px-3 py-2 rounded-[5px] border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent w-full"
							>
								<option value="ALL">Todos os Tipos</option>
								<option value="ADMIN">Administradores</option>
								<option value="RESTRICTED">Usuários Restritos</option>
							</select>
						</div>
					</FilterPanel>

					<div className="bg-white rounded-xl shadow-sm border border-border">
						<DataTable
							data={filteredUsers}
							columns={[
								{
									header: 'Nome',
									accessorKey: 'full_name',
									className: 'font-medium',
								},
								{
									header: 'E-mail',
									accessorKey: 'email',
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
								}
							]}
							detailsTitle="Detalhes do Usuário"
							renderDetails={(item) => (
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
									<DetailRow label="Nome Completo" value={item.full_name} className="sm:col-span-2" />
									<DetailRow label="E-mail" value={item.email} />
									<DetailRow label="Perfil" value={item.is_company_admin ? 'Administrador da Empresa' : (item.profile_name || 'Sem Perfil')} />
									<DetailRow label="Status" value={item.status === 'ACTIVE' ? 'Ativo' : 'Inativo'} />
								</div>
							)}
							keyExtractor={(item) => item.id}
						/>
					</div>
				</div>
			)}
		</div>
	);
}
