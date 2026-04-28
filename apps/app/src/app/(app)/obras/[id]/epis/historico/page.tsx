'use client';

import { use, useState } from 'react';
import { useEPIHistory } from '@/features/epis/hooks/useEPIHistory';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable, ColumnDef, DetailRow } from '@/components/shared/DataTable';
import { EmptyState } from '@/components/shared/EmptyState';
import { TableSearch } from '@/components/shared/TableSearch';
import { Pagination } from '@/components/shared/Pagination';
import { History, Loader2, User, Shield } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface EPIsHistoricoPageProps {
	params: Promise<{ id: string }>;
}

export default function EPIsHistoricoPage({ params }: EPIsHistoricoPageProps) {
	const resolvedParams = use(params);
	const siteId = resolvedParams.id;

	const { history, isLoading } = useEPIHistory(siteId);

	const [searchTerm, setSearchTerm] = useState('');
	const [dateRange, setDateRange] = useState<
		{ from: Date; to: Date } | undefined
	>();
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 10;
	// Calculate total items
	const filteredHistory = history.filter(
		(item) =>
			item.epiName.toLowerCase().includes(searchTerm.toLowerCase()) ||
			item.collaboratorName
				.toLowerCase()
				.includes(searchTerm.toLowerCase()),
	);
	const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);

	const [activeTab, setActiveTab] = useState<'colaborador' | 'epi'>(
		'colaborador',
	);

	const columns: ColumnDef<any>[] = [
		{
			header: 'Data/Hora',
			accessorKey: 'withdrawalDate',
			cell: (item) =>
				format(new Date(item.withdrawalDate), "dd/MM/yyyy 'às' HH:mm", {
					locale: ptBR,
				}),
		},
		{
			header: 'EPI',
			accessorKey: 'epiName',
			className: 'font-medium',
		},
		{
			header: 'Colaborador',
			accessorKey: 'collaboratorName',
		},
		{
			header: 'Quantidade',
			accessorKey: 'quantity',
			cell: (item) => `${item.quantity} UN`,
		},
		{
			header: 'Responsável',
			accessorKey: 'withdrawnByName',
		},
	];

	if (isLoading) {
		return (
			<div className="flex flex-col items-center justify-center p-12 gap-3 h-full">
				<Loader2 className="w-8 h-8 animate-spin text-[#101828]" />
				<p className="text-gray-500">Carregando histórico de EPIs...</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				title="Histórico de EPIs"
				description="Acompanhe as entregas de Equipamentos de Proteção Individual para os colaboradores."
			/>

			<div className="flex flex-col gap-5">
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
					<div className="flex-1 w-full">
						<TableSearch
							value={searchTerm}
							onChange={(v) => {
								setSearchTerm(v);
								setCurrentPage(1);
							}}
							placeholder={
								activeTab === 'colaborador'
									? 'Pesquisar por colaborador...'
									: 'Pesquisar por EPI...'
							}
						/>
					</div>

					<div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg shrink-0">
						<button
							onClick={() => {
								setActiveTab('colaborador');
								setCurrentPage(1);
								setSearchTerm('');
							}}
							className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
								activeTab === 'colaborador'
									? 'bg-white text-gray-900 shadow-sm'
									: 'text-gray-500 hover:text-gray-900'
							}`}
						>
							<User className="w-4 h-4" />
							Por Colaborador
						</button>
						<button
							onClick={() => {
								setActiveTab('epi');
								setCurrentPage(1);
								setSearchTerm('');
							}}
							className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
								activeTab === 'epi'
									? 'bg-white text-gray-900 shadow-sm'
									: 'text-gray-500 hover:text-gray-900'
							}`}
						>
							<Shield className="w-4 h-4" />
							Por EPI
						</button>
					</div>
				</div>

				{!isLoading && history.length === 0 ? (
					<EmptyState
						title={
							searchTerm
								? 'Nenhum registro encontrado'
								: 'Nenhum histórico'
						}
						description={
							searchTerm
								? 'Tente mudar os termos da pesquisa.'
								: 'Nenhuma entrega de EPI foi registrada nesta obra ainda.'
						}
						icon={<History className="w-8 h-8 text-gray-400" />}
					/>
				) : (
					<>
						<DataTable
							data={history.filter((item: any) => {
								const search = searchTerm.toLowerCase();
								if (activeTab === 'colaborador') {
									return item.collaboratorName
										.toLowerCase()
										.includes(search);
								} else {
									return item.epiName
										.toLowerCase()
										.includes(search);
								}
							})}
							columns={columns}
							detailsTitle="Detalhes da Entrega"
							renderDetails={(item) => (
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
									<DetailRow label="Nome do EPI" value={item.epiName} className="sm:col-span-2" />
									<DetailRow label="Colaborador" value={item.collaboratorName} />
									<DetailRow label="Quantidade Entregue" value={`${item.quantity} UN`} />
									<DetailRow label="Entregue Por" value={item.withdrawnByName} />
									<DetailRow label="Data da Entrega" value={format(new Date(item.withdrawalDate), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} />
								</div>
							)}
							keyExtractor={(item) => item.id}
						/>

						{history.length > 0 && (
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
