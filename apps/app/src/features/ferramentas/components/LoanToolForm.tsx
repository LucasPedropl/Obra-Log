import React, { useState, useEffect } from 'react';
import { Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/config/supabase';
import { useCollaborators } from '@/features/colaboradores/hooks/useCollaborators';

interface LoanToolFormProps {
	onCancel: () => void;
	onSaved: () => void;
	siteId: string;
	inventoryId: string;
	toolName: string;
	availableQuantity: number;
}

export function LoanToolForm({
	onCancel,
	onSaved,
	siteId,
	inventoryId,
	toolName,
	availableQuantity,
}: LoanToolFormProps) {
	const { fetchCollaborators } = useCollaborators();
	const [collaborators, setCollaborators] = useState<any[]>([]);
	const [loadingCollabs, setLoadingCollabs] = useState(true);

	useEffect(() => {
		const load = async () => {
			setLoadingCollabs(true);
			const data = await fetchCollaborators();
			setCollaborators(data);
			setLoadingCollabs(false);
		};
		load();
	}, []);

	const [selectedCollaborator, setSelectedCollaborator] = useState('');
	const [loanDate, setLoanDate] = useState(
		new Date().toISOString().slice(0, 16),
	);
	const [quantity, setQuantity] = useState(1);
	const [observation, setObservation] = useState('');

	const [isSaving, setIsSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const supabase = createClient();

	const handleSave = async () => {
		if (!selectedCollaborator || quantity <= 0) {
			setError('Preencha todos os campos obrigatórios corretamente.');
			return;
		}

		if (quantity > availableQuantity) {
			setError(`Quantidade máxima disponível é ${availableQuantity}.`);
			return;
		}

		try {
			setIsSaving(true);
			setError(null);

			const { error: insertError } = await supabase
				.from('tool_loans')
				.insert({
					site_id: siteId,
					inventory_id: inventoryId,
					collaborator_id: selectedCollaborator,
					quantity: quantity,
					loan_date: new Date(loanDate).toISOString(),
					notes_on_loan: observation || null,
					status: 'OPEN',
				});

			if (insertError) throw insertError;

			onSaved();
		} catch (err: any) {
			console.error('Error creating loan:', err);
			setError(err.message);
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
					onClick={onCancel}
					className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-[5px] transition-colors p-1.5"
				>
					<X size={20} />
				</button>
			</div>

			<div className="p-6 flex flex-col gap-5 bg-gray-50/50">
				{error && (
					<div className="p-3 bg-red-50 border border-red-200 rounded-[5px] text-red-700 text-sm">
						{error}
					</div>
				)}

				<div className="flex flex-col gap-2">
					<label className="text-sm font-semibold text-gray-700">
						Colaborador *
					</label>
					<select
						value={selectedCollaborator}
						onChange={(e) =>
							setSelectedCollaborator(e.target.value)
						}
						className="w-full bg-white border border-gray-300 rounded-[5px] py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#101828]/20 focus:border-[#101828] shadow-sm transition-all"
					>
						<option value="">Selecione um colaborador...</option>
						{collaborators.map((collab: any) => (
							<option key={collab.id} value={collab.id}>
								{collab.name}
							</option>
						))}
					</select>
				</div>

				<div className="flex flex-col gap-2">
					<label className="text-sm font-semibold text-gray-700">
						Data e Hora *
					</label>
					<input
						type="datetime-local"
						value={loanDate}
						onChange={(e) => setLoanDate(e.target.value)}
						className="w-full bg-white border border-gray-300 rounded-[5px] py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#101828]/20 focus:border-[#101828] shadow-sm transition-all"
					/>
				</div>

				<div className="flex flex-col gap-2">
					<label className="text-sm font-semibold text-gray-700">
						Quantidade *
					</label>
					<input
						type="number"
						min="1"
						max={availableQuantity}
						value={quantity}
						onChange={(e) => setQuantity(Number(e.target.value))}
						className="w-24 bg-white border border-gray-300 rounded-[5px] py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#101828]/20 focus:border-[#101828] shadow-sm transition-all"
					/>
				</div>

				<div className="flex flex-col gap-2">
					<label className="text-sm font-semibold text-gray-700">
						Observações (Opcional)
					</label>
					<textarea
						value={observation}
						onChange={(e) => setObservation(e.target.value)}
						placeholder="Detalhes sobre o estado da ferramenta, etc..."
						className="w-full bg-white border border-gray-300 rounded-[5px] py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#101828]/20 focus:border-[#101828] shadow-sm transition-all min-h-[80px]"
					/>
				</div>
			</div>

			<div className="p-5 border-t border-gray-200 flex items-center justify-end gap-3 bg-white rounded-b-xl">
				<Button
					variant="ghost"
					onClick={onCancel}
					className="text-gray-600 hover:bg-gray-100 font-semibold px-6"
				>
					Cancelar
				</Button>
				<Button
					onClick={handleSave}
					disabled={isSaving || !selectedCollaborator || quantity < 1}
					className="bg-[#101828] hover:bg-[#1b263b] text-white font-semibold px-8"
				>
					{isSaving ? 'Salvando...' : 'Emprestar'}
				</Button>
			</div>
		</div>
	);
}
