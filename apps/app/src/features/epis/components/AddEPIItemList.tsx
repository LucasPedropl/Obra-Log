import { Check, PackageOpen } from 'lucide-react';

export interface EPIInventoryItem {
	id: string;
	name: string;
	code: string;
	unit: string;
	category: string;
	subcategory: string;
	quantity: number;
}

interface AddEPIItemListProps {
	items: EPIInventoryItem[];
	selectedIds: string[];
	onToggle: (id: string) => void;
}

export function AddEPIItemList({
	items,
	selectedIds,
	onToggle,
}: AddEPIItemListProps) {
	if (items.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center h-full text-center py-8">
				<div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
					<PackageOpen className="w-6 h-6 text-gray-400" />
				</div>
				<h3 className="text-sm font-semibold text-gray-900">
					Nenhum item encontrado
				</h3>
				<p className="text-xs text-gray-500 mt-1 max-w-[250px]">
					Todos os EPIs já foram importados ou não há insumos no
					almoxarifado correspondentes.
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-2">
			{items.map((item) => {
				const isSelected = selectedIds.includes(item.id);
				return (
					<div
						key={item.id}
						onClick={() => onToggle(item.id)}
						className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-200 group ${
							isSelected
								? 'border-[#101828] bg-blue-50/30 shadow-sm'
								: 'border-gray-200 bg-white hover:border-[#101828]/30 hover:shadow-sm'
						}`}
					>
						<div
							className={`flex items-center justify-center w-5 h-5 rounded-[4px] border transition-colors shrink-0 ${
								isSelected
									? 'bg-[#101828] border-[#101828]'
									: 'border-gray-300 group-hover:border-[#101828]/50 bg-white'
							}`}
						>
							{isSelected && (
								<Check className="w-3.5 h-3.5 text-white" />
							)}
						</div>
						<div className="flex-1 min-w-0">
							<div className="flex items-center justify-between mb-0.5">
								<span className="text-sm font-semibold text-gray-900 truncate pr-4">
									{item.name}
								</span>
								<span className="text-xs font-medium text-gray-500 shrink-0">
									Estoque: {item.quantity}
								</span>
							</div>
							<div className="flex justify-between items-center text-xs text-gray-500">
								<span>Cod: {item.code}</span>
								<span>{item.category}</span>
							</div>
						</div>
					</div>
				);
			})}
		</div>
	);
}
