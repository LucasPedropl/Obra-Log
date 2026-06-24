import React from 'react';
import { Building2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserFormSitesProps {
	sites: { id: string; name: string }[];
	selectedSiteIds: string[];
	onToggle: (siteId: string) => void;
}

export function UserFormSites({
	sites,
	selectedSiteIds,
	onToggle,
}: UserFormSitesProps) {
	return (
		<div className="pt-4 border-t space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
			<div className="flex items-center gap-2 text-amber-600">
				<Building2 size={18} />
				<h4 className="text-sm font-semibold">Vincular Obras Específicas</h4>
			</div>
			<p className="text-xs text-gray-500">
				Este perfil possui restrição de acesso. Selecione as obras que este usuário poderá visualizar.
			</p>

			{sites.length === 0 ? (
				<div className="bg-amber-50 border border-amber-100 rounded-lg p-3 flex gap-3 text-amber-800">
					<Info size={20} className="shrink-0" />
					<p className="text-xs leading-relaxed">
						<strong>Atenção:</strong> Não há obras ativas cadastradas. O usuário não terá acesso a nenhuma obra até que obras sejam vinculadas.
					</p>
				</div>
			) : (
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border rounded-md bg-gray-50/50">
					{sites.map((site) => (
						<div
							key={site.id}
							onClick={() => onToggle(site.id)}
							className={cn(
								'flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-all',
								selectedSiteIds.includes(site.id)
									? 'bg-primary/10 border-primary/30 text-primary font-medium'
									: 'bg-white border-gray-200 hover:border-gray-300 text-gray-700',
							)}
						>
							<div
								className={cn(
									'w-4 h-4 rounded border flex items-center justify-center transition-colors',
									selectedSiteIds.includes(site.id)
										? 'bg-primary border-primary'
										: 'border-gray-300',
								)}
							>
								{selectedSiteIds.includes(site.id) && (
									<div className="w-1.5 h-1.5 bg-white rounded-full" />
								)}
							</div>
							<span className="text-xs truncate">{site.name}</span>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
