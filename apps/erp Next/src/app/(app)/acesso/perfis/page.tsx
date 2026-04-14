'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { Pagination } from '@/components/shared/Pagination';
import { ShieldCheck, Upload, Download, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TableSearch } from '@/components/shared/TableSearch';
import { FilterPanel } from '@/components/shared/FilterPanel';
import { DataTable } from '@/components/shared/DataTable';

export default function PerfisDeAcessoPage() {
	const [perfis, setPerfis] = useState<any[]>([]);
	const [currentPage, setCurrentPage] = useState(1);
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [editingItem, setEditingItem] = useState<any>(null);
	const [searchTerm, setSearchTerm] = useState('');
	const [showFilters, setShowFilters] = useState(false);
	
	const [scopeFilter, setScopeFilter] = useState('');
	
	const isLoading = false;
	const itemsPerPage = 10;

	useEffect(() => {
		// load data
	}, []);

	const handleSearchChange = (val: string) => {
		setSearchTerm(val);
		setCurrentPage(1);
	};

	const filteredPerfis = perfis.filter((perfil) => {
		const searchLower = searchTerm.toLowerCase();
		const matchesSearch = !searchTerm || perfil.name?.toLowerCase().includes(searchLower);

		const matchesScope = scopeFilter ? perfil.scope === scopeFilter : true;

		return matchesSearch && matchesScope;
	});

	const totalPages = Math.max(
		1,
		Math.ceil(filteredPerfis.length / itemsPerPage),
	);

	const handleFormClose = () => {
		setIsFormOpen(false);
		setEditingItem(null);
	};

	const currentItems = filteredPerfis.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage,
	);

	return (
		<div className="w-full flex flex-col gap-6 relative">
			<PageHeader
				title="Perfis de Acesso"
				description="Gerencie os níveis de acesso e permissões do sistema"
				onAdd={() => setIsFormOpen(true)}
				addLabel="Novo Perfil"
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
							Formulário de perfil em construção...
						</div>
					</div>
				</div>
			)}

			{isLoading && perfis.length === 0 ? (
				<div className="flex justify-center p-12">
					<Loader2 className="w-8 h-8 animate-spin text-gray-400" />
				</div>
			) : perfis.length === 0 ? (
				<EmptyState
					title="Nenhum perfil encontrado"
					description="Cadastre seu primeiro perfil de acesso para começar a gerenciar permissões."
					icon={<ShieldCheck className="w-8 h-8 text-gray-400" />}
				/>
			) : (
				<div className="space-y-4">
					<div className="space-y-4">
						<TableSearch
							value={searchTerm}
							onChange={handleSearchChange}
							placeholder="Buscar perfis por nome..."
							onFilterClick={() => setShowFilters(!showFilters)}
						/>

						<FilterPanel
							isOpen={showFilters}
							onClose={() => setShowFilters(false)}
							onClear={() => {
								setScopeFilter('');
							}}
						>
							<div className="flex flex-col gap-1.5">
								<label className="text-sm font-medium text-gray-700">Escopo de Permissão</label>
								<select
									value={scopeFilter}
									onChange={(e) => setScopeFilter(e.target.value)}
									className="h-10 px-3 py-2 rounded-[5px] border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent w-full"
								>
									<option value="">Todos</option>
									<option value="ALL_SITES">Todas as Obras</option>
									<option value="SPECIFIC_SITES">Obras Específicas</option>
								</select>
							</div>
						</FilterPanel>
					</div>

					<div className="bg-white rounded-xl shadow-sm">
						<DataTable
							data={currentItems}
							columns={[
								{
									header: 'Nome do Perfil',
									accessorKey: 'name',
									className: 'font-medium',
								},
								{
									header: 'Escopo',
									cell: (item) => item.scope === 'ALL_SITES' ? 'Todas as Obras' : 'Obras Específicas'
								},
								{
									header: 'Permissões',
									cell: (item) => `${item.permissions?.length || 0} módulos`
								},
							]}
							keyExtractor={(item) => item.id}
							onEdit={(item) => setEditingItem(item)}
							onDelete={async (item) => {
								console.log('Deletar perfil', item.id);
							}}
							onDeleteBulk={async (items) => {
								console.log('Deletar perfis em lote', items.map(i => i.id));
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
					onClick={() => console.log('Importar perfis')}
					className="flex items-center gap-2 text-gray-700 bg-white border-gray-300 hover:bg-gray-50 rounded-[5px] shadow-sm"
				>
					<Upload className="h-4 w-4" />
					<span>Importar</span>
				</Button>

				{perfis.length > 0 && (
					<Button
						variant="outline"
						onClick={() => console.log('Exportar perfis')}
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