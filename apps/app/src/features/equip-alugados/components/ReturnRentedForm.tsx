import { useState } from 'react';
import { X, Upload, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { returnRentedEquipmentAction } from '@/app/actions/rentedActions';
import { RentedEquipment } from '../hooks/useRentedEquipments';
import {
	returnRentedSchema,
	ReturnRentedFormData,
} from '../schemas/returnRentedSchema';

interface ReturnRentedFormProps {
	siteId: string;
	equipment: RentedEquipment;
	onCancel: () => void;
	onSaved: () => void;
}

export function ReturnRentedForm({
	siteId,
	equipment,
	onCancel,
	onSaved,
}: ReturnRentedFormProps) {
	const [submitError, setSubmitError] = useState<string | null>(null);

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<ReturnRentedFormData>({
		resolver: zodResolver(returnRentedSchema),
		defaultValues: {
			exitDate: '',
			observations: '',
		},
	});

	const onSubmit = async (data: ReturnRentedFormData) => {
		try {
			setSubmitError(null);
			const result = await returnRentedEquipmentAction({
				siteId,
				equipmentId: equipment.id,
				inventoryId: equipment.inventory_id,
				quantity: equipment.quantity,
				exitDate: data.exitDate,
				observations: data.observations ?? '',
				currentDescription: equipment.description,
			});

			if (!result.success) throw new Error(result.error);
			onSaved();
		} catch (err: unknown) {
			const message =
				err instanceof Error ? err.message : 'Erro ao registrar devolução';
			console.error(err);
			setSubmitError(message);
		}
	};

	return (
		<div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
			<div className="flex items-center justify-between p-6 border-b border-gray-100">
				<div>
					<h2 className="text-xl font-bold text-gray-900">
						Devolver Equipamento
					</h2>
					<p className="text-sm text-gray-500 mt-1">
						Registrar devolução de {equipment.name}
					</p>
				</div>
				<button
					type="button"
					onClick={onCancel}
					className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-colors"
				>
					<X className="w-5 h-5" />
				</button>
			</div>

			<div className="flex-1 overflow-y-auto p-6">
				{submitError && (
					<div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
						{submitError}
					</div>
				)}

				<form
					id="return-rented-form"
					onSubmit={handleSubmit(onSubmit)}
					className="space-y-6"
				>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Data/Hora de Devolução *
						</label>
						<input
							type="datetime-local"
							{...register('exitDate')}
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#101828]"
						/>
						{errors.exitDate && (
							<span className="text-destructive text-xs mt-1">
								{errors.exitDate.message}
							</span>
						)}
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Observações da Devolução
						</label>
						<textarea
							{...register('observations')}
							rows={3}
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#101828]"
							placeholder="Condição em que foi devolvido..."
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Anexo / Foto (Comprovante / Avaria)
						</label>
						<label className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center text-gray-500 hover:text-gray-700 hover:border-gray-400 hover:bg-gray-50 cursor-pointer transition-colors">
							<Upload className="w-6 h-6 mb-2 text-gray-400" />
							<span className="text-sm font-medium">
								Anexar imagens
							</span>
							<input
								type="file"
								className="hidden"
								accept="image/*"
								multiple
							/>
						</label>
					</div>
				</form>
			</div>

			<div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
				<button
					type="button"
					onClick={onCancel}
					disabled={isSubmitting}
					className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
				>
					Cancelar
				</button>
				<button
					type="submit"
					form="return-rented-form"
					disabled={isSubmitting}
					className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#101828] border border-transparent rounded-md hover:bg-[#1b263b] disabled:opacity-50 min-w-[120px] transition-colors shadow-sm"
				>
					{isSubmitting ? (
						<>
							<Loader2 className="w-4 h-4 animate-spin" />
							Salvando...
						</>
					) : (
						'Confirmar Devolução'
					)}
				</button>
			</div>
		</div>
	);
}
