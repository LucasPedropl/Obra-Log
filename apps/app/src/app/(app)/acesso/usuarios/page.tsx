'use client';

import { DataTable } from '@/components/shared/DataTable';
import { PageHeader } from '@/components/shared/PageHeader';
import { TableSearch } from '@/components/shared/TableSearch';
import { FilterPanel } from '@/components/shared/FilterPanel';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { Can } from '@/components/shared/Can';
import { TablePageSkeleton } from '@/components/shared/TablePageSkeleton';
import { Button } from '@/components/ui/button';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { useToast } from '@/components/ui/toaster';
import { UserForm, type UserFormInitialData } from '@/features/admin/components/UserForm';
import { UserSavedSuccess } from '@/features/admin/components/UserSavedSuccess';
import {
	getGlobalUsersAction,
	getAllProfilesAction,
	getCompanySitesAction,
	getUserSiteAccessAction,
	saveGlobalUserAction,
	toggleGlobalUserStatusAction,
} from '@/app/actions/globalUsers';
import { cn } from '@/lib/utils';
import { getActiveCompanyId } from '@/lib/utils';
import { Plus, Users as UsersIcon, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface CompanyUser {
	id: string;
	email: string;
	full_name: string;
	profile_id?: string;
	is_company_admin: boolean;
	profile_name?: string;
	status: string;
}

export default function UsuariosPage() {
	const [users, setUsers] = useState<CompanyUser[]>([]);
	const [profiles, setProfiles] = useState<{ id: string; name: string }[]>([]);
	const [sites, setSites] = useState<{ id: string; name: string }[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [isSaved, setIsSaved] = useState(false);
	const [searchTerm, setSearchTerm] = useState('');
	const [showFilters, setShowFilters] = useState(false);
	const [typeFilter, setTypeFilter] = useState<'ALL' | 'ADMIN' | 'RESTRICTED'>('ALL');
	const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
	const [isNewUser, setIsNewUser] = useState(false);
	const [editingUser, setEditingUser] = useState<UserFormInitialData | null>(null);
	const { addToast } = useToast();

	const loadData = async () => {
		try {
			setIsLoading(true);
			const [usersRes, profilesRes, sitesRes] = await Promise.all([
				getGlobalUsersAction(),
				getAllProfilesAction(),
				getCompanySitesAction(),
			]);

			if (usersRes.success) setUsers((usersRes.users as CompanyUser[]) || []);
			else addToast('Erro ao carregar usuários: ' + usersRes.error, 'error');

			if (profilesRes.success) setProfiles(profilesRes.profiles || []);
			if (sitesRes.success) setSites(sitesRes.sites || []);
		} catch {
			addToast('Erro desconhecido ao carregar dados', 'error');
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => { loadData(); }, []);

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

	const handleSaveUser = async (data: {
		id?: string;
		email: string;
		full_name: string;
		is_company_admin: boolean;
		profile_id: string;
		site_ids: string[];
	}) => {
		try {
			setIsSaving(true);
			const response = await saveGlobalUserAction({
				id: data.id,
				email: data.email,
				fullName: data.full_name,
				isCompanyAdmin: data.is_company_admin,
				profileId: data.profile_id,
				siteIds: data.site_ids,
			});

			if (!response.success) throw new Error(response.error || 'Erro ao salvar usuário');

			if (data.id) {
				addToast('Usuário atualizado com sucesso!', 'success');
				handleFormClose();
				return;
			}

			setGeneratedPassword(response.tempPassword ?? null);
			setIsNewUser(!!response.isNewUser);
			setIsSaved(true);
			addToast('Usuário cadastrado com sucesso!', 'success');
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : 'Erro ao salvar usuário';
			addToast(message, 'error');
		} finally {
			setIsSaving(false);
		}
	};

	const handleEdit = async (user: CompanyUser) => {
		const sitesRes = await getUserSiteAccessAction(user.id);
		setEditingUser({
			id: user.id,
			full_name: user.full_name,
			email: user.email,
			profile_id: user.profile_id ?? '',
			site_ids: sitesRes.success ? sitesRes.siteIds ?? [] : [],
		});
		setIsFormOpen(true);
	};

	const handleToggleStatus = async (user: CompanyUser) => {
		const isActive = user.status === 'ACTIVE';
		const res = await toggleGlobalUserStatusAction(user.id);
		if (res.success) {
			addToast(isActive ? 'Usuário desativado.' : 'Usuário reativado.', 'success');
			loadData();
		} else {
			addToast(res.error || 'Erro ao alterar status', 'error');
		}
	};

	const handleFormClose = () => {
		setIsFormOpen(false);
		setIsSaved(false);
		setGeneratedPassword(null);
		setEditingUser(null);
		loadData();
	};

	const openCreateForm = () => {
		setEditingUser(null);
		setIsSaved(false);
		setIsFormOpen(true);
	};

	return (
		<ProtectedRoute resource="usuarios">
			<div className="w-full flex flex-col gap-6 relative">
				<Can on="usuarios" perform="create" fallback={
					<PageHeader title="Usuários do Sistema" description="Gerencie os usuários e seus respectivos níveis de acesso na empresa." />
				}>
					<PageHeader title="Usuários do Sistema" description="Gerencie os usuários e seus respectivos níveis de acesso na empresa." onAdd={openCreateForm} addLabel="Novo Usuário" />
				</Can>

				{isFormOpen && (
					<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto" onClick={handleFormClose}>
						<div className="relative w-full max-w-lg mt-8 md:mt-0 animate-in fade-in zoom-in duration-300 bg-white rounded-xl shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
							<button onClick={handleFormClose} className="absolute top-4 right-4 z-10 p-2 text-muted-foreground hover:bg-muted/30 rounded-full transition-colors">
								<X size={20} />
							</button>
							{isSaved ? (
								<UserSavedSuccess isNewUser={isNewUser} generatedPassword={generatedPassword} onClose={handleFormClose} />
							) : (
								<UserForm companyId={getActiveCompanyId() || ''} profiles={profiles} sites={sites} initialData={editingUser} onSubmit={handleSaveUser} onCancel={handleFormClose} isLoading={isSaving} />
							)}
						</div>
					</div>
				)}

				{isLoading && users.length === 0 ? (
					<TablePageSkeleton rows={6} columns={4} />
				) : users.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50/50">
						<UsersIcon className="w-12 h-12 text-gray-400 mb-4" />
						<h3 className="text-lg font-medium text-gray-900 mb-1">Nenhum usuário encontrado</h3>
						<p className="text-gray-500 text-sm mb-6 text-center max-w-md">Cadastre seu primeiro usuário para que ele possa acessar o sistema.</p>
						<Can on="usuarios" perform="create">
							<Button onClick={openCreateForm}><Plus className="w-4 h-4 mr-2" />Cadastrar Primeiro Usuário</Button>
						</Can>
					</div>
				) : (
					<div className="space-y-4">
						<TableSearch value={searchTerm} onChange={setSearchTerm} placeholder="Buscar usuários por nome ou e-mail..." onFilterClick={() => setShowFilters(!showFilters)} />
						<FilterPanel isOpen={showFilters} onClose={() => setShowFilters(false)} onClear={() => setTypeFilter('ALL')}>
							<div className="flex flex-col gap-1.5">
								<label className="text-sm font-medium text-gray-700">Tipo de Usuário</label>
								<SearchableSelect
									options={[
										{ value: 'ALL', label: 'Todos os Tipos' },
										{ value: 'ADMIN', label: 'Administradores' },
										{ value: 'RESTRICTED', label: 'Usuários Restritos' },
									]}
									value={typeFilter}
									onChange={(v) => setTypeFilter(v as typeof typeFilter)}
									placeholder="Todos os Tipos"
									className="rounded-[5px] h-10 border-gray-300 bg-white shadow-sm border"
								/>
							</div>
						</FilterPanel>
						<DataTable
							data={filteredUsers}
							keyExtractor={(item) => item.id}
							onEdit={handleEdit}
							onDelete={handleToggleStatus}
							columns={[
								{ header: 'Nome', accessorKey: 'full_name', className: 'font-medium' },
								{ header: 'E-mail', accessorKey: 'email' },
								{
									header: 'Perfil / Papel',
									cell: (item) => (
										<span className={cn('px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border',
											item.is_company_admin ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-blue-50 text-blue-700 border-blue-100')}>
											{item.is_company_admin ? 'Admin Empresa' : (item.profile_name || 'Usuário Restrito')}
										</span>
									),
								},
								{
									header: 'Status',
									cell: (item) => (
										<span className={cn('px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border',
											item.status === 'ACTIVE' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100')}>
											{item.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
										</span>
									),
								},
							]}
						/>
					</div>
				)}
			</div>
		</ProtectedRoute>
	);
}
