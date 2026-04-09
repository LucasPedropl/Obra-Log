import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Plus, Check } from 'lucide-react';

interface Option {
	value: string;
	label: string;
}

interface SearchableSelectProps {
	options: Option[];
	value: string;
	onChange: (value: string) => void;
	onCreate?: (inputValue: string) => void;
	placeholder?: string;
}

export function SearchableSelect({
	options,
	value,
	onChange,
	onCreate,
	placeholder = 'Selecione...',
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
		<div className="relative" ref={containerRef}>
			<div
				className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground hover:bg-accent/30 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer transition-colors"
				onClick={() => setIsOpen(!isOpen)}
			>
				<span
					className={`block truncate ${selectedOption ? '' : 'text-muted-foreground'}`}
				>
					{selectedOption ? selectedOption.label : placeholder}
				</span>
				<ChevronDown className="h-4 w-4 opacity-50 shrink-0 ml-2" />
			</div>

			{isOpen && (
				<div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover text-popover-foreground shadow-lg outline-none animate-in fade-in-0 zoom-in-95">
					<div className="flex items-center border-b border-border px-3 py-2">
						<Search className="mr-2 h-4 w-4 opacity-50 shrink-0" />
						<input
							className="flex h-8 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
							placeholder="Pesquisar..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							autoFocus
						/>
					</div>
					<div className="max-h-60 overflow-y-auto p-1">
						{filteredOptions.length > 0 ? (
							filteredOptions.map((opt) => (
								<div
									key={opt.value}
									className={`relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground ${value === opt.value ? 'bg-primary/10 text-primary font-medium' : ''}`}
									onClick={() => {
										onChange(opt.value);
										setIsOpen(false);
										setSearch('');
									}}
								>
									<Check
										className={`mr-2 h-4 w-4 shrink-0 ${value === opt.value ? 'opacity-100 text-primary' : 'opacity-0'}`}
									/>
									<span className="truncate">
										{opt.label}
									</span>
								</div>
							))
						) : (
							<div className="py-6 text-center text-sm">
								<p className="text-muted-foreground mb-3">
									Nenhum resultado encontrado.
								</p>
								{onCreate && search && (
									<button
										type="button"
										className="flex items-center justify-center w-[90%] mx-auto px-3 py-2 text-primary bg-primary/10 hover:bg-primary/20 rounded-md transition-colors font-medium"
										onClick={() => {
											onCreate(search);
											setIsOpen(false);
											setSearch('');
										}}
									>
										<Plus className="mr-2 h-4 w-4" />
										Cadastrar "{search}"
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
