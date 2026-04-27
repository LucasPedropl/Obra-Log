import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
	useConstructionSites,
	constructionSiteSchema,
	ConstructionSiteFormData,
} from '../hooks/useConstructionSites';
import { useToast } from '@/components/ui/toaster';

interface ConstructionSiteFormProps {
	onCancel?: () => void;
}

export function ConstructionSiteForm({ onCancel }: ConstructionSiteFormProps) {
	const { addToast } = useToast();
	const { createConstructionSite, isLoading, error } = useConstructionSites();
	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<ConstructionSiteFormData>({
		resolver: zodResolver(constructionSiteSchema),
	});

	const onSubmit = async (data: ConstructionSiteFormData) => {
		const success = await createConstructionSite(data);
		if (success) {
			addToast('Obra cadastrada com sucesso!', 'success');
			if (onCancel) onCancel();
		} else {
			addToast('Erro ao cadastrar a obra', 'error');
		}
	};

	return (
		<div className="p-6 bg-card rounded-xl border border-border shadow-xl">
			<h2 className="text-2xl font-bold mb-6">Cadastrar Obra</h2>
			{error && (
				<div className="mb-4 text-destructive text-sm font-medium">
					{error}
				</div>
			)}

			<form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
				<div>
					<label className="block text-sm font-medium mb-1">
						Nome da Obra
					</label>
					<input
						type="text"
						{...register('name')}
						className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-foreground"
						placeholder="Ex: Condomínio Vista Bela"
					/>
					{errors.name && (
						<span className="text-destructive text-xs mt-1">
							{errors.name.message}
						</span>
					)}
				</div>

				<div className="flex gap-3 pt-4">
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
						{isLoading ? 'Salvando...' : 'Salvar Obra'}
					</button>
				</div>
			</form>
		</div>
	);
}
