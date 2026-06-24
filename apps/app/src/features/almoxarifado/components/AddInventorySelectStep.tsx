import { Check, Grip, Loader2, PackageOpen } from 'lucide-react';
import { SupplyItemOption } from './addInventoryTypes';

interface AddInventorySelectStepProps {
	searchTerm: string;
	onSearchChange: (value: string) => void;
	isFetching: boolean;
	filteredItems: SupplyItemOption[];
	selectedIds: string[];
	onToggle: (id: string) => void;
}

export function AddInventorySelectStep({
	searchTerm,
	onSearchChange,
	isFetching,
	filteredItems,
	selectedIds,
	onToggle,
}: AddInventorySelectStepProps) {
	return (
		<div className="flex flex-col h-full">
			<div className="flex flex-col gap-2 mb-5 shrink-0">
				<input
					type="text"
					value={searchTerm}
					onChange={(e) => onSearchChange(e.target.value)}
					placeholder="Pesquise por nome, código ou categoria do insumo..."
					className="w-full bg-white border border-gray-300 rounded-[5px] py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#101828]/20 focus:border-[#101828] shadow-sm transition-all"
				/>
			</div>

			<div className="grid grid-cols-1 gap-3 overflow-y-auto pr-2 rounded-[5px] flex-1 pb-4">
				{isFetching && (
					<div className="flex flex-col items-center justify-center py-12">
						<Loader2 className="h-8 w-8 animate-spin text-gray-400" />
						<p className="text-sm mt-3 text-gray-500">
							Carregando insumos...
						</p>
					</div>
				)}
				{!isFetching &&
					filteredItems.map((item) => {
						const isSelected = selectedIds.includes(item.id);
						return (
							<div
								key={item.id}
								onClick={() => onToggle(item.id)}
								className={`group flex items-start gap-4 p-4 rounded-lg cursor-pointer border transition-all duration-200 ${
									isSelected
										? 'bg-blue-50/50 border-[#101828] shadow-sm'
										: 'bg-white border-gray-200 hover:border-[#101828]/50 hover:shadow-sm'
								}`}
							>
								<div
									className={`mt-1 w-5 h-5 shrink-0 rounded-[5px] border flex items-center justify-center transition-all duration-200 ${
										isSelected
											? 'bg-[#101828] border-[#101828] text-white'
											: 'border-gray-300 bg-gray-50 group-hover:border-[#101828]/50'
									}`}
								>
									{isSelected && (
										<Check size={14} strokeWidth={3} />
									)}
								</div>
								<div className="flex flex-1 flex-col sm:flex-row sm:items-center justify-between gap-3">
									<div className="flex flex-col gap-1">
										<div className="font-semibold text-sm text-gray-900 group-hover:text-[#101828] transition-colors">
											{item.name}
										</div>
										<div className="flex items-center gap-2 text-xs font-medium text-gray-500">
											<div className="flex items-center gap-1.5">
												<Grip
													size={12}
													className="text-gray-400"
												/>
												<span className="bg-gray-100 px-2 py-0.5 rounded-[5px]">
													{item.category}
												</span>
											</div>
											<span className="text-gray-300">•</span>
											<span className="text-gray-500">
												{item.subcategory}
											</span>
										</div>
									</div>
									<div className="flex flex-col sm:items-end gap-1.5 mt-2 sm:mt-0">
										<div className="inline-flex items-center text-xs font-mono font-medium text-gray-600 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-[5px]">
											Cód: {item.code}
										</div>
										<div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
											UN: {item.unit}
										</div>
									</div>
								</div>
							</div>
						);
					})}

				{!isFetching && filteredItems.length === 0 && (
					<div className="text-center py-16 flex flex-col items-center justify-center h-full">
						<div className="w-16 h-16 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center mb-4">
							<PackageOpen className="w-8 h-8 text-gray-300" />
						</div>
						<p className="text-sm font-semibold text-gray-700">
							Nenhum insumo encontrado
						</p>
						<p className="text-xs text-gray-500 mt-1.5 max-w-[250px] leading-relaxed">
							Não existem insumos disponíveis para cadastro
							correspondente à sua pesquisa no catálogo global.
						</p>
					</div>
				)}
			</div>
		</div>
	);
}
