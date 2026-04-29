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
	onCreate?: () => void; // Alterado para não receber string, apenas disparar a ação
	onManage?: () => void;
	placeholder?: string;
	disabled?: boolean;
	onOpenChange?: (isOpen: boolean) => void;
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
	onOpenChange,
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
				handleClose();
			}
		}
		document.addEventListener('mousedown', handleClickOutside);
		return () =>
			document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	const handleOpen = () => {
		if (!disabled) {
			setIsOpen(true);
			onOpenChange?.(true);
		}
	};

	const handleClose = () => {
		setIsOpen(false);
		onOpenChange?.(false);
	};

	const filteredOptions = options.filter((opt) =>
		opt.label.toLowerCase().includes(search.toLowerCase()),
	);
	const selectedOption = options.find((opt) => opt.value === value);

	return (
		<div className="relative w-full" ref={containerRef}>
			<div
				className={cn(
					'flex w-full items-center justify-between rounded-2xl border-2 bg-slate-50/50 px-4 py-3.5 text-sm transition-all duration-200',
					disabled 
						? 'opacity-50 cursor-not-allowed border-slate-100' 
						: isOpen 
							? 'border-slate-900 bg-white shadow-sm cursor-pointer' 
							: 'border-slate-100 hover:border-slate-200 cursor-pointer',
					className
				)}
				onClick={() => {
					if (!isOpen) handleOpen();
					else handleClose();
				}}
			>
				<span
					className={`block truncate font-medium ${selectedOption ? 'text-slate-900' : 'text-slate-400'}`}
				>
					{selectedOption ? selectedOption.label : placeholder}
				</span>
				<ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-slate-900' : 'text-slate-400'}`} />
			</div>

			{isOpen && !disabled && (
				<div className="absolute z-[100] mt-2 w-full rounded-2xl border-2 border-slate-100 bg-white text-slate-900 shadow-2xl outline-none animate-in fade-in-0 zoom-in-95 duration-200 overflow-hidden">
					<div className="flex items-center border-b border-slate-50 px-4 py-3 gap-3">
						<Search className="h-4 w-4 text-slate-400 shrink-0" />
						<input
							className="flex h-6 w-full bg-transparent text-sm font-medium outline-none placeholder:text-slate-400"
							placeholder="Pesquisar..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							autoFocus
						/>
						{onManage && (
							<button
								type="button"
								onClick={(e) => {
									e.stopPropagation();
									handleClose();
									onManage();
								}}
								className="shrink-0 p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
								title="Gerenciar itens"
							>
								<Settings2 size={16} />
							</button>
						)}
					</div>
					<div className="max-h-64 overflow-y-auto p-1.5">
						{onCreate && (
							<div className="p-1 mb-1 border-b border-slate-50">
								<button
									type="button"
									className="flex items-center justify-center w-full px-3 py-2.5 text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all font-bold text-[11px] uppercase tracking-wider gap-2 group"
									onClick={() => {
										onCreate();
										handleClose();
									}}
								>
									<Plus className="h-4 w-4 transition-transform group-hover:scale-110" />
									Cadastrar Novo Perfil
								</button>
							</div>
						)}

						{filteredOptions.length > 0 ? (
							filteredOptions.map((opt) => (
								<div
									key={opt.value}
									className={`relative flex cursor-pointer select-none items-center rounded-xl px-3 py-3 text-sm outline-none transition-all ${
										value === opt.value 
											? 'bg-slate-900 text-white' 
											: 'hover:bg-slate-50 text-slate-700'
									}`}
									onClick={() => {
										onChange(opt.value);
										handleClose();
										setSearch('');
									}}
								>
									<div className="flex flex-col gap-0.5 min-w-0 flex-1">
										<span
											className={`truncate font-bold ${value === opt.value ? 'text-white' : 'text-slate-900'}`}
										>
											{opt.label}
										</span>
										{opt.subLabel && (
											<span className={`text-[10px] truncate font-medium uppercase tracking-tight ${value === opt.value ? 'text-slate-300' : 'text-slate-400'}`}>
												{opt.subLabel}
											</span>
										)}
									</div>
									{value === opt.value && (
										<Check className="ml-2 h-4 w-4 shrink-0 text-white" />
									)}
								</div>
							))
						) : (
							<div className="py-8 text-center text-sm">
								<p className="text-slate-400 font-medium italic">
									Nenhum resultado encontrado.
								</p>
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
