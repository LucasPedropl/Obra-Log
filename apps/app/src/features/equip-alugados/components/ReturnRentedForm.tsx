import { useState, useEffect } from 'react';
import { createClient } from '@/config/supabase';

import { X, Upload, Loader2 } from 'lucide-react';
import { RentedEquipment } from '../hooks/useRentedEquipments';

interface SimpleUser {
	id: string;
	email?: string;
}

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
	const supabase = createClient();
	const [user, setUser] = useState<SimpleUser | null>(null);
	useEffect(() => {
		supabase.auth.getUser().then(({ data }) => {
			if (data?.user) setUser(data.user as unknown as SimpleUser);
		});
	}, [supabase]);
	const [exitDate, setExitDate] = useState('');
	const [observations, setObservations] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!exitDate || !user) {
			setError('Preencha a data e hora da devolução.');
			return;
		}

		setIsSubmitting(true);
		setError(null);

		try {
			// 1. Update Rented Equipments table
			const { error: rentError } = await supabase
				.from('rented_equipments')
				.update({
					status: 'RETURNED',
					exit_date: new Date(exitDate).toISOString(),
					description: observations
						? `${equipment.description || ''}\n[Devolução]: ${observations}`
						: equipment.description,
				})
				.eq('id', equipment.id);

			if (rentError) throw rentError;

			// 2. Adjust site_inventory (remove quantity)
			if (equipment.inventory_id && equipment.quantity > 0) {
				const { data: invData } = await supabase
					.from('site_inventory')
					.select('quantity')
					.eq('id', equipment.inventory_id)
					.single();

				if (invData) {
					// Make sure we just zero out the quantity that we added, or simple decrement
					const newQuantity = Math.max(
						0,
						invData.quantity - equipment.quantity,
					);
					await supabase
						.from('site_inventory')
						.update({ quantity: newQuantity })
						.eq('id', equipment.inventory_id);

					// 3. Register OUT movement
					await supabase.from('site_movements').insert({
						site_id: siteId,
						inventory_id: equipment.inventory_id,
						created_by: user.id,
						type: 'OUT',
						quantity_delta: equipment.quantity,
						reason: 'TRANSFER',
					});
				}
			}

			onSaved();
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : 'Erro ao registrar devolução';
			console.error(err);
			setError(message);
		} finally {
			setIsSubmitting(false);
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
					onClick={onCancel}
					className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-colors"
				>
					<X className="w-5 h-5" />
				</button>
			</div>

			<div className="flex-1 overflow-y-auto p-6">
				{error && (
					<div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
						{error}
					</div>
				)}

				<form
					id="return-rented-form"
					onSubmit={handleSubmit}
					className="space-y-6"
				>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Data/Hora de Devolução *
						</label>
						<input
							type="datetime-local"
							value={exitDate}
							onChange={(e) => setExitDate(e.target.value)}
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#101828]"
							required
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Observações da Devolução
						</label>
						<textarea
							value={observations}
							onChange={(e) => setObservations(e.target.value)}
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
