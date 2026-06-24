import { SearchableInput } from '@/components/ui/searchable-input';

interface CategoryItem {
	id: string;
	primary_category: string;
	secondary_category: string;
}

interface AddRentedCategoryModalProps {
	categories: CategoryItem[];
	newCategoryData: { primary: string; secondary: string };
	isCreating: boolean;
	onClose: () => void;
	onChange: (data: { primary: string; secondary: string }) => void;
	onSubmit: (e: React.FormEvent) => void;
}

export function AddRentedCategoryModal({
	categories,
	newCategoryData,
	isCreating,
	onClose,
	onChange,
	onSubmit,
}: AddRentedCategoryModalProps) {
	return (
		<div className="fixed inset-0 z-[999] flex items-center justify-center p-4 h-[100dvh] w-screen">
			<div
				className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300"
				onClick={onClose}
			/>
			<div className="relative bg-white text-gray-900 rounded-xl shadow-2xl border border-gray-200 w-[500px] max-w-[95vw] p-6 animate-in fade-in zoom-in-95 duration-200">
				<h3 className="text-xl font-bold mb-4">Nova Categoria</h3>
				<form onSubmit={onSubmit} className="space-y-4">
					<div>
						<label className="block text-sm font-medium mb-1">
							Categoria Primária
						</label>
						<input
							type="text"
							required
							value={newCategoryData.primary}
							onChange={(e) =>
								onChange({
									...newCategoryData,
									primary: e.target.value,
								})
							}
							className="w-full flex h-10 rounded-[5px] border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#101828]/20 focus:border-[#101828]"
							placeholder="Ex: Escoras"
						/>
					</div>
					<div>
						<label className="block text-sm font-medium mb-1">
							Categoria Secundária (Opcional)
						</label>
						<SearchableInput
							options={Array.from(
								new Set(
									categories
										.map((c) => c.secondary_category)
										.filter(Boolean) as string[],
								),
							).sort()}
							value={newCategoryData.secondary}
							onChange={(val) =>
								onChange({
									...newCategoryData,
									secondary: val,
								})
							}
							placeholder="Ex: Metálicas"
						/>
					</div>
					<div className="flex justify-end gap-3 pt-4">
						<button
							type="button"
							onClick={onClose}
							className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-[5px]"
						>
							Cancelar
						</button>
						<button
							type="submit"
							disabled={isCreating}
							className="px-4 py-2 text-sm font-semibold text-white bg-[#101828] hover:bg-[#1b263b] rounded-[5px] shadow-sm disabled:opacity-50"
						>
							Salvar Categoria
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
