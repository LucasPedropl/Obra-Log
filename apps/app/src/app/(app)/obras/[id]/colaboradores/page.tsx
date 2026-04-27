'use client';
import React, { use, useState } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { Users, Loader2 } from 'lucide-react';
import { TableSearch } from '@/components/shared/TableSearch';
import { Pagination } from '@/components/shared/Pagination';
import { AddSiteCollaboratorForm } from '@/features/colaboradores/components/AddSiteCollaboratorForm';
import { useSiteCollaborators } from '@/features/colaboradores/hooks/useSiteCollaborators';

export default function ColaboradoresObraPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const resolvedParams = use(params);
	const siteId = resolvedParams.id;

	const { collaborators, isLoading, error, refetch } =
		useSiteCollaborators(siteId);

	const [searchTerm, setSearchTerm] = useState('');
	const [currentPage, setCurrentPage] = useState(1);
	const [isFormOpen, setIsFormOpen] = useState(false);

	const filteredItems = collaborators.filter(
		(c) =>
			c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			c.role_title.toLowerCase().includes(searchTerm.toLowerCase()),
	);

	const itemsPerPage = 10;
	const totalPages = Math.max(
		1,
		Math.ceil(filteredItems.length / itemsPerPage),
	);

	const paginatedItems = filteredItems.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage,
	);

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
			) : collaborators.length === 0 && !searchTerm ? (
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

					<div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
						<table className="w-full text-sm text-left">
							<thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-medium">
								<tr>
									<th className="px-4 py-3">Nome</th>
									<th className="px-4 py-3">Função</th>
									<th className="px-4 py-3">CPF</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-gray-100">
								{paginatedItems.map((item) => (
									<tr
										key={item.id}
										className="hover:bg-gray-50/50 transition-colors"
									>
										<td className="px-4 py-3 font-medium text-gray-900">
											{item.name}
										</td>
										<td className="px-4 py-3 text-gray-600">
											<span className="bg-gray-100 text-gray-700 px-2 py-1 rounded border border-gray-200 text-xs">
												{item.role_title}
											</span>
										</td>
										<td className="px-4 py-3 font-mono text-gray-500">
											{item.cpf}
										</td>
									</tr>
								))}
								{paginatedItems.length === 0 && (
									<tr>
										<td
											colSpan={3}
											className="px-4 py-8 text-center text-gray-500"
										>
											Nenhum colaborador encontrado para
											essa pesquisa.
										</td>
									</tr>
								)}
							</tbody>
						</table>
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
						siteId={siteId}
						onCancel={() => setIsFormOpen(false)}
						onSaved={() => {
							setIsFormOpen(false);
							refetch();
						}}
					/>
				</div>
			)}
		</div>
	);
}
