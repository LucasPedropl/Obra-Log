import React, { useState, useEffect } from 'react';
import { Loader2, X } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { giveEPIAction } from '@/app/actions/episActions';
import { useCollaborators } from '@/features/mao-de-obra/hooks/useCollaborators';
import { useToast } from '@/components/ui/toaster';
import {
	createGiveEPISchema,
	GiveEPIFormData,
} from '../schemas/giveEPISchema';

interface GiveEPIFormProps {
	onCancel: () => void;
	onSaved: () => void;
	siteId: string;
	catalogId: string;
	inventoryId: string;
	epiName: string;
	availableQuantity: number;
}

interface SimpleCollaborator {
	id: string;
	name: string;
	role?: string;
}

const defaultWithdrawalDate = () => new Date().toISOString().slice(0, 16);

export function GiveEPIForm({
	onCancel,
	onSaved,
	siteId,
	catalogId,
	inventoryId,
	epiName,
	availableQuantity,
}: GiveEPIFormProps) {
	const { addToast } = useToast();
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
	} = useForm<GiveEPIFormData>({
		resolver: zodResolver(createGiveEPISchema(availableQuantity)),
		defaultValues: {
			collaboratorId: '',
			withdrawalDate: defaultWithdrawalDate(),
			quantity: 1,
			notes: '',
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

	const onSubmit = async (data: GiveEPIFormData) => {
		try {
			setSubmitError(null);
			const result = await giveEPIAction({
				siteId,
				catalogId,
				inventoryId,
				collaboratorId: data.collaboratorId,
				quantity: data.quantity,
				withdrawalDate: data.withdrawalDate,
				notes: data.notes || null,
				availableQuantity,
			});

			if (!result.success) throw new Error(result.error);

			addToast('EPI entregue com sucesso!', 'success');
			onSaved();
		} catch (err: unknown) {
			const message =
				err instanceof Error
					? err.message
					: 'Erro ao realizar a entrega de EPI';
			console.error('Error giving EPI:', err);
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
		<div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-[500px] max-w-[95vw] overflow-hidden flex flex-col">
			<div className="flex items-center justify-between p-4 border-b border-gray-100/60 bg-gray-50/50">
				<div>
					<h2 className="text-base font-semibold text-gray-900">
						Entregar EPI
					</h2>
					<p className="text-xs text-gray-500 mt-0.5">
						EPI a entregar:{' '}
						<span className="font-medium text-gray-700">
							{epiName}
						</span>{' '}
						({availableQuantity} em estoque)
					</p>
				</div>
				<Button
					variant="ghost"
					size="icon"
					className="h-8 w-8 text-gray-500 hover:text-gray-900 hover:bg-gray-200/50 rounded-full"
					onClick={onCancel}
				>
					<X className="h-4 w-4" />
				</Button>
			</div>

			<form onSubmit={handleSubmit(onSubmit)} className="p-5 flex flex-col gap-4">
				{submitError && (
					<div className="p-3 bg-red-50 text-red-700 text-sm rounded-[5px] border border-red-200 uppercase font-medium">
						{submitError}
					</div>
				)}

				<div>
					<label className="text-xs font-semibold text-gray-700 mb-1.5 block uppercase tracking-wider">
						Colaborador
					</label>
					<Controller
						name="collaboratorId"
						control={control}
						render={({ field }) => (
							<SearchableSelect
								options={collaborators.map((collab) => ({
									value: collab.id,
									label: collab.name,
									subLabel: collab.role,
								}))}
								value={field.value}
								onChange={field.onChange}
								placeholder="Selecione um colaborador"
								className="rounded-[5px] h-10 border border-gray-300 bg-white"
							/>
						)}
					/>
					{errors.collaboratorId && (
						<span className="text-destructive text-xs mt-1">
							{errors.collaboratorId.message}
						</span>
					)}
				</div>

				<div className="flex gap-4">
					<div className="flex-1">
						<label className="text-xs font-semibold text-gray-700 mb-1.5 block uppercase tracking-wider">
							Data da Entrega
						</label>
						<input
							type="datetime-local"
							{...register('withdrawalDate')}
							className="flex h-10 w-full rounded-[5px] border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#101828]"
						/>
						{errors.withdrawalDate && (
							<span className="text-destructive text-xs mt-1">
								{errors.withdrawalDate.message}
							</span>
						)}
					</div>
					<div className="w-1/3">
						<label className="text-xs font-semibold text-gray-700 mb-1.5 block uppercase tracking-wider">
							Qtd.
						</label>
						<input
							type="number"
							min={1}
							max={availableQuantity}
							{...register('quantity', { valueAsNumber: true })}
							className="flex h-10 w-full rounded-[5px] border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#101828]"
						/>
						{errors.quantity && (
							<span className="text-destructive text-xs mt-1">
								{errors.quantity.message}
							</span>
						)}
					</div>
				</div>

				<div>
					<label className="text-xs font-semibold text-gray-700 mb-1.5 block uppercase tracking-wider">
						Observação (opcional)
					</label>
					<textarea
						{...register('notes')}
						placeholder="Alguma nota sobre esta entrega?"
						className="flex w-full rounded-[5px] border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#101828] min-h-[60px] resize-y"
					/>
				</div>

				<div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
					<Button
						type="button"
						variant="outline"
						onClick={onCancel}
						className="h-10 px-5 text-sm font-semibold rounded-[5px] border-gray-300 hover:bg-gray-100 uppercase text-gray-700"
					>
						Cancelar
					</Button>
					<Button
						type="submit"
						disabled={isSubmitting}
						className="h-10 px-5 text-sm font-semibold rounded-[5px] bg-[#101828] hover:bg-[#1b263b] text-white uppercase shadow-sm"
					>
						{isSubmitting ? (
							<Loader2 className="w-4 h-4 animate-spin" />
						) : (
							'Entregar'
						)}
					</Button>
				</div>
			</form>
		</div>
	);
}
