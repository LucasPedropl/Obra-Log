'use client';
import { use } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';

export default function EquipamentosAlugadosObraPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const resolvedParams = use(params);

	return (
		<div className="flex flex-col h-full gap-6">
			<PageHeader
				title="Equipamentos Alugados"
				description="Gestão dos equipamentos alugados na obra"
			/>
			<div className="bg-white p-6 rounded-lg border border-gray-200">
				<p className="text-gray-500">
					Módulo em desenvolvimento... (Obra {resolvedParams.id})
				</p>
			</div>
		</div>
	);
}
