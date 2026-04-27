'use client';

import { use, useState } from 'react';
import {
	useRentedEquipments,
	RentedEquipment,
} from '@/features/equip-alugados/hooks/useRentedEquipments';
import { AddRentedForm } from '@/features/equip-alugados/components/AddRentedForm';
import { ReturnRentedForm } from '@/features/equip-alugados/components/ReturnRentedForm';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable, ColumnDef } from '@/components/shared/DataTable';
import { EmptyState } from '@/components/shared/EmptyState';
import { Pagination } from '@/components/shared/Pagination';
import { Button } from '@/components/ui/button';
import { Loader2, Truck, Reply, Upload } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ImportModal } from '@/components/shared/ImportModal';
import { createClient } from '@/config/supabase';

interface RentedActivePageProps {
	params: Promise<{ id: string }>;
}

export default function RentedActivePage({ params }: RentedActivePageProps) {
	const resolvedParams = use(params);
	const siteId = resolvedParams.id;

	const { equipments, isLoading, refetch } = useRentedEquipments(siteId);

	const activeEquipments = equipments.filter((eq) => eq.status === 'ACTIVE');

	const [currentPage, setCurrentPage] = useState(1);
	const [isAddFormOpen, setIsAddFormOpen] = useState(false);
	const [isReturnFormOpen, setIsReturnFormOpen] = useState(false);
	const [isImportModalOpen, setIsImportModalOpen] = useState(false);
	const [selectedEquipment, setSelectedEquipment] =
		useState<RentedEquipment | null>(null);

	const itemsPerPage = 8;

	const totalPages = Math.max(
		1,
		Math.ceil(activeEquipments.length / itemsPerPage),
	);
	const currentEquipments = activeEquipments.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage,
	);

	const handleReturnClick = (eq: RentedEquipment) => {
		setSelectedEquipment(eq);
		setIsReturnFormOpen(true);
	};

	const handleImport = async (lines: string[]) => {
		const supabase = createClient();
		const result: any[] = [];
		for (const line of lines) {
			const parts = line.split(';');
			if (parts.length >= 3) {
				const [name, category, supplier, quantityStr] = parts;
				result.push({
					site_id: siteId,
					name: name.trim(),
					category: category.trim(),
					supplier: supplier.trim(),
					quantity: parseInt(quantityStr || '1', 10),
					entry_date: new Date().toISOString(),
					status: 'ACTIVE',
				});
			}
		}

		if (result.length > 0) {
			await supabase.from('rented_equipments').insert(result);
			refetch();
		}
	};

	const columns: ColumnDef<RentedEquipment>[] = [
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
			header: 'Quantidade',
			cell: (item) => `${item.quantity} UN`,
		},
		{
			header: 'Data/Hora de Chegada',
			accessorKey: 'entry_date',
			cell: (item) =>
				format(new Date(item.entry_date), "dd/MM/yyyy 'às' HH:mm", {
					locale: ptBR,
				}),
		},
		{
			header: 'Ações',
			cell: (item) => (
				<Button
					onClick={() => handleReturnClick(item)}
					size="sm"
					className="flex items-center gap-2 h-8 px-3 rounded-[5px] bg-[#101828] hover:bg-[#1b263b] text-white text-xs font-medium"
				>
					<Reply className="w-3.5 h-3.5" />
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
					Carregando equipamentos alugados...
				</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-6 relative">
			<PageHeader
				title="Equipamentos Alugados"
				description="Gerencie todos os equipamentos de locação da obra."
				onAdd={() => setIsAddFormOpen(true)}
				addLabel="Registrar Chegada"
			/>

			{isAddFormOpen && (
				<div
					className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 text-left inset-y-0 overflow-y-auto w-full h-[100dvh]"
					onClick={() => setIsAddFormOpen(false)}
				>
					<div
						onClick={(e) => e.stopPropagation()}
						className="w-full max-w-2xl my-auto"
					>
						<AddRentedForm
							siteId={siteId}
							onCancel={() => setIsAddFormOpen(false)}
							onSaved={() => {
								setIsAddFormOpen(false);
								refetch();
							}}
						/>
					</div>
				</div>
			)}

			{!isLoading && activeEquipments.length === 0 ? (
				<EmptyState
					title="Nenhum equipamento alugado"
					description="Comece registrando a chegada de um equipamento."
					icon={<Truck className="w-8 h-8 text-gray-400" />}
				/>
			) : (
				<>
					<DataTable
						data={currentEquipments}
						columns={columns}
						keyExtractor={(item) => item.id}
					/>

					{activeEquipments.length > 0 && (
						<Pagination
							currentPage={currentPage}
							totalPages={totalPages}
							onPageChange={setCurrentPage}
						/>
					)}
				</>
			)}

			<div className="flex items-center justify-end gap-3 w-full mt-4">
				<Button
					variant="outline"
					onClick={() => setIsImportModalOpen(true)}
					className="flex items-center gap-2 text-gray-700 bg-white border-gray-300 hover:bg-gray-50 rounded-[5px] shadow-sm"
				>
					<Upload className="h-4 w-4" />
					<span>Importar</span>
				</Button>
			</div>

			{isReturnFormOpen && selectedEquipment && (
				<div
					className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 text-left h-[100dvh]"
					onClick={() => setIsReturnFormOpen(false)}
				>
					<div
						onClick={(e) => e.stopPropagation()}
						className="w-full max-w-2xl"
					>
						<ReturnRentedForm
							siteId={siteId}
							equipment={selectedEquipment}
							onCancel={() => setIsReturnFormOpen(false)}
							onSaved={() => {
								setIsReturnFormOpen(false);
								refetch();
							}}
						/>
					</div>
				</div>
			)}

			<ImportModal
				isOpen={isImportModalOpen}
				onClose={() => setIsImportModalOpen(false)}
				title="Importar Equipamentos Alugados"
				description="Faça o upload do seu arquivo .txt (formato: Nome;Categoria;Fornecedor;Quantidade)"
				onImportLines={handleImport}
			/>
		</div>
	);
}
