import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/config/supabase';

interface ReturnToolFormProps {
	onCancel: () => void;
	onSaved: () => void;
	loanId: string;
	toolName: string;
	collaboratorName: string;
	loanQuantity: number;
}

export function ReturnToolForm({
	onCancel,
	onSaved,
	loanId,
	toolName,
	collaboratorName,
	loanQuantity,
}: ReturnToolFormProps) {
	const [returnDate, setReturnDate] = useState(
		new Date().toISOString().slice(0, 16),
	);
	const [observation, setObservation] = useState('');

	const [isSaving, setIsSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const supabase = createClient();

	const handleSave = async () => {
		try {
			setIsSaving(true);
			setError(null);

			const { error: updateError } = await supabase
				.from('tool_loans')
				.update({
					returned_date: new Date(returnDate).toISOString(),
					notes_on_return: observation || null,
					status: 'RETURNED',
				})
				.eq('id', loanId);

			if (updateError) throw updateError;

			onSaved();
		} catch (err: any) {
			console.error('Error returning tool:', err);
			setError(err.message);
		} finally {
			setIsSaving(false);
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
						Emprestado para: {collaboratorName} (Qtd: {loanQuantity}
						)
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
						Data e Hora de Devolução *
					</label>
					<input
						type="datetime-local"
						value={returnDate}
						onChange={(e) => setReturnDate(e.target.value)}
						className="w-full bg-white border border-gray-300 rounded-[5px] py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#101828]/20 focus:border-[#101828] shadow-sm transition-all"
					/>
				</div>

				<div className="flex flex-col gap-2">
					<label className="text-sm font-semibold text-gray-700">
						Observações de Devolução (Opcional)
					</label>
					<textarea
						value={observation}
						onChange={(e) => setObservation(e.target.value)}
						placeholder="A ferramenta retornou com algum defeito?"
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
					disabled={isSaving}
					className="bg-[#101828] hover:bg-[#1b263b] text-white font-semibold px-8"
				>
					{isSaving ? 'Salvando...' : 'Devolver'}
				</Button>
			</div>
		</div>
	);
}
