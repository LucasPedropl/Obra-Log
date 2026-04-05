import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import { useEscape } from '../../hooks/useEscape';

interface Option {
	value?: string;
	id?: string;
	label: string | React.ReactNode;
	searchValue?: string; // The text to filter by
}

interface SearchableSelectProps {
	options: Option[];
	value: string; // The selected value
	onChange: (value: string) => void;
	placeholder?: string;
	disabled?: boolean;
	required?: boolean;
	emptyMessage?: string;
	closeOnSelect?: boolean;
}

export function SearchableSelect({
	options,
	value,
	onChange,
	placeholder = 'Selecione ou digite...',
	disabled = false,
	required = false,
	emptyMessage = 'Nenhuma opção encontrada.',
	closeOnSelect = true,
}: SearchableSelectProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [search, setSearch] = useState('');
	const wrapperRef = useRef<HTMLDivElement>(null);

	useEscape(() => setIsOpen(false));

	const selectedOption = options.find(
		(opt) => (opt.value || opt.id) === value,
	);

	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (
				wrapperRef.current &&
				!wrapperRef.current.contains(e.target as Node)
			) {
				setIsOpen(false);
			}
		};
		document.addEventListener('mousedown', handleClickOutside);
		return () =>
			document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	const filteredOptions = options.filter((opt) => {
		const searchTarget =
			opt.searchValue || (typeof opt.label === 'string' ? opt.label : '');
		return searchTarget
			.toString()
			.toLowerCase()
			.includes(search.toLowerCase());
	});

	return (
		<div ref={wrapperRef} className="relative w-full">
			<div
				onClick={() => {
					if (!disabled) setIsOpen(!isOpen);
				}}
				className={`w-full flex items-center justify-between px-3 py-2.5 bg-background border border-border rounded-lg text-sm cursor-pointer transition-colors ${
					disabled
						? 'opacity-60 cursor-not-allowed'
						: 'hover:border-primary/50 text-text-main'
				} ${isOpen ? 'ring-2 ring-primary/20 border-primary' : ''}`}
			>
				<span
					className={
						selectedOption
							? 'text-text-main truncate'
							: 'text-text-muted truncate'
					}
				>
					{selectedOption ? selectedOption.label : placeholder}
				</span>
				<div className="flex items-center gap-1 shrink-0 ml-2">
					{selectedOption && !disabled && (
						<div
							onClick={(e) => {
								e.stopPropagation();
								onChange('');
								setSearch('');
							}}
							className="p-1 hover:bg-black/5 rounded-md transition-colors"
						>
							<X
								size={14}
								className="text-text-muted hover:text-red-500"
							/>
						</div>
					)}
					<ChevronDown
						size={16}
						className={`text-text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`}
					/>
				</div>
			</div>

			{/* Dummy inline input so native validation catches "required" if value is empty */}
			{required && !value && (
				<input
					tabIndex={-1}
					autoComplete="off"
					className="absolute opacity-0 w-0 h-0 bottom-0 left-1/2 -translate-x-1/2 -z-10 pointer-events-none"
					required
				/>
			)}

			{isOpen && (
				<div className="absolute top-full mt-1 w-full bg-surface border border-border rounded-lg shadow-xl z-50 overflow-hidden">
					<div className="p-2 border-b border-border flex items-center gap-2 bg-background/50">
						<Search
							size={16}
							className="text-text-muted shrink-0 ml-1"
						/>
						<input
							autoFocus
							type="text"
							placeholder="Buscar..."
							className="w-full bg-transparent border-none outline-none text-sm p-1 text-text-main placeholder-text-muted"
							value={search}
							onChange={(e) => setSearch(e.target.value)}
						/>
					</div>

					<div className="max-h-60 overflow-y-auto p-1">
						{filteredOptions.length > 0 ? (
							filteredOptions.map((opt) => {
								const optValue = opt.value || opt.id || '';
								return (
									<button
										key={optValue}
										type="button"
										onClick={(e) => {
											e.preventDefault();
											onChange(optValue);
											setSearch('');
											if (closeOnSelect) {
												setIsOpen(false);
											}
										}}
										className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
											value === optValue
												? 'bg-primary/10 text-primary font-medium'
												: 'text-text-main hover:bg-background'
										}`}
									>
										{opt.label}
									</button>
								);
							})
						) : (
							<div className="p-3 text-center text-sm text-text-muted">
								{emptyMessage}
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
