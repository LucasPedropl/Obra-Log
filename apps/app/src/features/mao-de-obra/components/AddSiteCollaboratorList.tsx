import { Check, Grip, UserCircle, Users } from 'lucide-react';

export interface AvailableCollaborator {
	id: string;
	name: string;
	email?: string | null;
	role_title?: string | null;
	cpf?: string | null;
	status?: string | null;
	avatar_url?: string | null;
}

interface AddSiteCollaboratorListProps {
	isLoading: boolean;
	items: AvailableCollaborator[];
	selectedIds: string[];
	onToggle: (id: string) => void;
}

export function AddSiteCollaboratorList({
	isLoading,
	items,
	selectedIds,
	onToggle,
}: AddSiteCollaboratorListProps) {
	if (isLoading) {
		return null;
	}

	if (items.length === 0) {
		return (
			<div className="text-center py-16 flex flex-col items-center justify-center h-full">
				<div className="w-16 h-16 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center mb-4">
					<Users className="w-8 h-8 text-gray-300" />
				</div>
				<p className="text-sm font-semibold text-gray-700">
					Nenhum colaborador encontrado
				</p>
				<p className="text-xs text-gray-500 mt-1.5 max-w-[250px] leading-relaxed">
					Não encontramos nenhum colaborador correspondente à sua
					pesquisa no cadastro global.
				</p>
			</div>
		);
	}

	return (
		<>
			{items.map((item) => {
				const isSelected = selectedIds.includes(item.id);
				return (
					<div
						key={item.id}
						onClick={() => onToggle(item.id)}
						className={`group flex items-start gap-4 p-4 rounded-lg cursor-pointer border transition-all duration-200 ${
							isSelected
								? 'bg-blue-50/50 border-[#101828] shadow-sm'
								: 'bg-white border-gray-200 hover:border-[#101828]/50 hover:shadow-sm'
						}`}
					>
						<div
							className={`mt-1 w-5 h-5 shrink-0 rounded-[5px] border flex items-center justify-center transition-all duration-200 ${
								isSelected
									? 'bg-[#101828] border-[#101828] text-white'
									: 'border-gray-300 bg-gray-50 group-hover:border-[#101828]/50'
							}`}
						>
							{isSelected && <Check size={14} strokeWidth={3} />}
						</div>

						{item.avatar_url ? (
							<img
								src={item.avatar_url}
								alt={item.name}
								className="hidden sm:flex w-10 h-10 rounded-full object-cover flex-shrink-0 items-center justify-center border border-gray-200 mt-0.5"
							/>
						) : (
							<div className="hidden sm:flex w-10 h-10 rounded-full bg-gray-100 flex-shrink-0 items-center justify-center border border-gray-200 mt-0.5">
								<UserCircle className="w-6 h-6 text-gray-400" />
							</div>
						)}

						<div className="flex flex-1 flex-col sm:flex-row sm:items-center justify-between gap-3">
							<div className="flex flex-col gap-1">
								<div className="font-semibold text-sm text-gray-900 group-hover:text-[#101828] transition-colors">
									{item.name}
								</div>
								<div className="flex items-center gap-2 text-xs font-medium text-gray-500">
									<div className="flex items-center gap-1.5">
										<Grip size={12} className="text-gray-400" />
										<span className="bg-gray-100 px-2 py-0.5 rounded-[5px]">
											{item.email || 'Sem email'}
										</span>
									</div>
									<span className="text-gray-300">•</span>
									<span className="text-gray-500">
										{item.role_title || 'Sem Cargo'}
									</span>
								</div>
							</div>
							<div className="flex flex-col sm:items-end gap-1.5 mt-2 sm:mt-0">
								<div className="inline-flex items-center text-xs font-mono font-medium text-gray-600 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-[5px]">
									CPF: {item.cpf || 'N/A'}
								</div>
								<div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
									STATUS: {item.status || 'ativo'}
								</div>
							</div>
						</div>
					</div>
				);
			})}
		</>
	);
}
