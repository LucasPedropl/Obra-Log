'use client';

import { Icon } from '../ui/Icon';
import { cn } from '@/lib/utils';
import { useObraSelector } from './useObraSelector';

export function HeaderObraSelector() {
	const {
		obras,
		isOpen,
		setIsOpen,
		dropdownRef,
		displayName,
		initials,
		selectedObraId,
		handleSelectObra,
		router,
	} = useObraSelector({ target: 'header' });

	return (
		<div className="relative hidden md:block" ref={dropdownRef}>
			<div
				onClick={() => setIsOpen(!isOpen)}
				className="flex items-center gap-2.5 px-2 py-1.5 rounded-none transition-all group cursor-pointer hover:bg-gray-50 active:scale-[0.98]"
			>
				<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-none bg-[#101828] text-white border border-gray-700 overflow-hidden">
					<span className="text-[10px] font-bold tracking-wider">{initials}</span>
				</div>
				<div className="flex flex-col min-w-0">
					<div className="flex items-center gap-1">
						<span className="text-[16px] font-semibold text-gray-900 leading-tight tracking-tight truncate max-w-[160px]">
							{displayName}
						</span>
						<Icon
							name="CaretDown"
							size={14}
							className={cn(
								'text-gray-400 transition-transform duration-200 shrink-0',
								isOpen ? 'rotate-180' : '',
							)}
						/>
					</div>
					<span className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.05em] leading-none mt-0.5">
						Obra Ativa
					</span>
				</div>
			</div>

			{isOpen && (
				<div className="absolute left-0 mt-2 w-72 origin-top-left rounded-none bg-white p-1.5 shadow-2xl ring-1 ring-black/5 z-[60] animate-in fade-in zoom-in duration-200 border border-gray-100">
					<div className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50 mb-1">
						Minhas Obras
					</div>
					<div className="max-h-60 overflow-y-auto custom-scrollbar">
						{obras.map((obra) => {
							const isActive = obra.id === selectedObraId;
							return (
								<button
									key={obra.id}
									onClick={() => handleSelectObra(obra)}
									className={cn(
										'w-full flex items-center gap-3 px-3 py-2.5 rounded-none text-sm text-left transition-all mb-0.5',
										isActive
											? 'bg-blue-600 text-white shadow-md shadow-blue-200'
											: 'text-gray-700 hover:bg-gray-50',
									)}
								>
									<div
										className={cn(
											'flex h-8 w-8 shrink-0 items-center justify-center rounded-none text-[10px] font-bold border',
											isActive
												? 'bg-white/20 border-white/30 text-white'
												: 'bg-gray-100 border-gray-200 text-gray-500',
										)}
									>
										{obra.name
											.split(' ')
											.map((n) => n[0])
											.join('')
											.substring(0, 2)
											.toUpperCase()}
									</div>
									<span className="flex-1 truncate font-semibold">{obra.name}</span>
									{isActive && <Icon name="Check" size={16} />}
								</button>
							);
						})}
					</div>
					<div className="border-t border-gray-100 mt-1 pt-1 flex flex-col gap-0.5">
						<button
							onClick={() => {
								router.push('/obras?novo=true');
								setIsOpen(false);
							}}
							className="flex items-center px-3 py-2 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-none transition-colors"
						>
							<Icon name="Plus" size={14} className="mr-2" /> Adicionar Obra
						</button>
						<button
							onClick={() => {
								router.push('/obras');
								setIsOpen(false);
							}}
							className="flex items-center px-3 py-2 text-xs font-bold text-gray-500 hover:bg-gray-50 rounded-none transition-colors"
						>
							<Icon name="SquaresFour" size={14} className="mr-2" /> Ver Tudo
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
