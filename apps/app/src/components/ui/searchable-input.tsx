import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Check } from 'lucide-react';

interface SearchableInputProps {
	options: string[];
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	disabled?: boolean;
}

export function SearchableInput({
	options,
	value,
	onChange,
	placeholder = 'Digite ou selecione...',
	disabled = false,
}: SearchableInputProps) {
	const [isOpen, setIsOpen] = useState(false);
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
		opt.toLowerCase().includes(value.toLowerCase()),
	);

	return (
		<div className="relative" ref={containerRef}>
			<div className="relative">
				<input
					type="text"
					value={value}
					onChange={(e) => {
						onChange(e.target.value);
						setIsOpen(true);
					}}
					onFocus={() => !disabled && setIsOpen(true)}
					disabled={disabled}
					className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-accent/30'}`}
					placeholder={placeholder}
				/>
				<div 
					className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer opacity-50"
					onClick={() => !disabled && setIsOpen(!isOpen)}
				>
					<ChevronDown className="h-4 w-4" />
				</div>
			</div>

			{isOpen && !disabled && filteredOptions.length > 0 && (
				<div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover text-popover-foreground shadow-lg outline-none animate-in fade-in-0 zoom-in-95">
					<div className="max-h-60 overflow-y-auto p-1">
						{filteredOptions.map((opt) => (
							<div
								key={opt}
								className={`relative flex cursor-pointer select-none items-center rounded-[5px] px-2 py-2.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground transition-colors ${value === opt ? 'bg-primary/10 text-primary' : ''}`}
								onClick={() => {
									onChange(opt);
									setIsOpen(false);
								}}
							>
								<Check
									className={`mr-3 h-4 w-4 shrink-0 transition-opacity ${value === opt ? 'opacity-100 text-primary' : 'opacity-0'}`}
								/>
								<span className={`truncate font-medium ${value === opt ? 'text-primary' : 'text-gray-900'}`}>
									{opt}
								</span>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
