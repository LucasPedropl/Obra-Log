'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { Pagination } from '@/components/shared/Pagination';
import { Users, Upload, Download, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TableSearch } from '@/components/shared/TableSearch';
import { FilterPanel } from '@/components/shared/FilterPanel';
import { DataTable } from '@/components/shared/DataTable';

export default function UsuariosPage() {
	const [usuarios, setUsuarios] = useState<any[]>([]);
	const [currentPage, setCurrentPage] = useState(1);
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [editingItem, setEditingItem] = useState<any>(null);
	const [searchTerm, setSearchTerm] = useState('');
	const [showFilters, setShowFilters] = useState(false);
	
	const [statusFilter, setStatusFilter] = useState('');
	
	const isLoading = false;
	const itemsPerPage = 10;

	useEffect(() => {
		// load data
	}, []);

	const handleSearchChange = (val: string) => {
		setSearchTerm(val);
		setCurrentPage(1);
	};

	const filteredUsuarios = usuarios.filter((user) => {
		const searchLower = searchTerm.toLowerCase();
		const matchesSearch = !searchTerm || user.full_name?.toLowerCase().includes(searchLower) || user.email?.toLowerCase().includes(searchLower);

		const matchesStatus = statusFilter ? user.status === statusFilter : true;

		return matchesSearch && matchesStatus;
	});

	const totalPages = Math.max(
		1,
		Math.ceil(filteredUsuarios.length / itemsPerPage),
	);

	const handleFormClose = () => {
		setIsFormOpen(false);
		setEditingItem(null);
	};

	const currentItems = filteredUsuarios.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage,
	);

	return (
		<div className="w-full flex flex-col gap-6 relative">
			<PageHeader
				title="Usuários"
				description="Gerencie os usuários do sistema e defina seus permissões"
				onAdd={() => setIsFormOpen(true)}
				addLabel="Novo Usuário"
			/>

			{(isFormOpen || editingItem) && (
				<div
					className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto"
					onClick={handleFormClose}
				>
					<div
						className="relative w-full max-w-2xl mt-8 md:mt-0 animate-in fade-in zoom-in duration-300 bg-white p-6 rounded-xl"
						onClick={(e) => e.stopPropagation()}
					>
						<button
							onClick={handleFormClose}
							className="absolute top-4 right-4 z-10 p-2 text-muted-foreground hover:bg-muted/30 rounded-full transition-colors"
						>
							<X size={20} />
						</button>
						<div className="text-sm text-gray-500">
							Formulário de usuário em construção...
						</div>
					</div>
				</div>
			)}

			{isLoading && usuarios.length === 0 ? (
				<div className="flex justify-center p-12">
					<Loader2 className="w-8 h-8 animate-spin text-gray-400" />
				</div>
			) : usuarios.length === 0 ? (
				<EmptyState
					title="Nenhum usuário encontrado"
					description="Cadastre seu primeiro usuário para liberar o acesso ao sistema."
					icon={<Users className="w-8 h-8 text-gray-400" />}
				/>
			) : (
				<div className="space-y-4">
					<div className="space-y-4">
						<TableSearch
							value={searchTerm}
							onChange={handleSearchChange}
							placeholder="Buscar usuários por nome ou email..."
							onFilterClick={() => setShowFilters(!showFilters)}
						/>

						<FilterPanel
							isOpen={showFilters}
							onClose={() => setShowFilters(false)}
							onClear={() => {
								setStatusFilter('');
							}}
						>
							<div className="flex flex-col gap-1.5">
								<label className="text-sm font-medium text-gray-700">Status</label>
								<select
									value={statusFilter}
									onChange={(e) => setStatusFilter(e.target.value)}
									className="h-10 px-3 py-2 rounded-[5px] border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent w-full"
								>
									<option value="">Todos</option>
									<option value="ACTIVE">Ativo</option>
									<option value="INACTIVE">Inativo</option>
								</select>
							</div>
						</FilterPanel>
					</div>

					<div className="bg-white rounded-xl shadow-sm">
						<DataTable
							data={currentItems}
							columns={[
								{
									header: 'Nome Completo',
									accessorKey: 'full_name',
									className: 'font-medium',
								},
								{
									header: 'E-mail',
									accessorKey: 'email',
								},
								{
									header: 'Perfil de Acesso',
									cell: (item) => item.profile?.name || '-'
								},
								{
									header: 'Status',
									cell: (item) => (
										<span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
											item.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
										}`}>
											{item.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
										</span>
									)
								},
							]}
							keyExtractor={(item) => item.id}
							onEdit={(item) => setEditingItem(item)}
							onDelete={async (item) => {
								console.log('Deletar usuario', item.id);
							}}
							onDeleteBulk={async (items) => {
								console.log('Deletar usuarios em lote', items.map(i => i.id));
							}}
						/>

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
				</div>
			)}

			{/* Botoes alinhados a direita sem borda arredondada na base */}
			<div className="flex items-center justify-end gap-3 w-full mt-4">
				<Button
					variant="outline"
					onClick={() => console.log('Importar usuarios')}
					className="flex items-center gap-2 text-gray-700 bg-white border-gray-300 hover:bg-gray-50 rounded-[5px] shadow-sm"
				>
					<Upload className="h-4 w-4" />
					<span>Importar</span>
				</Button>

				{usuarios.length > 0 && (
					<Button
						variant="outline"
						onClick={() => console.log('Exportar usuarios')}
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