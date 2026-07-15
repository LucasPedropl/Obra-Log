import React, { useState, useEffect } from 'react';
import { Loader2, X } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { createToolLoanAction } from '@/app/actions/toolsActions';
import { useCollaborators } from '@/features/mao-de-obra/hooks/useCollaborators';
import {
	createLoanToolSchema,
	LoanToolFormData,
} from '../schemas/loanToolSchema';

interface LoanToolFormProps {
	onCancel: () => void;
	onSaved: () => void;
	siteId: string;
	inventoryId: string;
	toolName: string;
	availableQuantity: number;
}

interface SimpleCollaborator {
	id: string;
	name: string;
}

const defaultLoanDate = () => new Date().toISOString().slice(0, 16);

export function LoanToolForm({
	onCancel,
	onSaved,
	siteId,
	inventoryId,
	toolName,
	availableQuantity,
}: LoanToolFormProps) {
	const { fetchCollaborators } = useCollaborators();
	const [collaborators, setCollaborators] = useState<SimpleCollaborator[]>(
		[],
	);
	const [loadingCollabs, setLoadingCollabs] = useState(true);
	const [submitError, setSubmitError] = useState<string | null>(null);

	const {
		register,
		handleSubmit,
		control,
		formState: { errors, isSubmitting },
	} = useForm<LoanToolFormData>({
		resolver: zodResolver(createLoanToolSchema(availableQuantity)),
		defaultValues: {
			collaboratorId: '',
			loanDate: defaultLoanDate(),
			quantity: 1,
			observation: '',
		},
	});

	useEffect(() => {
		const load = async () => {
			setLoadingCollabs(true);
			const data = await fetchCollaborators();
			setCollaborators(data as unknown as SimpleCollaborator[]);
			setLoadingCollabs(false);
		};
		load();
	}, [fetchCollaborators]);

	const onSubmit = async (data: LoanToolFormData) => {
		try {
			setSubmitError(null);
			const result = await createToolLoanAction({
				siteId,
				inventoryId,
				collaboratorId: data.collaboratorId,
				quantity: data.quantity,
				loanDate: data.loanDate,
				observation: data.observation || null,
				availableQuantity,
			});

			if (!result.success) throw new Error(result.error);
			onSaved();
		} catch (err: unknown) {
			const message =
				err instanceof Error ? err.message : 'Erro ao realizar o empréstimo';
			console.error('Error creating loan:', err);
			setSubmitError(message);
		}
	};

	if (loadingCollabs) {
		return (
			<div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-[500px] h-[300px] max-w-[95vw] flex items-center justify-center">
				<Loader2 className="w-8 h-8 animate-spin text-[#101828]" />
			</div>
		);
	}

	return (
		<div className="bg-white text-gray-900 rounded-xl shadow-2xl border border-gray-200 w-[500px] max-w-[95vw] flex flex-col">
			<div className="p-6 border-b border-gray-200 flex justify-between items-start">
				<div>
					<h2 className="text-xl font-bold text-gray-900 tracking-tight">
						Emprestar Ferramenta
					</h2>
					<p className="text-sm font-semibold text-blue-600 mt-1">
						{toolName}
					</p>
					<p className="text-xs text-gray-500 mt-0.5">
						Disponível: {availableQuantity}
					</p>
				</div>
				<button
					type="button"
					onClick={onCancel}
					className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-[5px] transition-colors p-1.5"
				>
					<X size={20} />
				</button>
			</div>

			<form
				onSubmit={handleSubmit(onSubmit)}
				className="p-6 flex flex-col gap-5 bg-gray-50/50"
			>
				{submitError && (
					<div className="p-3 bg-red-50 border border-red-200 rounded-[5px] text-red-700 text-sm">
						{submitError}
					</div>
				)}

				<div className="flex flex-col gap-2">
					<label className="text-sm font-semibold text-gray-700">
						Colaborador *
					</label>
					<Controller
						name="collaboratorId"
						control={control}
						render={({ field }) => (
							<SearchableSelect
								options={collaborators.map((collab) => ({
									value: collab.id,
									label: collab.name,
								}))}
								value={field.value}
								onChange={field.onChange}
								placeholder="Selecione um colaborador..."
								className="rounded-[5px] h-10 border border-gray-300 bg-white shadow-sm"
							/>
						)}
					/>
					{errors.collaboratorId && (
						<span className="text-destructive text-xs">
							{errors.collaboratorId.message}
						</span>
					)}
				</div>

				<div className="flex flex-col gap-2">
					<label className="text-sm font-semibold text-gray-700">
						Data e Hora *
					</label>
					<input
						type="datetime-local"
						{...register('loanDate')}
						className="w-full bg-white border border-gray-300 rounded-[5px] py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#101828]/20 focus:border-[#101828] shadow-sm transition-all"
					/>
					{errors.loanDate && (
						<span className="text-destructive text-xs">
							{errors.loanDate.message}
						</span>
					)}
				</div>

				<div className="flex flex-col gap-2">
					<label className="text-sm font-semibold text-gray-700">
						Quantidade *
					</label>
					<input
						type="number"
						min={1}
						max={availableQuantity}
						{...register('quantity', { valueAsNumber: true })}
						className="w-24 bg-white border border-gray-300 rounded-[5px] py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#101828]/20 focus:border-[#101828] shadow-sm transition-all"
					/>
					{errors.quantity && (
						<span className="text-destructive text-xs">
							{errors.quantity.message}
						</span>
					)}
				</div>

				<div className="flex flex-col gap-2">
					<label className="text-sm font-semibold text-gray-700">
						Observações (Opcional)
					</label>
					<textarea
						{...register('observation')}
						placeholder="Detalhes sobre o estado da ferramenta, etc..."
						className="w-full bg-white border border-gray-300 rounded-[5px] py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#101828]/20 focus:border-[#101828] shadow-sm transition-all min-h-[80px]"
					/>
				</div>

				<div className="p-5 border-t border-gray-200 flex items-center justify-end gap-3 bg-white rounded-b-xl -mx-6 -mb-6 mt-2">
					<Button
						type="button"
						variant="ghost"
						onClick={onCancel}
						className="text-gray-600 hover:bg-gray-100 font-semibold px-6"
					>
						Cancelar
					</Button>
					<Button
						type="submit"
						disabled={isSubmitting}
						className="bg-[#101828] hover:bg-[#1b263b] text-white font-semibold px-8"
					>
						{isSubmitting ? 'Salvando...' : 'Emprestar'}
					</Button>
				</div>
			</form>
		</div>
	);
}
