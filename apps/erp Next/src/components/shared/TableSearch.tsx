import React from 'react';
import { Search, ListFilter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface TableSearchProps {
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	onFilterClick?: () => void;
	className?: string;
}

export function TableSearch({
	value,
	onChange,
	placeholder = 'Pesquisar...',
	onFilterClick,
	className = '',
}: TableSearchProps) {
	return (
		<div className={`flex flex-col sm:flex-row gap-3 w-full ${className}`}>
			<div className="relative flex-1">
				<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
				<Input
					type="text"
					value={value}
					onChange={(e) => onChange(e.target.value)}
					placeholder={placeholder}
					className="pl-9 h-10 bg-white border-gray-300 w-full rounded-[5px] shadow-sm"
				/>
			</div>
			{onFilterClick && (
				<Button
					variant="outline"
					onClick={onFilterClick}
					className="w-full sm:w-auto h-10 flex items-center justify-center gap-2 bg-white border-gray-300 text-gray-700 hover:bg-gray-50 rounded-[5px] shadow-sm shrink-0"
				>
					<ListFilter className="h-4 w-4" />
					<span>Filtros</span>
				</Button>
			)}
		</div>
	);
}
