import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface PageHeaderProps {
	title: string;
	description: string;
	onAdd?: () => void;
	addLabel?: string;
}

export function PageHeader({
	title,
	description,
	onAdd,
	addLabel = 'Cadastrar',
}: PageHeaderProps) {
	return (
		<div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
			<div>
				<h1 className="text-2xl font-bold text-[#101828]">{title}</h1>
				<p className="text-gray-500 mt-1">{description}</p>
			</div>

			<div className="flex items-center gap-2">
				{onAdd && (
					<Button
						size="sm"
						onClick={onAdd}
						className="flex items-center gap-2 bg-[#101828] hover:bg-[#1a2333] text-white rounded-[5px] px-4 shadow-sm"
					>
						<Plus className="h-4 w-4" />
						<span>{addLabel}</span>
					</Button>
				)}
			</div>
		</div>
	);
}
