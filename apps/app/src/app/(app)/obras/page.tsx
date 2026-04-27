'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { Pagination } from '@/components/shared/Pagination';
import { Hammer, Upload, Download, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConstructionSiteForm } from '@/features/obras/components/ConstructionSiteForm';
import { useConstructionSites } from '@/features/obras/hooks/useConstructionSites';

export default function ObrasPage() {
	const [obras, setObras] = useState<any[]>([]);
	const [currentPage, setCurrentPage] = useState(1);
	const [isFormOpen, setIsFormOpen] = useState(false);
	const { fetchConstructionSites, isLoading } = useConstructionSites();
	const itemsPerPage = 10;
	const totalPages = Math.ceil(obras.length / itemsPerPage);

	const loadObras = async () => {
		const data = await fetchConstructionSites();
		setObras(data);
	};

	useEffect(() => {
		loadObras();
	}, []);

	const handleFormClose = () => {
		setIsFormOpen(false);
		loadObras();
	};

	const currentObras = obras.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage,
	);

	return (
		<div className="w-full flex flex-col gap-6 relative">
			<PageHeader
				title="Obras"
				description="Gestão e acompanhamento das obras em execução."
				onAdd={() => setIsFormOpen(true)}
				addLabel="Cadastrar Obra"
			/>

			{isFormOpen && (
				<div
					className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto"
					onClick={() => setIsFormOpen(false)}
				>
					<div
						className="relative w-full max-w-lg mt-8 md:mt-0 animate-in fade-in zoom-in duration-300"
						onClick={(e) => e.stopPropagation()}
					>
						<button
							onClick={() => setIsFormOpen(false)}
							className="absolute top-4 right-4 z-10 p-2 text-muted-foreground hover:bg-muted/30 rounded-full transition-colors"
						>
							<X size={20} />
						</button>
						<ConstructionSiteForm onCancel={handleFormClose} />
					</div>
				</div>
			)}

			{isLoading && obras.length === 0 ? (
				<div className="flex justify-center p-12">
					<Loader2 className="w-8 h-8 animate-spin text-gray-400" />
				</div>
			) : obras.length === 0 ? (
				<EmptyState
					title="Nenhuma obra encontrada"
					description="Comece adicionando sua primeira obra para visualizar os dados de acompanhamento."
					icon={<Hammer className="w-8 h-8 text-gray-400" />}
				/>
			) : (
				<div className="flex flex-col gap-6">
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
						{currentObras.map((obra, i) => (
							<Link
								href={`/obras/${obra.id || i}/visao-geral`}
								key={obra.id || i}
								className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer block"
							>
								<div className="flex justify-between items-start">
									<h3 className="font-semibold text-lg text-gray-900 line-clamp-2">
										{obra.name}
									</h3>
									<span
										className={`px-2.5 py-1 rounded-full text-xs font-medium border ${obra.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-700 border-gray-200'}`}
									>
										{obra.status === 'active'
											? 'Ativa'
											: obra.status}
									</span>
								</div>

								<div className="text-sm text-gray-500 mt-auto">
									<p>
										Data de início:{' '}
										<span className="font-medium text-gray-700">
											{obra.created_at
												? new Date(
														obra.created_at,
													).toLocaleDateString(
														'pt-BR',
													)
												: 'N/A'}
										</span>
									</p>
								</div>
							</Link>
						))}
					</div>

					{totalPages > 1 && (
						<div className="flex justify-center pt-4">
							<Pagination
								currentPage={currentPage}
								totalPages={totalPages}
								onPageChange={setCurrentPage}
							/>
						</div>
					)}
				</div>
			)}

			{/* Botoes alinhados a direita sem borda arredondada na base */}
			<div className="flex items-center justify-end gap-3 w-full mt-4">
				<Button
					variant="outline"
					onClick={() => console.log('Importar obras')}
					className="flex items-center gap-2 text-gray-700 bg-white border-gray-300 hover:bg-gray-50 rounded-[5px] shadow-sm"
				>
					<Upload className="h-4 w-4" />
					<span>Importar</span>
				</Button>

				{obras.length > 0 && (
					<Button
						variant="outline"
						onClick={() => console.log('Exportar obras')}
						className="flex items-center gap-2 text-gray-700 bg-white border-gray-300 hover:bg-gray-50 rounded-[5px] shadow-sm"
					>
						<Download className="h-4 w-4" />
						<span>Exportar</span>
					</Button>
				)}
			</div>
		</div>
	);
}
