import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { AccessProfile } from '../services/accessProfiles.service';
import { useConstructionSites } from '@/features/obras/hooks/useConstructionSites';

const userFormSchema = z.object({
	full_name: z.string().min(3, 'O nome deve ter no mínimo 3 caracteres'),
	email: z.string().email('E-mail inválido'),
	profile_id: z.string().min(1, 'Selecione um perfil de acesso'),
	allowed_sites: z.array(z.string()).optional(),
});

type UserFormData = z.infer<typeof userFormSchema>;

interface UserFormProps {
	companyId: string;
	profiles: AccessProfile[];
	onSubmit: (data: UserFormData) => Promise<void>;
	onCancel: () => void;
	isLoading: boolean;
}

export function UserForm({
	companyId,
	profiles,
	onSubmit,
	onCancel,
	isLoading,
}: UserFormProps) {
	const { fetchConstructionSites } = useConstructionSites();
	const [obras, setObras] = useState<{ id: string; name: string }[]>([]);
	const [isLoadingObras, setIsLoadingObras] = useState(false);

	const {
		register,
		handleSubmit,
		control,
		watch,
		setValue,
		formState: { errors },
	} = useForm<UserFormData>({
		resolver: zodResolver(userFormSchema),
		defaultValues: {
			full_name: '',
			email: '',
			profile_id: '',
			allowed_sites: [],
		},
	});

	const selectedProfileId = watch('profile_id');
	const selectedProfile = profiles.find((p) => p.id === selectedProfileId);
	const showObrasSelector = selectedProfile?.scope === 'SPECIFIC_SITES';

	useEffect(() => {
		if (showObrasSelector) {
			const loadObras = async () => {
				setIsLoadingObras(true);
				try {
					const data = await fetchConstructionSites();
					setObras(data);
				} catch (err) {
					console.error('Erro ao buscar obras:', err);
				} finally {
					setIsLoadingObras(false);
				}
			};
			loadObras();
		} else {
			setValue('allowed_sites', []);
		}
	}, [showObrasSelector, fetchConstructionSites, setValue]);

	const toggleObra = (obraId: string) => {
		const current = watch('allowed_sites') || [];
		if (current.includes(obraId)) {
			setValue(
				'allowed_sites',
				current.filter((id) => id !== obraId)
			);
		} else {
			setValue('allowed_sites', [...current, obraId]);
		}
	};

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
			<div>
				<h3 className="text-lg font-medium text-gray-900">
					Novo Usuário
				</h3>
				<p className="text-sm text-gray-500">
					Cadastre um novo usuário para acessar o sistema.
				</p>
			</div>

			<div className="space-y-4">
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
					<label className="block text-sm font-medium text-gray-700 mb-1">
						Perfil de Acesso
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

				{showObrasSelector && (
					<div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
						<label className="block text-sm font-medium text-gray-700 mb-3">
							Vincular Obras
							<span className="text-xs text-gray-500 block font-normal">
								Selecione as obras que este usuário poderá acessar
							</span>
						</label>

						{isLoadingObras ? (
							<div className="flex items-center justify-center p-4">
								<Loader2 className="h-5 w-5 animate-spin text-gray-400" />
							</div>
						) : obras.length === 0 ? (
							<p className="text-sm text-gray-500 text-center py-4">
								Nenhuma obra cadastrada
							</p>
						) : (
							<div className="max-h-48 overflow-y-auto space-y-2 pr-2">
								{obras.map((obra) => {
									const isSelected = (
										watch('allowed_sites') || []
									).includes(obra.id);
									return (
										<div
											key={obra.id}
											onClick={() => toggleObra(obra.id)}
											className={`flex items-center p-3 rounded-md border cursor-pointer transition-colors ${
												isSelected
													? 'border-primary bg-primary/5'
													: 'border-gray-200 bg-white hover:bg-gray-50'
											}`}
										>
											<input
												type="checkbox"
												checked={isSelected}
												onChange={() => {}}
												className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
											/>
											<span className="ml-3 text-sm font-medium text-gray-900">
												{obra.name}
											</span>
										</div>
									);
								})}
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
