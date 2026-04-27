import React, { useState, useEffect } from 'react';
import { Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/config/supabase';
import { useCollaborators } from '@/features/colaboradores/hooks/useCollaborators';

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

export function GiveEPIForm({
	onCancel,
	onSaved,
	siteId,
	catalogId,
	inventoryId,
	epiName,
	availableQuantity,
}: GiveEPIFormProps) {
	const { fetchCollaborators } = useCollaborators();
	const [collaborators, setCollaborators] = useState<SimpleCollaborator[]>([]);
	const [loadingCollabs, setLoadingCollabs] = useState(true);

	useEffect(() => {
		const load = async () => {
			setLoadingCollabs(true);
			const data = await fetchCollaborators();
			setCollaborators(data as unknown as SimpleCollaborator[]);
			setLoadingCollabs(false);
		};
		load();
	}, []);

	const [selectedCollaborator, setSelectedCollaborator] = useState('');
	const [withdrawalDate, setWithdrawalDate] = useState(
		new Date().toISOString().slice(0, 16),
	);
	const [quantity, setQuantity] = useState(1);
	const [notes, setNotes] = useState('');
	const [isSaving, setIsSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const supabase = createClient();

	const handleSave = async () => {
		if (!selectedCollaborator || quantity <= 0) {
			setError('Preencha o colaborador e a quantidade corretamente.');
			return;
		}

		if (quantity > availableQuantity) {
			setError(`A quantidade máxima em estoque é ${availableQuantity}.`);
			return;
		}

		try {
			setIsSaving(true);
			setError(null);
			const { data: userData } = await supabase.auth.getUser();
			if (!userData.user) throw new Error('Usuário não autenticado.');

			// Create withdrawal
			const { error: insertError } = await supabase
				.from('epi_withdrawals')
				.insert({
					site_id: siteId,
					catalog_id: catalogId,
					collaborator_id: selectedCollaborator,
					withdrawn_by: userData.user.id,
					quantity: quantity,
					withdrawal_date: new Date(withdrawalDate).toISOString(),
					notes: notes || null,
				});

			if (insertError) throw insertError;

			// Create movement for traceability
			const { error: moveError } = await supabase
				.from('site_movements')
				.insert({
					site_id: siteId,
					inventory_id: inventoryId,
					created_by: userData.user.id,
					type: 'OUT',
					quantity_delta: -quantity,
					action_date: new Date(withdrawalDate).toISOString(),
					reason: 'APPLICATION',
				});

			if (moveError) throw moveError;

			// Update stock
			const { error: updateError } = await supabase
				.from('site_inventory')
				.update({ quantity: availableQuantity - quantity })
				.eq('id', inventoryId);

			if (updateError) throw updateError;

			onSaved();
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : 'Erro ao realizar a entrega de EPI';
			console.error('Error giving EPI:', err);
			setError(message);
		} finally {
			setIsSaving(false);
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

			<div className="p-5 flex flex-col gap-4">
				{error && (
					<div className="p-3 bg-red-50 text-red-700 text-sm rounded-[5px] border border-red-200 uppercase font-medium">
						{error}
					</div>
				)}

				<div>
					<label className="text-xs font-semibold text-gray-700 mb-1.5 block uppercase tracking-wider">
						Colaborador
					</label>
					<select
						required
						value={selectedCollaborator}
						onChange={(e) =>
							setSelectedCollaborator(e.target.value)
						}
						className="flex h-10 w-full rounded-[5px] border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#101828] disabled:cursor-not-allowed disabled:opacity-50"
					>
						<option value="">Selecione um colaborador</option>
						{collaborators.map((collab) => (
							<option key={collab.id} value={collab.id}>
								{collab.name} ({collab.role})
							</option>
						))}
					</select>
				</div>

				<div className="flex gap-4">
					<div className="flex-1">
						<label className="text-xs font-semibold text-gray-700 mb-1.5 block uppercase tracking-wider">
							Data da Entrega
						</label>
						<input
							type="datetime-local"
							value={withdrawalDate}
							onChange={(e) => setWithdrawalDate(e.target.value)}
							className="flex h-10 w-full rounded-[5px] border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#101828]"
						/>
					</div>
					<div className="w-1/3">
						<label className="text-xs font-semibold text-gray-700 mb-1.5 block uppercase tracking-wider">
							Qtd.
						</label>
						<input
							type="number"
							required
							min="1"
							max={availableQuantity}
							value={quantity}
							onChange={(e) =>
								setQuantity(Number(e.target.value))
							}
							className="flex h-10 w-full rounded-[5px] border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#101828]"
						/>
					</div>
				</div>

				<div>
					<label className="text-xs font-semibold text-gray-700 mb-1.5 block uppercase tracking-wider">
						Observação (opcional)
					</label>
					<textarea
						value={notes}
						onChange={(e) => setNotes(e.target.value)}
						placeholder="Alguma nota sobre esta entrega?"
						className="flex w-full rounded-[5px] border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#101828] min-h-[60px] resize-y"
					/>
				</div>
			</div>

			<div className="flex items-center justify-end gap-3 p-4 border-t border-gray-100 bg-gray-50/50 mt-auto">
				<Button
					variant="outline"
					onClick={onCancel}
					className="h-10 px-5 text-sm font-semibold rounded-[5px] border-gray-300 hover:bg-gray-100 uppercase text-gray-700"
				>
					Cancelar
				</Button>
				<Button
					onClick={handleSave}
					disabled={isSaving}
					className="h-10 px-5 text-sm font-semibold rounded-[5px] bg-[#101828] hover:bg-[#1b263b] text-white uppercase shadow-sm"
				>
					{isSaving ? (
						<Loader2 className="w-4 h-4 animate-spin" />
					) : (
						'Entregar'
					)}
				</Button>
			</div>
		</div>
	);
}
