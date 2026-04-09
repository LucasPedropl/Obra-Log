'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { Pagination } from '@/components/shared/Pagination';
import { PackageOpen, Upload, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function InsumosPage() {
	const [insumos, setInsumos] = useState<any[]>([]);
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 10;
	const totalPages = Math.ceil(insumos.length / itemsPerPage);

	return (
		<div className="w-full flex flex-col gap-6">
			<PageHeader
				title="Insumos"
				description="Gerenciamento de materiais, estoque e requisições."
				onAdd={() => console.log('Adicionar insumo')}
				addLabel="Cadastrar Insumo"
			/>

			{insumos.length === 0 ? (
				<EmptyState
					title="Nenhum Insumo Cadasrado"
					description="Este módulo de almoxarifado global será construído e habitado pelos próximos cadastros e deploys."
					icon={<PackageOpen className="w-8 h-8 text-gray-400" />}
				/>
			) : (
				<div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Código</TableHead>
								<TableHead>Descrição</TableHead>
								<TableHead>Unidade</TableHead>
								<TableHead>Estoque</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{insumos.map((item, i) => (
								<TableRow key={i}>
									<TableCell className="font-medium">
										{item.codigo}
									</TableCell>
									<TableCell>{item.descricao}</TableCell>
									<TableCell>{item.unidade}</TableCell>
									<TableCell>{item.estoque}</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>

					{totalPages > 1 && (
						<div className="border-t">
							<Pagination
								currentPage={currentPage}
								totalPages={totalPages}
								onPageChange={setCurrentPage}
							/>
						</div>
					)}
				</div>
			)}

			<div className="flex items-center gap-3">
				<Button
					variant="outline"
					onClick={() => console.log('Importar insumos')}
					className="flex items-center gap-2 text-gray-700 bg-white border-gray-300 hover:bg-gray-50"
				>
					<Upload className="h-4 w-4" />
					<span>Importar</span>
				</Button>

				{insumos.length > 0 && (
					<Button
						variant="outline"
						onClick={() => console.log('Exportar insumos')}
						className="flex items-center gap-2 text-gray-700 bg-white border-gray-300 hover:bg-gray-50"
					>
						<Download className="h-4 w-4" />
						<span>Exportar</span>
					</Button>
				)}
			</div>
		</div>
	);
}
