import React from 'react';
import { X, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FilterPanelProps {
	isOpen: boolean;
	onClose: () => void;
	onClear: () => void;
	children: React.ReactNode;
}

export function FilterPanel({
	isOpen,
	onClose,
	onClear,
	children,
}: FilterPanelProps) {
	if (!isOpen) return null;

	return (
		<div className="w-full bg-white border border-gray-200 rounded-[5px] p-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
			<div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
				<div className="flex items-center gap-2 text-gray-700 font-semibold">
					<Filter className="w-4 h-4" />
					<span>Filtros Avançados</span>
				</div>
				<button
					onClick={onClose}
					className="text-gray-400 hover:text-gray-600 transition-colors"
				>
					<X className="w-4 h-4" />
				</button>
			</div>

			<div className="w-full">
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{children}
				</div>

				<div className="flex justify-end mt-4 pt-4 border-t border-gray-100">
					<Button
						variant="ghost"
						onClick={onClear}
						className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-[5px] h-9"
					>
						Limpar Filtros
					</Button>
				</div>
			</div>
		</div>
	);
}
