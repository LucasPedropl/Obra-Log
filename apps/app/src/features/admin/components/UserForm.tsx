import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Info, Building2 } from 'lucide-react';
import { accessProfilesService } from '../services/accessProfiles.service';
import { cn } from '@/lib/utils';

const userFormSchema = z.object({
	full_name: z.string().min(3, 'O nome deve ter no mínimo 3 caracteres'),
	email: z.string().email('E-mail inválido'),
	profile_id: z.string().min(1, 'Selecione um perfil de acesso'),
	site_ids: z.array(z.string()).optional().default([]),
});

type UserFormData = z.infer<typeof userFormSchema>;

interface UserFormProps {
	companyId: string;
	profiles: any[];
	sites: any[];
	onSubmit: (data: UserFormData & { is_company_admin: boolean }) => Promise<void>;
	onCancel: () => void;
	isLoading: boolean;
}

export function UserForm({
	profiles,
	sites,
	onSubmit,
	onCancel,
	isLoading,
}: UserFormProps) {
	const [selectedProfileScope, setSelectedProfileScope] = useState<'ALL_SITES' | 'SPECIFIC_SITES' | null>(null);
	const [isFetchingProfile, setIsFetchingProfile] = useState(false);

	const {
		register,
		handleSubmit,
		watch,
		setValue,
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
		if (index > -1) {
			current.splice(index, 1);
		} else {
			current.push(siteId);
		}
		setValue('site_ids', current);
	};

	const internalOnSubmit = (data: UserFormData) => {
		onSubmit({ ...data, is_company_admin: false });
	};

	return (
		<form onSubmit={handleSubmit(internalOnSubmit)} className="space-y-6">
			<div>
				<h3 className="text-lg font-medium text-gray-900">
					Novo Usuário
				</h3>
				<p className="text-sm text-gray-500">
					Cadastre um novo usuário para acessar o sistema na empresa.
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
						<p className="mt-1 text-sm text-red-500">
							{errors.full_name.message}
						</p>
					)}
				</div>

				<div>
					<label className="block text-sm font-medium text-gray-700 mb-1">
						E-mail
					</label>
					<Input
						{...register('email')}
						type="email"
						placeholder="exemplo@email.com"
						className={errors.email ? 'border-red-500' : ''}
					/>
					{errors.email && (
						<p className="mt-1 text-sm text-red-500">
							{errors.email.message}
						</p>
					)}
				</div>

				<div>
					<label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
						Perfil de Acesso (Cargo)
						{isFetchingProfile && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
					</label>
					<select
						{...register('profile_id')}
						className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
					>
						<option value="">Selecione um perfil...</option>
						{profiles.map((p) => (
							<option key={p.id} value={p.id}>
								{p.name}
							</option>
						))}
					</select>
					{errors.profile_id && (
						<p className="mt-1 text-sm text-red-500">
							{errors.profile_id.message}
						</p>
					)}
				</div>

				{selectedProfileScope === 'SPECIFIC_SITES' && (
					<div className="pt-4 border-t space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
						<div className="flex items-center gap-2 text-amber-600">
							<Building2 size={18} />
							<h4 className="text-sm font-semibold">Vincular Obras Específicas</h4>
						</div>
						<p className="text-xs text-gray-500">
							Este perfil possui restrição de acesso. Selecione abaixo as obras que este usuário poderá visualizar e gerenciar.
						</p>

						{sites.length === 0 ? (
							<div className="bg-amber-50 border border-amber-100 rounded-lg p-3 flex gap-3 text-amber-800">
								<Info size={20} className="shrink-0" />
								<p className="text-xs leading-relaxed">
									<strong>Atenção:</strong> Não há obras ativas cadastradas nesta empresa. 
									O usuário será criado, mas <strong>não terá acesso a nenhuma obra</strong> até que obras sejam cadastradas e vinculadas a ele.
								</p>
							</div>
						) : (
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border rounded-md bg-gray-50/50">
								{sites.map((site) => (
									<div 
										key={site.id}
										onClick={() => toggleSite(site.id)}
										className={cn(
											"flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-all",
											selectedSiteIds.includes(site.id)
												? "bg-primary/10 border-primary/30 text-primary font-medium"
												: "bg-white border-gray-200 hover:border-gray-300 text-gray-700"
										)}
									>
										<div className={cn(
											"w-4 h-4 rounded border flex items-center justify-center transition-colors",
											selectedSiteIds.includes(site.id) ? "bg-primary border-primary" : "border-gray-300"
										)}>
											{selectedSiteIds.includes(site.id) && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
										</div>
										<span className="text-xs truncate">{site.name}</span>
									</div>
								))}
							</div>
						)}
					</div>
				)}
			</div>

			<div className="flex items-center justify-end gap-3 pt-4 border-t">
				<Button
					type="button"
					variant="outline"
					onClick={onCancel}
					disabled={isLoading}
				>
					Cancelar
				</Button>
				<Button type="submit" disabled={isLoading}>
					{isLoading && (
						<Loader2 className="w-4 h-4 mr-2 animate-spin" />
					)}
					Salvar Usuário
				</Button>
			</div>
		</form>
	);
}
