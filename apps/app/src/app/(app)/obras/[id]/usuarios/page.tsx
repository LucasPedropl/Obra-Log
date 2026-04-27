'use client';
import React, { use, useState, useEffect } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { Pagination } from '@/components/shared/Pagination';
import { Users, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { TableSearch } from '@/components/shared/TableSearch';
import { DataTable } from '@/components/shared/DataTable';
import { getInstanceUsersAction, saveInstanceUserAction } from '@/app/actions/instanceUsers';
import { getAllProfilesAction } from '@/app/actions/globalUsers';
import { getActiveCompanyId } from '@/lib/utils';
import { useToast } from '@/components/ui/toaster';

interface SimpleProfile {
	id: string;
	name: string;
}

interface InstanceUser {
	instanceUserId: string;
	full_name: string;
	email: string;
	status: string;
	profile?: {
		name: string;
	};
}

export default function InstanceUsuariosPage({ params }: { params: Promise<{ id: string }> }) {
	const resolvedParams = use(params);
	const siteId = resolvedParams.id;
	const { addToast } = useToast();

	const [usuarios, setUsuarios] = useState<InstanceUser[]>([]);
	const [profiles, setProfiles] = useState<SimpleProfile[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	
	const [currentPage, setCurrentPage] = useState(1);
	const [searchTerm, setSearchTerm] = useState('');
	
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [isSaving, setIsSaving] = useState(false);

	// Form states
	const [email, setEmail] = useState('');
	const [fullName, setFullName] = useState('');
	const [profileId, setProfileId] = useState('');

	const itemsPerPage = 10;

	useEffect(() => {
		loadData();
	}, [siteId]);

	const loadData = async () => {
		setIsLoading(true);
		try {
			const [usersRes, profRes] = await Promise.all([
				getInstanceUsersAction(siteId),
				getAllProfilesAction()
			]);
			if (usersRes.success) setUsuarios((usersRes.users as unknown as InstanceUser[]) || []);
			if (profRes.success) setProfiles((profRes.profiles as unknown as SimpleProfile[]) || []);
		} catch (error: unknown) {
			console.error(error);
		} finally {
			setIsLoading(false);
		}
	};

	const filteredUsuarios = usuarios.filter((user) => {
		const searchLower = searchTerm.toLowerCase();
		return !searchTerm || 
			user.full_name?.toLowerCase().includes(searchLower) || 
			user.email?.toLowerCase().includes(searchLower);
	});

	const totalPages = Math.max(1, Math.ceil(filteredUsuarios.length / itemsPerPage));
	const currentItems = filteredUsuarios.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

	const handleOpenForm = () => {
		setEmail('');
		setFullName('');
		setProfileId('');
		setIsFormOpen(true);
	};

	const handleSave = async () => {
		if (!email || !fullName || !profileId) {
			addToast('Preencha todos os campos.', 'error');
			return;
		}

		setIsSaving(true);
		try {
			const companyId = getActiveCompanyId() || '';
			const res = await saveInstanceUserAction(siteId, {
				email,
				fullName,
				profileId,
				companyId
			});

			if (res.success) {
				addToast('Usuário vinculado à obra.', 'success');
				setIsFormOpen(false);
				loadData();
			} else {
				addToast(res.error || 'Erro ao salvar', 'error');
			}
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : 'Erro ao vincular usuário';
			addToast(message, 'error');
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<div className="w-full flex flex-col gap-6 relative animate-in fade-in zoom-in-95 duration-300">
			<PageHeader
				title="Acesso ao Sistema"
				description="Convide usuários e defina seus perfis (cargos) para esta Obra especificamente."
				onAdd={handleOpenForm}
				addLabel="Vincular Usuário"
			/>

			{isFormOpen && (
				<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
					<div className="bg-white rounded-2xl w-full max-w-md flex flex-col shadow-2xl relative animate-in zoom-in-95 duration-200">
						<div className="p-5 border-b flex justify-between items-center bg-gray-50/50 rounded-t-2xl">
							<div>
								<h3 className="text-lg font-semibold text-gray-900">Vincular Usuário à Obra</h3>
								<p className="text-xs text-gray-500">O usuário terá acesso apenas a esta obra.</p>
							</div>
							<button onClick={() => setIsFormOpen(false)} className="p-1.5 hover:bg-gray-200 rounded-full transition text-gray-500">
								<X className="w-5 h-5" />
							</button>
						</div>

						<div className="p-6 space-y-4">
							<div className="space-y-1.5">
								<label className="text-sm font-medium text-gray-700">E-mail</label>
								<Input value={email} onChange={e => setEmail(e.target.value)} placeholder="usuario@email.com" />
							</div>
							<div className="space-y-1.5">
								<label className="text-sm font-medium text-gray-700">Nome Completo</label>
								<Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="João da Silva" />
							</div>
							<div className="space-y-1.5">
								<label className="text-sm font-medium text-gray-700">Perfil de Acesso (Cargo)</label>
								<SearchableSelect 
									options={profiles.map(p => ({ value: p.id, label: p.name }))}
									value={profileId}
									onChange={setProfileId}
									placeholder="Selecione..."
								/>
							</div>
						</div>

						<div className="p-5 border-t bg-gray-50/50 flex justify-end gap-3 rounded-b-2xl">
							<Button variant="outline" onClick={() => setIsFormOpen(false)} disabled={isSaving}>Cancelar</Button>
							<Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white" disabled={isSaving}>
								{isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
								Vincular
							</Button>
						</div>
					</div>
				</div>
			)}

			{isLoading ? (
				<div className="flex justify-center p-12">
					<Loader2 className="w-8 h-8 animate-spin text-gray-400" />
				</div>
			) : usuarios.length === 0 && !searchTerm ? (
				<EmptyState
					title="Nenhum usuário nesta Obra"
					description="Nenhum usuário com acesso restrito a esta obra foi encontrado. (Admins Globais não aparecem aqui pois já têm acesso a tudo)."
					icon={<Users className="w-8 h-8 text-gray-400" />}
				/>
			) : (
				<div className="space-y-4">
					<TableSearch
						value={searchTerm}
						onChange={val => { setSearchTerm(val); setCurrentPage(1); }}
						placeholder="Buscar por nome ou e-mail..."
					/>

					<div className="bg-white rounded-xl shadow-sm border border-border">
						<DataTable
							data={currentItems}
							columns={[
								{ header: 'Nome', accessorKey: 'full_name', className: 'font-medium' },
								{ header: 'E-mail', accessorKey: 'email' },
								{ 
									header: 'Perfil', 
									cell: (item) => <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-md border border-blue-100">{item.profile?.name || 'Sem Perfil'}</span>
								},
								{ 
									header: 'Status', 
									cell: (item) => (
										<span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${item.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
											{item.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
										</span>
									)
								},
							]}
							keyExtractor={(item) => item.instanceUserId}
						/>

						{totalPages > 1 && (
							<div className="border-t">
								<Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
}