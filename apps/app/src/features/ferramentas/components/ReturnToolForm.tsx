import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { returnToolLoanAction } from '@/app/actions/toolsActions';
import {
	returnToolSchema,
	ReturnToolFormData,
} from '../schemas/returnToolSchema';

interface ReturnToolFormProps {
	onCancel: () => void;
	onSaved: () => void;
	siteId: string;
	loanId: string;
	toolName: string;
	collaboratorName: string;
	loanQuantity: number;
}

const defaultReturnDate = () => new Date().toISOString().slice(0, 16);

export function ReturnToolForm({
	onCancel,
	onSaved,
	siteId,
	loanId,
	toolName,
	collaboratorName,
	loanQuantity,
}: ReturnToolFormProps) {
	const [submitError, setSubmitError] = useState<string | null>(null);

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<ReturnToolFormData>({
		resolver: zodResolver(returnToolSchema),
		defaultValues: {
			returnDate: defaultReturnDate(),
			observation: '',
		},
	});

	const onSubmit = async (data: ReturnToolFormData) => {
		try {
			setSubmitError(null);
			const result = await returnToolLoanAction({
				loanId,
				siteId,
				returnDate: data.returnDate,
				observation: data.observation || null,
			});

			if (!result.success) throw new Error(result.error);
			onSaved();
		} catch (err: unknown) {
			const message =
				err instanceof Error ? err.message : 'Erro ao realizar a devolução';
			console.error('Error returning tool:', err);
			setSubmitError(message);
		}
	};

	return (
		<div className="bg-white text-gray-900 rounded-xl shadow-2xl border border-gray-200 w-[500px] max-w-[95vw] flex flex-col">
			<div className="p-6 border-b border-gray-200 flex justify-between items-start">
				<div>
					<h2 className="text-xl font-bold text-gray-900 tracking-tight">
						Devolver Ferramenta
					</h2>
					<p className="text-sm font-semibold text-blue-600 mt-1">
						{toolName}
					</p>
					<p className="text-xs text-gray-500 mt-0.5">
						Emprestado para: {collaboratorName} (Qtd: {loanQuantity})
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
						Data e Hora de Devolução *
					</label>
					<input
						type="datetime-local"
						{...register('returnDate')}
						className="w-full bg-white border border-gray-300 rounded-[5px] py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#101828]/20 focus:border-[#101828] shadow-sm transition-all"
					/>
					{errors.returnDate && (
						<span className="text-destructive text-xs">
							{errors.returnDate.message}
						</span>
					)}
				</div>

				<div className="flex flex-col gap-2">
					<label className="text-sm font-semibold text-gray-700">
						Observações de Devolução (Opcional)
					</label>
					<textarea
						{...register('observation')}
						placeholder="A ferramenta retornou com algum defeito?"
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
						{isSubmitting ? 'Salvando...' : 'Devolver'}
					</Button>
				</div>
			</form>
		</div>
	);
}
