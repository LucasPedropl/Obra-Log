import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Loader2 } from 'lucide-react';
import { accessProfilesService } from '../services/accessProfiles.service';
import { UserFormSites } from './UserFormSites';

const userFormSchema = z.object({
	full_name: z.string().min(3, 'O nome deve ter no mínimo 3 caracteres'),
	email: z.string().email('E-mail inválido'),
	profile_id: z.string().min(1, 'Selecione um perfil de acesso'),
	site_ids: z.array(z.string()),
});

type UserFormData = z.infer<typeof userFormSchema>;

export interface UserFormInitialData {
	id: string;
	full_name: string;
	email: string;
	profile_id: string;
	site_ids: string[];
}

interface UserFormProps {
	companyId: string;
	profiles: { id: string; name: string }[];
	sites: { id: string; name: string }[];
	initialData?: UserFormInitialData | null;
	onSubmit: (data: UserFormData & { is_company_admin: boolean; id?: string }) => Promise<void>;
	onCancel: () => void;
	isLoading: boolean;
}

export function UserForm({
	profiles,
	sites,
	initialData,
	onSubmit,
	onCancel,
	isLoading,
}: UserFormProps) {
	const isEditing = Boolean(initialData?.id);
	const [selectedProfileScope, setSelectedProfileScope] = useState<'ALL_SITES' | 'SPECIFIC_SITES' | null>(null);
	const [isFetchingProfile, setIsFetchingProfile] = useState(false);

	const {
		register,
		handleSubmit,
		watch,
		setValue,
		reset,
		formState: { errors },
	} = useForm<UserFormData>({
		resolver: zodResolver(userFormSchema),
		defaultValues: {
			full_name: '',
			email: '',
			profile_id: '',
			site_ids: [],
		},
	});

	const profileId = watch('profile_id');
	const selectedSiteIds = watch('site_ids');

	useEffect(() => {
		if (initialData) {
			reset({
				full_name: initialData.full_name,
				email: initialData.email,
				profile_id: initialData.profile_id,
				site_ids: initialData.site_ids,
			});
		}
	}, [initialData, reset]);

	useEffect(() => {
		async function fetchProfileScope() {
			if (!profileId) {
				setSelectedProfileScope(null);
				return;
			}
			setIsFetchingProfile(true);
			try {
				const profile = await accessProfilesService.getProfileById(profileId);
				setSelectedProfileScope(profile?.scope || 'ALL_SITES');
			} catch (error) {
				console.error('Error fetching profile scope:', error);
			} finally {
				setIsFetchingProfile(false);
			}
		}
		fetchProfileScope();
	}, [profileId]);

	const toggleSite = (siteId: string) => {
		const current = [...selectedSiteIds];
		const index = current.indexOf(siteId);
		if (index > -1) current.splice(index, 1);
		else current.push(siteId);
		setValue('site_ids', current);
	};

	const internalOnSubmit = (data: UserFormData) => {
		onSubmit({
			...data,
			is_company_admin: false,
			id: initialData?.id,
		});
	};

	return (
		<form onSubmit={handleSubmit(internalOnSubmit)} className="space-y-6">
			<div>
				<h3 className="text-lg font-medium text-gray-900">
					{isEditing ? 'Editar Usuário' : 'Novo Usuário'}
				</h3>
				<p className="text-sm text-gray-500">
					{isEditing
						? 'Atualize o perfil de acesso e obras vinculadas.'
						: 'Cadastre um novo usuário para acessar o sistema na empresa.'}
				</p>
			</div>

			<div className="space-y-4 max-h-[60vh] overflow-y-auto px-1">
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-1">
						Nome Completo
					</label>
					<Input
						{...register('full_name')}
						placeholder="Digite o nome completo"
						className={errors.full_name ? 'border-red-500' : ''}
					/>
					{errors.full_name && (
						<p className="mt-1 text-sm text-red-500">{errors.full_name.message}</p>
					)}
				</div>

				<div>
					<label className="block text-sm font-medium text-gray-700 mb-1">
						E-mail
					</label>
					<Input
						{...register('email')}
						type="email"
						disabled={isEditing}
						placeholder="exemplo@email.com"
						className={errors.email ? 'border-red-500' : ''}
					/>
					{errors.email && (
						<p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
					)}
				</div>

				<div>
					<label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
						Perfil de Acesso (Cargo)
						{isFetchingProfile && (
							<Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
						)}
					</label>
					<SearchableSelect
						options={profiles.map((p) => ({ value: p.id, label: p.name }))}
						value={profileId}
						onChange={(value) => setValue('profile_id', value, { shouldValidate: true })}
						placeholder="Selecione um perfil..."
						className="rounded-md h-10 border border-input bg-background px-3 py-2 text-sm"
					/>
					{errors.profile_id && (
						<p className="mt-1 text-sm text-red-500">{errors.profile_id.message}</p>
					)}
				</div>

				{selectedProfileScope === 'SPECIFIC_SITES' && (
					<UserFormSites
						sites={sites}
						selectedSiteIds={selectedSiteIds}
						onToggle={toggleSite}
					/>
				)}
			</div>

			<div className="flex items-center justify-end gap-3 pt-4 border-t">
				<Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
					Cancelar
				</Button>
				<Button type="submit" disabled={isLoading}>
					{isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
					{isEditing ? 'Salvar Alterações' : 'Salvar Usuário'}
				</Button>
			</div>
		</form>
	);
}
