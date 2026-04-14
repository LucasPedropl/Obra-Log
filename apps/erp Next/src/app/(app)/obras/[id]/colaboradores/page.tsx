'use client';
import React, { use, useState } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { Users, Loader2 } from 'lucide-react';
import { TableSearch } from '@/components/shared/TableSearch';
import { Pagination } from '@/components/shared/Pagination';
import { AddSiteCollaboratorForm } from '@/features/colaboradores/components/AddSiteCollaboratorForm';

export default function ColaboradoresObraPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const resolvedParams = use(params);

	const [searchTerm, setSearchTerm] = useState('');
	const [currentPage, setCurrentPage] = useState(1);
	const [isLoading, setIsLoading] = useState(false);
	const [isFormOpen, setIsFormOpen] = useState(false);

	const items: any[] = [];
	const itemsPerPage = 10;
	const totalPages = Math.max(1, Math.ceil(items.length / itemsPerPage));

	return (
		<div className="w-full flex flex-col gap-6 relative">
			<PageHeader
				title="Colaboradores da Obra"
				description="Gestão da equipe de campo, funções e horários da obra"
				onAdd={() => setIsFormOpen(true)}
				addLabel="Alojar Colaborador"
			/>

			{isLoading ? (
				<div className="flex items-center justify-center p-12">
					<Loader2 className="h-8 w-8 animate-spin text-gray-400" />
				</div>
			) : items.length === 0 && !searchTerm ? (
				<EmptyState
					title="Nenhum Colaborador"
					description="Esta obra ainda não possui colaboradores alocados nela."
					icon={<Users className="w-8 h-8 text-gray-400" />}
				/>
			) : (
				<div className="flex flex-col gap-4">
					<TableSearch
						value={searchTerm}
						onChange={(val) => {
							setSearchTerm(val);
							setCurrentPage(1);
						}}
						placeholder="Pesquisar por nome ou função..."
					/>

					{/* Tabela provisória */}
					<div className="bg-white rounded-lg border border-gray-200">
						<div className="p-12 text-center text-gray-500">
							A tabela de Colaboradores alocados será gerada aqui.
						</div>
					</div>

					<Pagination
						currentPage={currentPage}
						totalPages={totalPages}
						onPageChange={setCurrentPage}
					/>
				</div>
			)}

			{isFormOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
					<AddSiteCollaboratorForm
						siteId={resolvedParams.id}
						onCancel={() => setIsFormOpen(false)}
						onSaved={() => setIsFormOpen(false)}
					/>
				</div>
			)}
		</div>
	);
}
