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
import { Hammer, Upload, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ObrasPage() {
	const [obras, setObras] = useState<any[]>([]);
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 10;
	const totalPages = Math.ceil(obras.length / itemsPerPage);

	return (
		<div className="w-full flex flex-col gap-6">
			<PageHeader
				title="Obras"
				description="Gestão e acompanhamento das obras em execução."
				onAdd={() => console.log('Adicionar obra')}
				addLabel="Cadastrar Obra"
			/>

			{obras.length === 0 ? (
				<EmptyState
					title="Nenhuma obra encontrada"
					description="Comece adicionando sua primeira obra para visualizar os dados de acompanhamento."
					icon={<Hammer className="w-8 h-8 text-gray-400" />}
				/>
			) : (
				<div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Identificador</TableHead>
								<TableHead>Nome da Obra</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Data Início</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{obras.map((obra, i) => (
								<TableRow key={i}>
									<TableCell className="font-medium">
										{obra.id}
									</TableCell>
									<TableCell>{obra.nome}</TableCell>
									<TableCell>{obra.status}</TableCell>
									<TableCell>{obra.inicio}</TableCell>
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
					onClick={() => console.log('Importar obras')}
					className="flex items-center gap-2 text-gray-700 bg-white border-gray-300 hover:bg-gray-50"
				>
					<Upload className="h-4 w-4" />
					<span>Importar</span>
				</Button>

				{obras.length > 0 && (
					<Button
						variant="outline"
						onClick={() => console.log('Exportar obras')}
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
