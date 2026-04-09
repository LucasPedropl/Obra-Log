import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
	useCollaborators,
	collaboratorSchema,
	CollaboratorFormData,
} from '../hooks/useCollaborators';
import { useToast } from '@/components/ui/toaster';

interface CollaboratorFormProps {
	onCancel?: () => void;
}

export function CollaboratorForm({ onCancel }: CollaboratorFormProps) {
	const { addToast } = useToast();
	const { createCollaborator, isLoading, error } = useCollaborators();
	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<CollaboratorFormData>({
		resolver: zodResolver(collaboratorSchema),
	});

	const onSubmit = async (data: CollaboratorFormData) => {
		const success = await createCollaborator(data);
		if (success) {
			addToast('Colaborador cadastrado com sucesso!', 'success');
			if (onCancel) onCancel();
		} else {
			addToast('Erro ao cadastrar o ocolaborador.', 'error');
		}
	};

	return (
		<div className="p-6 bg-card rounded-xl border border-border shadow-xl">
			<h2 className="text-2xl font-bold mb-6">Cadastrar Colaborador</h2>
			{error && (
				<div className="mb-4 text-destructive text-sm font-medium">
					{error}
				</div>
			)}

			<form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label className="block text-sm font-medium mb-1">
							Nome Completo *
						</label>
						<input
							type="text"
							{...register('name')}
							className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
							placeholder="Ex: João da Silva"
						/>
						{errors.name && (
							<span className="text-destructive text-xs mt-1">
								{errors.name.message}
							</span>
						)}
					</div>

					<div>
						<label className="block text-sm font-medium mb-1">
							Cargo / Função *
						</label>
						<input
							type="text"
							{...register('role_title')}
							className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
							placeholder="Ex: Pedreiro"
						/>
						{errors.role_title && (
							<span className="text-destructive text-xs mt-1">
								{errors.role_title.message}
							</span>
						)}
					</div>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label className="block text-sm font-medium mb-1">
							CPF
						</label>
						<input
							type="text"
							{...register('cpf')}
							className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
							placeholder="000.000.000-00"
						/>
					</div>

					<div>
						<label className="block text-sm font-medium mb-1">
							RG / Documento
						</label>
						<input
							type="text"
							{...register('rg')}
							className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
							placeholder="Registro"
						/>
					</div>

					<div className="md:col-span-2">
						<label className="block text-sm font-medium mb-1">
							Data de Nascimento
						</label>
						<input
							type="date"
							{...register('birth_date')}
							className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
						/>
					</div>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label className="block text-sm font-medium mb-1">
							Celular
						</label>
						<input
							type="tel"
							{...register('cellphone')}
							className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
							placeholder="(00) 00000-0000"
						/>
					</div>

					<div>
						<label className="block text-sm font-medium mb-1">
							Email
						</label>
						<input
							type="email"
							{...register('email')}
							className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
							placeholder="email@exemplo.com"
						/>
						{errors.email && (
							<span className="text-destructive text-xs mt-1">
								{errors.email.message}
							</span>
						)}
					</div>
				</div>

				{/* Endereço Simplificado */}
				<h3 className="text-lg font-semibold mt-6 mb-2">Endereço</h3>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					<div>
						<label className="block text-sm font-medium mb-1">
							CEP
						</label>
						<input
							type="text"
							{...register('cep')}
							className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
							placeholder="00000-000"
						/>
					</div>
					<div className="md:col-span-2">
						<label className="block text-sm font-medium mb-1">
							Rua / Logradouro
						</label>
						<input
							type="text"
							{...register('street')}
							className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
						/>
					</div>

					<div>
						<label className="block text-sm font-medium mb-1">
							Número
						</label>
						<input
							type="text"
							{...register('number')}
							className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
						/>
					</div>
					<div className="md:col-span-2">
						<label className="block text-sm font-medium mb-1">
							Bairro
						</label>
						<input
							type="text"
							{...register('neighborhood')}
							className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
						/>
					</div>
				</div>

				<div className="flex gap-3 pt-6">
					{onCancel && (
						<button
							type="button"
							onClick={onCancel}
							disabled={isLoading}
							className="w-full bg-transparent border border-input hover:bg-accent text-foreground h-10 px-4 py-2 flex items-center justify-center rounded-md font-medium transition-colors disabled:opacity-50"
						>
							Cancelar
						</button>
					)}
					<button
						type="submit"
						disabled={isLoading}
						className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 flex items-center justify-center rounded-md font-medium transition-colors disabled:opacity-50"
					>
						{isLoading ? 'Cadastrando...' : 'Cadastrar Colaborador'}
					</button>
				</div>
			</form>
		</div>
	);
}
