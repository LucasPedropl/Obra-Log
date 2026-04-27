'use client';

import { use, useState, useMemo } from 'react';
import {
	useToolHistory,
	ToolHistoryItem,
} from '@/features/ferramentas/hooks/useToolHistory';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable, ColumnDef } from '@/components/shared/DataTable';
import { EmptyState } from '@/components/shared/EmptyState';
import { TableSearch } from '@/components/shared/TableSearch';
import { Pagination } from '@/components/shared/Pagination';
import { Loader2, BookOpen, User, Wrench } from 'lucide-react';
import { format } from 'date-fns';

function StatusBadge({ status }: { status: string }) {
	const badges = {
		OPEN: {
			text: 'Em Uso',
			classes: 'bg-blue-100 text-blue-800 border-blue-300',
		},
		RETURNED: {
			text: 'Devolvido',
			classes: 'bg-green-100 text-green-800 border-green-300',
		},
		LOST: {
			text: 'Perdido',
			classes: 'bg-red-100 text-red-800 border-red-300',
		},
	};
	const badge = badges[status as keyof typeof badges] || {
		text: status,
		classes: 'bg-gray-100 text-gray-800 border-gray-300',
	};

	return (
		<span
			className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badge.classes}`}
		>
			{badge.text}
		</span>
	);
}

export default function FerramentasHistoricoPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const resolvedParams = use(params);
	const siteId = resolvedParams.id;

	const { history, isLoading, error } = useToolHistory(siteId);

	const [activeTab, setActiveTab] = useState<'tool' | 'collaborator'>('tool');
	const [searchTerm, setSearchTerm] = useState('');
	const [currentPage, setCurrentPage] = useState(1);

	const itemsPerPage = 12;

	// Generic columns for both views
	const baseColumns: ColumnDef<ToolHistoryItem>[] = [
		{
			header: 'Quantidade',
			accessorKey: 'quantity',
		},
		{
			header: 'Data Empréstimo',
			cell: (item) => (
				<span className="text-gray-600 text-sm">
					{format(new Date(item.loanDate), 'dd/MM/yyyy HH:mm')}
				</span>
			),
		},
		{
			header: 'Data Devolução',
			cell: (item) => (
				<span
					className={`text-sm ${!item.returnedDate ? 'text-gray-400 italic' : 'text-gray-600'}`}
				>
					{item.returnedDate
						? format(
								new Date(item.returnedDate),
								'dd/MM/yyyy HH:mm',
							)
						: '—'}
				</span>
			),
		},
		{
			header: 'Status',
			cell: (item) => <StatusBadge status={item.status} />,
		},
	];

	const toolColumns: ColumnDef<ToolHistoryItem>[] = [
		{
			header: 'Ferramenta',
			accessorKey: 'toolName',
			className: 'font-medium text-gray-900 bg-gray-50/50',
		},
		{
			header: 'Colaborador',
			accessorKey: 'collaboratorName',
			className: 'text-gray-700',
		},
		...baseColumns,
	];

	const collaboratorColumns: ColumnDef<ToolHistoryItem>[] = [
		{
			header: 'Colaborador',
			accessorKey: 'collaboratorName',
			className: 'font-medium text-gray-900 bg-gray-50/50',
		},
		{
			header: 'Ferramenta',
			accessorKey: 'toolName',
			className: 'text-gray-700',
		},
		...baseColumns,
	];

	// Filter
	const filteredHistory = history.filter((item) => {
		const terms = searchTerm.toLowerCase();
		return (
			item.toolName.toLowerCase().includes(terms) ||
			item.collaboratorName.toLowerCase().includes(terms) ||
			item.toolCode.toLowerCase().includes(terms)
		);
	});

	// To provide a real "grouped" feeling or organized view:
	// If sorting by tool, sort by toolName first, then date.
	// If by collab, sort by collaboratorName first.
	const sortedHistory = useMemo(() => {
		return [...filteredHistory].sort((a, b) => {
			if (activeTab === 'tool') {
				const cmp = a.toolName.localeCompare(b.toolName);
				if (cmp !== 0) return cmp;
				return (
					new Date(b.loanDate).getTime() -
					new Date(a.loanDate).getTime()
				);
			} else {
				const cmp = a.collaboratorName.localeCompare(
					b.collaboratorName,
				);
				if (cmp !== 0) return cmp;
				return (
					new Date(b.loanDate).getTime() -
					new Date(a.loanDate).getTime()
				);
			}
		});
	}, [filteredHistory, activeTab]);

	const totalPages = Math.max(
		1,
		Math.ceil(sortedHistory.length / itemsPerPage),
	);
	const currentItems = sortedHistory.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage,
	);

	if (isLoading) {
		return (
			<div className="flex flex-col items-center justify-center p-12 gap-3 h-full">
				<Loader2 className="w-8 h-8 animate-spin text-[#101828]" />
				<p className="text-gray-500">
					Carregando histórico de empréstimos...
				</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-6 relative">
			<PageHeader
				title="Histórico de Ferramentas"
				description="Histórico completo de empréstimos e devoluções."
			/>

			<div className="flex flex-col gap-5">
				{error ? (
					<div className="p-4 bg-red-50 text-red-700 rounded-md border border-red-200">
						Erro ao carregar histórico: {error}
					</div>
				) : history.length === 0 && !searchTerm ? (
					<EmptyState
						title="Sem histórico disponível"
						description="As ferramentas emprestadas e devolvidas aparecerão aqui."
						icon={<BookOpen className="w-8 h-8 text-gray-400" />}
					/>
				) : (
					<>
						{/* Tabs and Search Header */}
						<div className="flex flex-col md:flex-row items-center justify-between gap-4">
							<div className="flex items-center gap-1 bg-gray-100/80 p-1.5 rounded-lg border border-gray-200 shadow-sm w-full md:w-auto">
								<button
									onClick={() => {
										setActiveTab('tool');
										setCurrentPage(1);
									}}
									className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2 text-sm font-semibold transition-all rounded-md ${
										activeTab === 'tool'
											? 'bg-white text-gray-900 shadow-sm border border-gray-200/50'
											: 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
									}`}
								>
									<Wrench className="w-4 h-4" />
									Por Ferramenta
								</button>
								<button
									onClick={() => {
										setActiveTab('collaborator');
										setCurrentPage(1);
									}}
									className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2 text-sm font-semibold transition-all rounded-md ${
										activeTab === 'collaborator'
											? 'bg-white text-gray-900 shadow-sm border border-gray-200/50'
											: 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
									}`}
								>
									<User className="w-4 h-4" />
									Por Colaborador
								</button>
							</div>

							<div className="w-full md:w-80">
								<TableSearch
									value={searchTerm}
									onChange={(v) => {
										setSearchTerm(v);
										setCurrentPage(1);
									}}
									placeholder="Buscar ferramenta, colaborador..."
								/>
							</div>
						</div>

						{currentItems.length === 0 ? (
							<EmptyState
								title="Nenhum resultado encontrado"
								description="Seus filtros não retornaram nenhum registro do histórico."
								icon={
									<BookOpen className="w-8 h-8 text-gray-400" />
								}
							/>
						) : (
							<div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden flex flex-col gap-4">
								<div className="p-1 px-[2px] bg-gray-50 border-b border-gray-200">
									<div className="text-xs font-bold px-4 py-2 text-gray-500 uppercase tracking-wider">
										Visão de Histórico agrupada{' '}
										{activeTab === 'tool'
											? 'por Ferramenta (A-Z)'
											: 'por Nome do Colaborador (A-Z)'}
									</div>
								</div>

								<DataTable
									data={currentItems}
									columns={
										activeTab === 'tool'
											? toolColumns
											: collaboratorColumns
									}
									keyExtractor={(item) => item.id}
								/>
							</div>
						)}

						{currentItems.length > 0 && (
							<Pagination
								currentPage={currentPage}
								totalPages={totalPages}
								onPageChange={setCurrentPage}
								totalItems={sortedHistory.length}
								itemsPerPage={itemsPerPage}
							/>
						)}
					</>
				)}
			</div>
		</div>
	);
}
