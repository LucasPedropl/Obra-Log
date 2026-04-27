import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Plus, Check, Settings2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SearchableOption {
	value: string;
	label: string;
	subLabel?: string;
}

interface SearchableSelectProps {
	options: SearchableOption[];
	value: string;
	onChange: (value: string) => void;
	onCreate?: (inputValue: string) => void;
	onManage?: () => void;
	placeholder?: string;
	disabled?: boolean;
	className?: string;
}

export function SearchableSelect({
	options,
	value,
	onChange,
	onCreate,
	onManage,
	placeholder = 'Selecione...',
	disabled = false,
	className,
}: SearchableSelectProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [search, setSearch] = useState('');
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (
				containerRef.current &&
				!containerRef.current.contains(event.target as Node)
			) {
				setIsOpen(false);
			}
		}
		document.addEventListener('mousedown', handleClickOutside);
		return () =>
			document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	const filteredOptions = options.filter((opt) =>
		opt.label.toLowerCase().includes(search.toLowerCase()),
	);
	const selectedOption = options.find((opt) => opt.value === value);

	return (
		<div className={cn('relative', className)} ref={containerRef}>
			<div
				className={cn(
					'flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all',
					disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-50 cursor-pointer'
				)}
				onClick={() => {
					if (!disabled) setIsOpen(!isOpen);
				}}
			>
				<span
					className={cn('block truncate', !selectedOption && 'text-slate-400')}
				>
					{selectedOption ? selectedOption.label : placeholder}
				</span>
				<ChevronDown className="h-4 w-4 opacity-50 shrink-0 ml-2" />
			</div>

			{isOpen && !disabled && (
				<div className="absolute z-50 mt-1 w-full rounded-md border border-slate-200 bg-white text-slate-900 shadow-lg outline-none animate-in fade-in-0 zoom-in-95">
					<div className="flex items-center border-b border-slate-100 px-3 py-2 gap-2">
						<Search className="h-4 w-4 opacity-50 shrink-0 text-slate-400" />
						<input
							className="flex h-8 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-slate-400"
							placeholder="Pesquisar..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							autoFocus
						/>
						{onManage && (
							<button
								onClick={(e) => {
									e.stopPropagation();
									setIsOpen(false);
									onManage();
								}}
								className="shrink-0 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
								title="Gerenciar itens"
							>
								<Settings2 size={16} />
							</button>
						)}
					</div>
					<div className="max-h-60 overflow-y-auto p-1">
						{filteredOptions.length > 0 ? (
							filteredOptions.map((opt) => (
								<div
									key={opt.value}
									className={cn(
										'relative flex cursor-pointer select-none items-center rounded-md px-2 py-2.5 text-sm outline-none hover:bg-slate-50 transition-colors',
										value === opt.value ? 'bg-blue-50 text-blue-600' : ''
									)}
									onClick={() => {
										onChange(opt.value);
										setIsOpen(false);
										setSearch('');
									}}
								>
									<Check
										className={cn(
											'mr-3 h-4 w-4 shrink-0 transition-opacity',
											value === opt.value ? 'opacity-100 text-blue-600' : 'opacity-0'
										)}
									/>
									<div className="flex flex-col gap-0.5 min-w-0">
										<span
											className={cn('truncate font-medium', value === opt.value ? 'text-blue-600' : 'text-slate-900')}
										>
											{opt.label}
										</span>
										{opt.subLabel && (
											<span className="text-[11px] text-slate-500 truncate leading-tight">
												{opt.subLabel}
											</span>
										)}
									</div>
								</div>
							))
						) : (
							<div className="py-6 text-center text-sm">
								<p className="text-slate-400 mb-3">
									Nenhum resultado encontrado.
								</p>
								{onCreate && search && (
									<button
										type="button"
										className="flex items-center justify-center w-[90%] mx-auto px-3 py-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors font-medium"
										onClick={() => {
											onCreate(search);
											setIsOpen(false);
											setSearch('');
										}}
									>
										<Plus className="mr-2 h-4 w-4" />
										Cadastrar &quot;{search}&quot;
									</button>
								)}
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
