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
import { Users, Upload, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ColaboradoresPage() {
	// Exemplo de estado com dados vazios para mostrar a EmptyState.
	// Altere para uma array com objetos para testar a tabela.
	const [colaboradores, setColaboradores] = useState<any[]>([]);
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 10;
	const totalPages = Math.ceil(colaboradores.length / itemsPerPage);

	return (
		<div className="w-full flex flex-col gap-6">
			<PageHeader
				title="Colaboradores"
				description="Gestão de equipes, jornada e permissões."
				onAdd={() => console.log('Adicionar colaborador')}
				addLabel="Cadastrar Colaborador"
			/>

			{colaboradores.length === 0 ? (
				<EmptyState
					title="Equipe Vazia"
					description="Você ainda não adicionou colaboradores. A tela aguarda o início do fluxo de RH."
					icon={<Users className="w-8 h-8 text-gray-400" />}
				/>
			) : (
				<div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Nome</TableHead>
								<TableHead>Email</TableHead>
								<TableHead>Cargo/Função</TableHead>
								<TableHead>Admissão</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{colaboradores.map((colab, i) => (
								<TableRow key={i}>
									<TableCell className="font-medium">
										{colab.nome}
									</TableCell>
									<TableCell>{colab.email}</TableCell>
									<TableCell>{colab.cargo}</TableCell>
									<TableCell>{colab.dataEntrada}</TableCell>
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
					onClick={() => console.log('Importar colaboradores')}
					className="flex items-center gap-2 text-gray-700 bg-white border-gray-300 hover:bg-gray-50"
				>
					<Upload className="h-4 w-4" />
					<span>Importar</span>
				</Button>

				{colaboradores.length > 0 && (
					<Button
						variant="outline"
						onClick={() => console.log('Exportar colaboradores')}
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
