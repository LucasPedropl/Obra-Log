'use client';

import { use, useState } from 'react';
import { useRentedHistory } from '@/features/equip-alugados/hooks/useRentedHistory';

export interface RentedHistoryItem {
	id: string;
	name: string;
	category: string;
	quantity: number;
	status: string;
	entryDate: string;
	exitDate: string;
	description: string;
}
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable, ColumnDef } from '@/components/shared/DataTable';
import { EmptyState } from '@/components/shared/EmptyState';
import { Pagination } from '@/components/shared/Pagination';
import { Loader2, Search, History } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface RentedHistoryPageProps {
	params: Promise<{ id: string }>;
}

export default function RentedHistoryPage({ params }: RentedHistoryPageProps) {
	const resolvedParams = use(params);
	const siteId = resolvedParams.id;

	const { history, isLoading } = useRentedHistory(siteId);

	const [searchTerm, setSearchTerm] = useState('');
	const [currentPage, setCurrentPage] = useState(1);

	const itemsPerPage = 8;
	const filteredHistory = history.filter((item) => {
		const search = searchTerm.toLowerCase();
		return (
			item.name.toLowerCase().includes(search) ||
			item.category.toLowerCase().includes(search)
		);
	});

	const totalPages = Math.max(
		1,
		Math.ceil(filteredHistory.length / itemsPerPage),
	);
	const currentHistory = filteredHistory.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage,
	);

	const columns: ColumnDef<RentedHistoryItem>[] = [
		{
			header: 'Equipamento',
			accessorKey: 'name',
			className: 'font-medium',
		},
		{
			header: 'Categoria',
			accessorKey: 'category',
		},
		{
			header: 'Quantidade Devolvida',
			cell: (item) => `${item.quantity} UN`,
		},
		{
			header: 'Chegada',
			accessorKey: 'entryDate',
			cell: (item) =>
				format(new Date(item.entryDate), "dd/MM/yyyy 'às' HH:mm", {
					locale: ptBR,
				}),
		},
		{
			header: 'Devolução',
			accessorKey: 'exitDate',
			cell: (item) =>
				format(new Date(item.exitDate), "dd/MM/yyyy 'às' HH:mm", {
					locale: ptBR,
				}),
		},
	];

	if (isLoading) {
		return (
			<div className="flex flex-col items-center justify-center p-12 gap-3 h-full">
				<Loader2 className="w-8 h-8 animate-spin text-[#101828]" />
				<p className="text-gray-500">Carregando histórico...</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-6 relative">
			<PageHeader
				title="Histórico de Devoluções"
				description="Veja todos os equipamentos que foram devolvidos nesta obra."
			/>

			<div className="flex flex-col gap-5">
				{history.length > 0 && (
					<div className="flex flex-col gap-4">
						<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
							<div className="flex-1 w-full relative">
								<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
									<Search className="h-4 w-4 text-gray-400" />
								</div>
								<input
									type="text"
									placeholder="Pesquisar por equipamento ou categoria..."
									value={searchTerm}
									onChange={(e) => {
										setSearchTerm(e.target.value);
										setCurrentPage(1);
									}}
									className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-[#101828] focus:border-[#101828] sm:text-sm"
								/>
							</div>
						</div>
					</div>
				)}

				{!isLoading && filteredHistory.length === 0 ? (
					<EmptyState
						title={
							searchTerm
								? 'Nenhum equipamento encontrado'
								: 'Nenhuma devolução registrada'
						}
						description={
							searchTerm
								? 'Tente mudar os termos da pesquisa.'
								: 'O histórico de locações será exibido aqui assim que equipamentos forem devolvidos.'
						}
						icon={<History className="w-8 h-8 text-gray-400" />}
					/>
				) : (
					<>
						<DataTable
							data={currentHistory}
							columns={columns}
							keyExtractor={(item) => item.id}
						/>

						{filteredHistory.length > 0 && (
							<Pagination
								currentPage={currentPage}
								totalPages={totalPages}
								onPageChange={setCurrentPage}
							/>
						)}
					</>
				)}
			</div>
		</div>
	);
}
