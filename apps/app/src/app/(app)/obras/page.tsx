'use client';

import { EmptyState } from '@/components/shared/EmptyState';
import { PageHeader } from '@/components/shared/PageHeader';
import { Can } from '@/components/shared/Can';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { Pagination } from '@/components/shared/Pagination';
import { Button } from '@/components/ui/button';
import { ConstructionSiteForm } from '@/features/obras/components/ConstructionSiteForm';
import { useConstructionSites } from '@/features/obras/hooks/useConstructionSites';
import { Download, Hammer, Loader2, Upload, X, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { exportToCsv } from '@/lib/exportUtils';

interface ConstructionSite {
	id: string;
	name: string;
	status?: string;
	created_at?: string;
	collaborators_count?: number;
	inventory_count?: number;
}

export default function ObrasPage() {
	const [obras, setObras] = useState<ConstructionSite[]>([]);
	const [currentPage, setCurrentPage] = useState(1);
	const [isFormOpen, setIsFormOpen] = useState(false);
	const { fetchConstructionSites, isLoading } = useConstructionSites();
	const router = useRouter();
	const itemsPerPage = 10;
	const totalPages = Math.ceil(obras.length / itemsPerPage);

	const loadObras = async () => {
		const data = await fetchConstructionSites();
		setObras(data as ConstructionSite[]);
	};

	useEffect(() => {
		loadObras();
	}, []);

	const handleFormClose = () => {
		setIsFormOpen(false);
		loadObras();
	};

	const handleExport = () => {
		exportToCsv(
			obras.map((o) => ({
				nome: o.name,
				colaboradores: o.collaborators_count ?? 0,
				insumos: o.inventory_count ?? 0,
			})),
			[
				{ key: 'nome', label: 'Nome' },
				{ key: 'colaboradores', label: 'Colaboradores' },
				{ key: 'insumos', label: 'Insumos' },
			],
			'obras',
		);
	};
	const currentObras = obras.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage,
	);

	return (
		<ProtectedRoute resource="obras">
			<div className="w-full flex flex-col gap-6 relative">
				<Can 
					on="obras" 
					perform="create"
					fallback={
						<PageHeader
							title="Obras"
							description="Gestão e acompanhamento das obras em execução."
						/>
					}
				>
					<PageHeader
						title="Obras"
						description="Gestão e acompanhamento das obras em execução."
						onAdd={() => setIsFormOpen(true)}
						addLabel="Cadastrar Obra"
					/>
				</Can>

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
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
							{currentObras.map((obra, i) => (
								<button
									onClick={() => router.push(`/obras/${obra.id || i}/visao-geral`)}
									key={obra.id || i}
									className="group flex flex-col bg-white border border-gray-300 hover:border-gray-900 hover:shadow-md transition-all text-left overflow-hidden rounded-[5px] block w-full"
								>
									<div className="p-6 flex items-start gap-5 flex-1 w-full">
										<div className="w-[60px] h-[60px] shrink-0 bg-[#F3F4F6] text-[#101828] font-bold text-xl flex items-center justify-center border border-gray-300 rounded-[5px]">
											{obra.name ? obra.name.substring(0, 2).toUpperCase() : 'OB'}
										</div>
										<div className="flex flex-col min-w-0 pt-1 flex-1">
											<h3 className="font-bold text-[#101828] text-[17px] truncate leading-tight group-hover:text-black">
												{obra.name}
											</h3>
											<div className="flex items-center gap-2 mt-1.5 flex-wrap">
												<span className="text-xs text-gray-400 font-mono">
													{obra.created_at
														? `Início: ${new Date(obra.created_at).toLocaleDateString('pt-BR')}`
														: 'Sem data'}
												</span>
											</div>
										</div>
									</div>

									<div className="h-[1px] bg-gray-200 w-full" />

									<div className="px-6 py-4 flex items-center justify-between bg-white group-hover:bg-gray-50 transition-colors w-full">
										<div className="flex items-center gap-8">
											<div className="flex flex-col">
												<span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Colaboradores</span>
												<span className="text-xl font-black text-[#101828] mt-0.5">{obra.collaborators_count || 0}</span>
											</div>
											<div className="flex flex-col">
												<span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Insumos / Itens</span>
												<span className="text-xl font-black text-[#101828] mt-0.5">{obra.inventory_count || 0}</span>
											</div>
										</div>
										<div className="w-8 h-8 flex items-center justify-center text-gray-400 group-hover:text-[#101828] transition-colors">
											<ArrowRight size={20} />
										</div>
									</div>
								</button>
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

				<div className="flex items-center justify-end gap-3 w-full mt-4">
					{obras.length > 0 && (
						<Button
							variant="outline"
							onClick={handleExport}
							className="flex items-center gap-2 text-gray-700 bg-white border-gray-300 hover:bg-gray-50 rounded-[5px] shadow-sm"
						>
							<Download className="h-4 w-4" />
							<span>Exportar</span>
						</Button>
					)}
				</div>
			</div>
		</ProtectedRoute>
	);
}
