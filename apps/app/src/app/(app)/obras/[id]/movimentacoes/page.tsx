'use client';

import { use, useState } from 'react';
import {
	useMovimentacoes,
	Movimentacao,
} from '@/features/movimentacoes/hooks/useMovimentacoes';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable, ColumnDef, DetailRow } from '@/components/shared/DataTable';
import { Pagination } from '@/components/shared/Pagination';
import { EmptyState } from '@/components/shared/EmptyState';
import { Loader2, ArrowDownRight, ArrowUpRight, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MovimentacoesPageProps {
	params: Promise<{ id: string }>;
}

export default function MovimentacoesPage({ params }: MovimentacoesPageProps) {
	const resolvedParams = use(params);
	const siteId = resolvedParams.id;

	const { movimentacoes, isLoading } = useMovimentacoes(siteId);

	const [currentPage, setCurrentPage] = useState(1);

	const itemsPerPage = 8;
	const allItems = movimentacoes || [];

	const totalPages = Math.max(1, Math.ceil(allItems.length / itemsPerPage));
	const currentItems = allItems.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage,
	);

	const columns: ColumnDef<Movimentacao>[] = [
		{
			header: 'Tipo',
			cell: (item) => (
				<div className="flex items-center gap-3">
					{item.type === 'IN' ? (
						<div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
							<ArrowDownRight className="w-4 h-4 text-green-600" />
						</div>
					) : (
						<div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
							<ArrowUpRight className="w-4 h-4 text-red-600" />
						</div>
					)}
					<div className="flex flex-col">
						<span className="text-sm font-bold text-gray-900 leading-tight">
							{item.action}
						</span>
						<span className="text-xs text-gray-500 font-medium">
							{item.module}
						</span>
					</div>
				</div>
			),
		},
		{
			header: 'Item',
			accessorKey: 'item_name',
			className: 'font-semibold text-gray-800',
		},
		{
			header: 'Quantidade',
			cell: (item) => (
				<span
					className={`px-2.5 py-1 rounded-[5px] text-xs font-bold font-mono tracking-tight ${
						item.type === 'IN'
							? 'bg-green-50 text-green-700'
							: 'bg-red-50 text-red-700'
					}`}
				>
					{item.type === 'IN' ? '+' : '-'}{' '}
					{Math.abs(item.quantity) || 1} UN
				</span>
			),
		},
		{
			header: 'Responsável',
			cell: (item) => (
				<div className="flex flex-col gap-0.5">
					{item.collaborator_name ? (
						<span className="text-sm font-medium text-[#101828]">
							Colab: {item.collaborator_name}
						</span>
					) : (
						<span className="text-sm text-gray-500">N/A</span>
					)}
					{item.user_name && (
						<span className="text-xs text-gray-500">
							Por: {item.user_name}
						</span>
					)}
				</div>
			),
		},
		{
			header: 'Data / Hora',
			accessorKey: 'date',
			cell: (item) =>
				item.date
					? format(new Date(item.date), "dd/MM/yyyy 'às' HH:mm", {
							locale: ptBR,
						})
					: '-',
		},
	];

	if (isLoading) {
		return (
			<div className="flex flex-col items-center justify-center p-12 gap-3 h-full">
				<Loader2 className="w-8 h-8 animate-spin text-[#101828]" />
				<p className="text-gray-500">
					Carregando movimentações da obra...
				</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-6 relative h-full">
			<PageHeader
				title="Movimentações da Obra"
				description="Acompanhe todas as entradas e saídas de estoque (Ferramentas, EPIs, Almoxarifado e Equip. Alugados)."
			/>

			<div className="flex flex-col flex-1 bg-white rounded-xl border border-gray-200">
				{allItems.length === 0 ? (
					<div className="p-12">
						<EmptyState
							title="Nenhuma movimentação registrada"
							description="Nenhuma ação de entrada ou saída foi realizada ainda nesta obra."
							icon={
								<Activity className="w-8 h-8 text-gray-400" />
							}
						/>
					</div>
				) : (
					<>
						<DataTable
							data={currentItems}
							columns={columns}
							detailsTitle="Detalhes da Movimentação"
							renderDetails={(item: Movimentacao) => (
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
									<DetailRow label="Ação" value={item.action} />
									<DetailRow label="Módulo" value={item.module} />
									<DetailRow label="Item" value={item.item_name} className="sm:col-span-2" />
									<DetailRow label="Quantidade" value={`${item.type === 'IN' ? '+' : '-'}${Math.abs(item.quantity) || 1} UN`} />
									<DetailRow label="Colaborador Responsável" value={item.collaborator_name || 'N/A'} />
									<DetailRow label="Registrado por (Usuário)" value={item.user_name || 'N/A'} />
									<DetailRow label="Data / Hora" value={item.date ? format(new Date(item.date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : '-'} />
								</div>
							)}
							keyExtractor={(item: Movimentacao) => item.id}
						/>

						{allItems.length > 0 && (
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
