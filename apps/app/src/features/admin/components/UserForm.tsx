import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

const userFormSchema = z.object({
	full_name: z.string().min(3, 'O nome deve ter no mínimo 3 caracteres'),
	email: z.string().email('E-mail inválido'),
	profile_id: z.string().min(1, 'Selecione um perfil de acesso'),
	is_company_admin: z.boolean().default(false),
});

type UserFormData = z.infer<typeof userFormSchema>;

interface UserFormProps {
	companyId: string;
	profiles: any[];
	onSubmit: (data: UserFormData) => Promise<void>;
	onCancel: () => void;
	isLoading: boolean;
}

export function UserForm({
	profiles,
	onSubmit,
	onCancel,
	isLoading,
}: UserFormProps) {
	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<UserFormData>({
		resolver: zodResolver(userFormSchema),
		defaultValues: {
			full_name: '',
			email: '',
			profile_id: '',
			is_company_admin: false,
		},
	});

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
			<div>
				<h3 className="text-lg font-medium text-gray-900">
					Novo Usuário
				</h3>
				<p className="text-sm text-gray-500">
					Cadastre um novo usuário para acessar o sistema na empresa.
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

				<div className="flex items-center gap-2 py-2">
					<input
						type="checkbox"
						id="is_company_admin"
						{...register('is_company_admin')}
						className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
					/>
					<label htmlFor="is_company_admin" className="text-sm font-medium text-gray-700 cursor-pointer">
						Este usuário é um Administrador da Empresa (Acesso Total)
					</label>
				</div>

				<div>
					<label className="block text-sm font-medium text-gray-700 mb-1">
						Perfil de Acesso (Cargo)
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
