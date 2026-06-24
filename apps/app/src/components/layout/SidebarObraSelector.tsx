'use client';

import { Icon } from '../ui/Icon';
import { cn } from '@/lib/utils';
import { useObraSelector } from './useObraSelector';

interface SidebarObraSelectorProps {
	isOpen: boolean;
	isMobileOpen: boolean;
	onMobileClose?: () => void;
}

export function SidebarObraSelector({
	isOpen,
	isMobileOpen,
	onMobileClose,
}: SidebarObraSelectorProps) {
	const {
		obras,
		isOpen: isObraSelectOpen,
		setIsOpen: setIsObraSelectOpen,
		dropdownRef: obraSelectRef,
		displayName,
		initials,
		selectedObraId,
		handleSelectObra,
		router,
	} = useObraSelector({ target: 'sidebar', onMobileClose });

	const isExpanded = isOpen || isMobileOpen;

	return (
		<div className="relative px-4 mt-6 mb-2 shrink-0" ref={obraSelectRef}>
			<div
				onClick={() => setIsObraSelectOpen(!isObraSelectOpen)}
				className={cn(
					'flex items-center gap-3 border border-gray-800 rounded-none transition-all cursor-pointer hover:bg-white/5 active:scale-[0.98] group',
					isExpanded ? 'p-2.5' : 'h-12 w-12 mx-auto justify-center p-0',
				)}
			>
				<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-none bg-gray-800 text-white font-bold text-xs shadow-inner">
					{initials}
				</div>

				{isExpanded && (
					<>
						<div className="flex-1 min-w-0">
							<p className="text-sm font-bold text-white truncate leading-tight">
								{displayName}
							</p>
							<p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">
								Obra Ativa
							</p>
						</div>
						<Icon
							name="CaretUpDown"
							size={16}
							className="text-gray-500 group-hover:text-gray-300"
						/>
					</>
				)}
			</div>

			{isObraSelectOpen && (
				<div
					className={cn(
						'absolute mt-2 bg-[#1f2937] border border-gray-700 rounded-none shadow-2xl z-[100] overflow-hidden transition-all animate-in fade-in zoom-in duration-200',
						isExpanded ? 'left-4 right-4' : 'left-full ml-2 w-64 top-0',
					)}
				>
					<div className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-800/50 border-b border-gray-700">
						Minhas Obras
					</div>
					<div className="max-h-60 overflow-y-auto custom-scrollbar">
						{obras.map((obra) => (
							<button
								key={obra.id}
								onClick={() => handleSelectObra(obra)}
								className={cn(
									'w-full flex items-center px-4 py-3 text-sm text-left transition-colors hover:bg-blue-600 hover:text-white',
									obra.id === selectedObraId
										? 'bg-blue-600/10 text-blue-400 font-bold'
										: 'text-gray-300',
								)}
							>
								<span className="truncate">{obra.name}</span>
							</button>
						))}
					</div>
					<div className="border-t border-gray-700 p-1.5 flex flex-col gap-1 bg-gray-800/20">
						<button
							onClick={() => {
								router.push('/obras?novo=true');
								setIsObraSelectOpen(false);
							}}
							className="flex items-center px-3 py-2 text-xs font-bold text-blue-400 hover:bg-blue-600/10 rounded-none transition-colors"
						>
							<Icon name="Plus" size={14} className="mr-2" /> Adicionar Obra
						</button>
						<button
							onClick={() => {
								router.push('/obras');
								setIsObraSelectOpen(false);
							}}
							className="flex items-center px-3 py-2 text-xs font-bold text-gray-400 hover:bg-gray-700 rounded-none transition-colors"
						>
							<Icon name="SquaresFour" size={14} className="mr-2" /> Ver Tudo
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
