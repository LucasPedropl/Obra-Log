import { InventoryCategory, InventoryItemConfig } from '../schemas/addInventorySchema';
import { SupplyItemOption } from './addInventoryTypes';

interface AddInventoryConfigStepProps {
	selectedIds: string[];
	globalItems: SupplyItemOption[];
	items: InventoryItemConfig[];
	onQuantityChange: (catalogId: string, quantity: number) => void;
	onCategoryChange: (catalogId: string, category: InventoryCategory) => void;
}

export function AddInventoryConfigStep({
	selectedIds,
	globalItems,
	items,
	onQuantityChange,
	onCategoryChange,
}: AddInventoryConfigStepProps) {
	return (
		<div className="flex flex-col gap-4 overflow-y-auto pr-2 h-full">
			{selectedIds.map((id) => {
				const item = globalItems.find((i) => i.id === id);
				if (!item) return null;

				const config = items.find((i) => i.catalogId === id);
				const quantity = config?.quantity ?? 0;
				const category = config?.category ?? 'NONE';

				return (
					<div
						key={item.id}
						className="bg-white border border-gray-200 shadow-sm rounded-lg p-5 flex flex-col gap-5 shrink-0"
					>
						<div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 border-b border-gray-100 pb-4">
							<div className="flex flex-col gap-1">
								<div className="font-semibold text-[15px] text-gray-900">
									{item.name}
								</div>
								<div className="flex items-center gap-2 text-xs font-medium text-gray-500">
									<span className="bg-gray-100 px-2 py-0.5 rounded-[5px]">
										{item.category}
									</span>
									<span className="text-gray-300">•</span>
									<span className="text-gray-500">
										{item.code}
									</span>
								</div>
							</div>
							<div className="flex items-center gap-3 bg-gray-50 px-4 py-2.5 rounded-[5px] border border-gray-100">
								<label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
									Qtd. Inicial:
								</label>
								<div className="flex items-center gap-2">
									<input
										type="number"
										min={0}
										value={quantity}
										onChange={(e) =>
											onQuantityChange(
												id,
												Number(e.target.value),
											)
										}
										className="w-20 bg-white border border-gray-300 rounded-[5px] px-2 py-1.5 text-sm font-mono focus:outline-none focus:border-[#101828] focus:ring-1 focus:ring-[#101828] text-center shadow-sm"
									/>
									<span className="text-xs font-bold text-gray-500 min-w-[2rem] text-center">
										{item.unit}
									</span>
								</div>
							</div>
						</div>

						<div>
							<label className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-3 block">
								Classificação de Uso na Obra
							</label>
							<div className="grid grid-cols-3 gap-3">
								{(
									[
										['NONE', 'Padrão', 'Consumo Geral'],
										['TOOL', 'Ferramenta', 'Estoque de Ativos'],
										['EPI', 'EPI', 'Segurança'],
									] as const
								).map(([value, label, subtitle]) => (
									<button
										key={value}
										type="button"
										onClick={() =>
											onCategoryChange(id, value)
										}
										className={`py-3 px-2 text-sm font-semibold rounded-[5px] border transition-all duration-200 flex flex-col items-center gap-1 ${
											category === value
												? 'bg-[#101828] border-[#101828] text-white shadow-md transform scale-[1.02]'
												: 'bg-white border-gray-200 text-gray-600 hover:border-gray-400 hover:bg-gray-50'
										}`}
									>
										{label}
										<span
											className={`text-[10px] font-normal ${category === value ? 'text-gray-300' : 'text-gray-400'}`}
										>
											{subtitle}
										</span>
									</button>
								))}
							</div>
						</div>
					</div>
				);
			})}
		</div>
	);
}
