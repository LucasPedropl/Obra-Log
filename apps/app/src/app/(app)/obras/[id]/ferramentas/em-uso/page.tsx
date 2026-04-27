'use client';

import { use, useState } from 'react';
import {
	useActiveLoans,
	ActiveLoanItem,
} from '@/features/ferramentas/hooks/useActiveLoans';
import { ReturnToolForm } from '@/features/ferramentas/components/ReturnToolForm';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable, ColumnDef } from '@/components/shared/DataTable';
import { EmptyState } from '@/components/shared/EmptyState';
import { TableSearch } from '@/components/shared/TableSearch';
import { Pagination } from '@/components/shared/Pagination';
import { Button } from '@/components/ui/button';
import { LogIn, Loader2, Wrench } from 'lucide-react';
import { format } from 'date-fns';

export default function FerramentasEmUsoPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const resolvedParams = use(params);
	const siteId = resolvedParams.id;

	const { loans, isLoading, error, refetch } = useActiveLoans(siteId);

	const [searchTerm, setSearchTerm] = useState('');
	const [currentPage, setCurrentPage] = useState(1);

	const [isReturnFormOpen, setIsReturnFormOpen] = useState(false);
	const [selectedLoan, setSelectedLoan] = useState<ActiveLoanItem | null>(
		null,
	);

	const itemsPerPage = 10;

	const filteredLoans = loans.filter((loan) => {
		const search = searchTerm.toLowerCase();
		return (
			loan.toolName.toLowerCase().includes(search) ||
			loan.toolCode.toLowerCase().includes(search) ||
			loan.collaboratorName.toLowerCase().includes(search)
		);
	});

	const totalPages = Math.max(
		1,
		Math.ceil(filteredLoans.length / itemsPerPage),
	);
	const currentLoans = filteredLoans.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage,
	);

	const handleReturnClick = (loan: ActiveLoanItem) => {
		setSelectedLoan(loan);
		setIsReturnFormOpen(true);
	};

	const columns: ColumnDef<ActiveLoanItem>[] = [
		{
			header: 'Ferramenta',
			accessorKey: 'toolName',
			className: 'font-medium',
		},
		{
			header: 'Colaborador',
			accessorKey: 'collaboratorName',
		},
		{
			header: 'Quantidade',
			accessorKey: 'quantity',
		},
		{
			header: 'Data de Empréstimo',
			cell: (item) => (
				<span className="text-gray-600 text-sm">
					{format(new Date(item.loanDate), 'dd/MM/yyyy HH:mm')}
				</span>
			),
		},
		{
			header: 'Ação',
			cell: (item) => (
				<Button
					onClick={() => handleReturnClick(item)}
					size="sm"
					className="flex items-center gap-2 h-8 px-3 rounded-[5px] bg-[#101828] hover:bg-[#1b263b] text-white text-xs font-medium"
				>
					<LogIn className="w-3.5 h-3.5" />
					Devolver
				</Button>
			),
		},
	];

	if (isLoading) {
		return (
			<div className="flex flex-col items-center justify-center p-12 gap-3 h-full">
				<Loader2 className="w-8 h-8 animate-spin text-[#101828]" />
				<p className="text-gray-500">
					Carregando ferramentas em uso...
				</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-6 relative">
			<PageHeader
				title="Ferramentas em Uso"
				description="Monitore e registre a devolução de ferramentas que estão atualmente emprestadas."
			/>

			{isReturnFormOpen && selectedLoan && (
				<div
					className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
					onClick={() => setIsReturnFormOpen(false)}
				>
					<div onClick={(e) => e.stopPropagation()}>
						<ReturnToolForm
							loanId={selectedLoan.id}
							toolName={selectedLoan.toolName}
							collaboratorName={selectedLoan.collaboratorName}
							loanQuantity={selectedLoan.quantity}
							onCancel={() => setIsReturnFormOpen(false)}
							onSaved={() => {
								setIsReturnFormOpen(false);
								refetch();
							}}
						/>
					</div>
				</div>
			)}

			<div className="flex flex-col gap-5">
				{error ? (
					<div className="p-4 bg-red-50 text-red-700 rounded-md border border-red-200">
						Erro ao carregar empréstimos: {error}
					</div>
				) : filteredLoans.length === 0 && !searchTerm ? (
					<EmptyState
						title="Nenhuma ferramenta emprestada"
						description="Neste momento, não há histórico ativo de empréstimos em aberto."
						icon={<Wrench className="w-8 h-8 text-gray-400" />}
					/>
				) : (
					<>
						<TableSearch
							value={searchTerm}
							onChange={(v) => {
								setSearchTerm(v);
								setCurrentPage(1);
							}}
							placeholder="Pesquisar por ferramenta ou colaborador..."
						/>

						{filteredLoans.length === 0 ? (
							<EmptyState
								title="Nenhum resultado encontrado"
								description="Tente mudar os termos da pesquisa."
								icon={
									<Wrench className="w-8 h-8 text-gray-400" />
								}
							/>
						) : (
							<DataTable
								data={currentLoans}
								columns={columns}
								keyExtractor={(item) => item.id}
							/>
						)}

						{filteredLoans.length > 0 && (
							<Pagination
								currentPage={currentPage}
								totalPages={totalPages}
								onPageChange={setCurrentPage}
								totalItems={filteredLoans.length}
								itemsPerPage={itemsPerPage}
							/>
						)}
					</>
				)}
			</div>
		</div>
	);
}
