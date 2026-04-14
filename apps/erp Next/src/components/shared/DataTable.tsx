import React, { useState, useRef, useEffect } from 'react';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Trash2, Edit2, CheckSquare, X, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ColumnDef<T> {
	header: string;
	accessorKey?: keyof T;
	cell?: (item: T, index: number) => React.ReactNode;
	className?: string;
}

interface DataTableProps<T> {
	data: T[];
	columns: ColumnDef<T>[];
	keyExtractor: (item: T) => string;
	onEdit?: (item: T) => void;
	onDelete?: (item: T) => void;
	onDeleteBulk?: (items: T[]) => void;
	renderDetails?: (item: T) => React.ReactNode;
}

export function DataTable<T extends Record<string, any>>({
	data,
	columns,
	keyExtractor,
	onEdit,
	onDelete,
	onDeleteBulk,
	renderDetails,
}: DataTableProps<T>) {
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [detailItem, setDetailItem] = useState<T | null>(null);
	const [itemToDelete, setItemToDelete] = useState<T | null>(null);
	const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);

	const isMultiSelectMode = selectedIds.size > 0;

	const toggleSelection = (id: string) => {
		const newSet = new Set(selectedIds);
		if (newSet.has(id)) {
			newSet.delete(id);
		} else {
			newSet.add(id);
		}
		setSelectedIds(newSet);
	};

	const clearSelection = () => setSelectedIds(new Set());

	const handleBulkDelete = () => {
		setBulkDeleteConfirm(true);
	};

	const confirmBulkDelete = () => {
		if (onDeleteBulk) {
			const itemsToDelete = data.filter((item) =>
				selectedIds.has(keyExtractor(item)),
			);
			onDeleteBulk(itemsToDelete);
			clearSelection();
			setBulkDeleteConfirm(false);
		}
	};

	return (
		<div className="w-full flex flex-col gap-4">
			<div className="bg-white rounded-xl shadow-sm">
				<Table>
					<TableHeader>
						<TableRow>
							{columns.map((col, i) => (
								<TableHead key={i} className={col.className}>
									{col.header}
								</TableHead>
							))}
						</TableRow>
					</TableHeader>
					<TableBody>
						{data.map((item, i) => {
							const id = keyExtractor(item);
							const isSelected = selectedIds.has(id);

							return (
								<DataTableRow
									key={id}
									item={item}
									isSelected={isSelected}
									isMultiSelectMode={isMultiSelectMode}
									onToggleSelect={() => toggleSelection(id)}
									onOpenDetails={() => setDetailItem(item)}
								>
									{columns.map((col, colIdx) => (
										<TableCell
											key={colIdx}
											className={cn(
												col.className,
												isSelected && 'bg-blue-50/50',
												colIdx === 0 && 'relative pl-8', // Padding to accommodate the blue bar
											)}
										>
											{/* Visual selection indicator inside the first cell */}
											{isSelected && colIdx === 0 && (
												<div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-r-[2px]" />
											)}
											{col.cell
												? col.cell(item, i)
												: col.accessorKey
													? (item[
															col.accessorKey
														] as React.ReactNode)
													: null}
										</TableCell>
									))}
								</DataTableRow>
							);
						})}
					</TableBody>
				</Table>
			</div>

			{isMultiSelectMode && (
				<div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center justify-between gap-6 bg-[#101828] border border-[#101828] text-white px-6 py-3 rounded-[5px] shadow-[0_8px_30px_rgb(0,0,0,0.2)] animate-in fade-in slide-in-from-bottom-8">
					<span className="text-sm font-medium whitespace-nowrap">
						{selectedIds.size} item(s) selecionado(s)
					</span>
					<div className="flex items-center gap-3">
						<Button
							variant="ghost"
							size="sm"
							onClick={clearSelection}
							className="h-9 rounded-[5px] text-gray-300 hover:text-white hover:bg-white/10"
						>
							<X className="w-4 h-4 mr-2" /> Cancelar
						</Button>
						{onDeleteBulk && (
							<Button
								size="sm"
								onClick={handleBulkDelete}
								className="h-9 rounded-[5px] px-5 font-semibold bg-red-600 hover:bg-red-700 text-white border-none"
							>
								<Trash2 className="w-4 h-4 mr-2" /> Excluir
							</Button>
						)}
					</div>
				</div>
			)}

			{/* Detail Modal */}
			{detailItem && (
				<div
					className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
					onClick={() => setDetailItem(null)}
				>
					<div
						className="relative w-full max-w-lg bg-white rounded-xl shadow-xl p-6 mt-8 md:mt-0 animate-in fade-in zoom-in duration-200"
						onClick={(e) => e.stopPropagation()}
					>
						<button
							onClick={() => setDetailItem(null)}
							className="absolute top-4 right-4 p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors"
						>
							<X className="w-5 h-5" />
						</button>

						<div className="flex items-center gap-3 mb-6 border-b pb-4">
							<div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
								<Info className="w-5 h-5" />
							</div>
							<h2 className="text-xl font-semibold text-gray-800">
								Detalhes do Item
							</h2>
						</div>

						<div className="space-y-4 mb-8 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
							{renderDetails ? (
								renderDetails(detailItem)
							) : (
								<DefaultDetailsView item={detailItem} />
							)}
						</div>

						<div className="flex flex-wrap gap-3 pt-4 border-t items-center justify-end">
							<Button
								onClick={() => {
									toggleSelection(keyExtractor(detailItem));
									setDetailItem(null);
								}}
								className="flex items-center gap-2 rounded-[5px] bg-blue-600 hover:bg-blue-700 text-white"
							>
								<CheckSquare className="w-4 h-4" />
								Selecionar
							</Button>

							{onEdit && (
								<Button
									onClick={() => {
										onEdit(detailItem);
										setDetailItem(null);
									}}
									className="flex items-center gap-2 rounded-[5px] bg-yellow-500 hover:bg-yellow-600 text-white"
								>
									<Edit2 className="w-4 h-4" />
									Editar
								</Button>
							)}

							{onDelete && (
								<Button
									onClick={() => {
										setItemToDelete(detailItem);
										setDetailItem(null);
									}}
									className="flex items-center gap-2 rounded-[5px] bg-red-600 hover:bg-red-700 text-white"
								>
									<Trash2 className="w-4 h-4" />
									Excluir
								</Button>
							)}
						</div>
					</div>
				</div>
			)}

			{/* Confirm Single Delete Modal */}
			{itemToDelete && (
				<div
					className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
					onClick={() => setItemToDelete(null)}
				>
					<div
						className="relative w-full max-w-sm bg-white rounded-xl shadow-xl p-6 animate-in fade-in zoom-in duration-200"
						onClick={(e) => e.stopPropagation()}
					>
						<div className="flex flex-col items-center text-center space-y-4">
							<div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-2">
								<Trash2 className="w-6 h-6" />
							</div>
							<h2 className="text-xl font-semibold text-gray-800">
								Excluir Item
							</h2>
							<p className="text-sm text-gray-500">
								Tem certeza que deseja excluir este item? Esta
								ação não poderá ser desfeita.
							</p>
						</div>

						<div className="flex gap-3 justify-center mt-8">
							<Button
								variant="outline"
								onClick={() => setItemToDelete(null)}
								className="w-full rounded-[5px] border-gray-300 text-gray-700 hover:bg-gray-50"
							>
								Cancelar
							</Button>
							<Button
								onClick={() => {
									if (onDelete && itemToDelete) {
										onDelete(itemToDelete);
										setItemToDelete(null);
									}
								}}
								className="w-full rounded-[5px] bg-red-600 hover:bg-red-700 text-white"
							>
								Excluir
							</Button>
						</div>
					</div>
				</div>
			)}

			{/* Confirm Bulk Delete Modal */}
			{bulkDeleteConfirm && (
				<div
					className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
					onClick={() => setBulkDeleteConfirm(false)}
				>
					<div
						className="relative w-full max-w-sm bg-white rounded-xl shadow-xl p-6 animate-in fade-in zoom-in duration-200"
						onClick={(e) => e.stopPropagation()}
					>
						<div className="flex flex-col items-center text-center space-y-4">
							<div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-2">
								<Trash2 className="w-6 h-6" />
							</div>
							<h2 className="text-xl font-semibold text-gray-800">
								Excluir {selectedIds.size} Itens
							</h2>
							<p className="text-sm text-gray-500">
								Tem certeza que deseja excluir os itens
								selecionados? Esta ação não poderá ser desfeita.
							</p>
						</div>

						<div className="flex gap-3 justify-center mt-8">
							<Button
								variant="outline"
								onClick={() => setBulkDeleteConfirm(false)}
								className="w-full rounded-[5px] border-gray-300 text-gray-700 hover:bg-gray-50"
							>
								Cancelar
							</Button>
							<Button
								onClick={confirmBulkDelete}
								className="w-full rounded-[5px] bg-red-600 hover:bg-red-700 text-white"
							>
								Excluir Todos
							</Button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

interface DataTableRowProps<T> {
	item: T;
	isSelected: boolean;
	isMultiSelectMode: boolean;
	onToggleSelect: () => void;
	onOpenDetails: () => void;
	children: React.ReactNode;
}

function DataTableRow<T>({
	isSelected,
	isMultiSelectMode,
	onToggleSelect,
	onOpenDetails,
	children,
}: DataTableRowProps<T>) {
	const pressTimer = useRef<NodeJS.Timeout | null>(null);

	const handleContextMenu = (e: React.MouseEvent) => {
		e.preventDefault();
		onToggleSelect();
	};

	const handleClick = () => {
		if (isMultiSelectMode) {
			onToggleSelect();
		} else {
			onOpenDetails();
		}
	};

	const handleTouchStart = () => {
		pressTimer.current = setTimeout(() => {
			onToggleSelect();
			pressTimer.current = null;
		}, 500); // 500ms long press
	};

	const handleTouchEnd = () => {
		if (pressTimer.current) {
			clearTimeout(pressTimer.current);
			pressTimer.current = null;
		}
	};

	return (
		<TableRow
			className={cn(
				'cursor-pointer select-none relative transition-colors',
				isSelected &&
					'bg-blue-50/50 hover:bg-blue-50/70 border-b-blue-100',
			)}
			onClick={handleClick}
			onContextMenu={handleContextMenu}
			onTouchStart={handleTouchStart}
			onTouchEnd={handleTouchEnd}
			onTouchMove={handleTouchEnd}
			data-state={isSelected ? 'selected' : undefined}
		>
			{children}
		</TableRow>
	);
}

function DefaultDetailsView({ item }: { item: Record<string, any> }) {
	// Filter out complex objects/arrays and internal IDs starting with underscore
	const entries = Object.entries(item).filter(
		([key, val]) =>
			val !== null &&
			typeof val !== 'object' &&
			!key.startsWith('_') &&
			key !== 'id',
	);

	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
			{entries.map(([key, value]) => (
				<div key={key} className="flex flex-col overflow-hidden">
					<span
						className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1 truncate"
						title={key.replace(/_/g, ' ')}
					>
						{key.replace(/_/g, ' ')}
					</span>
					<div
						className="text-sm text-gray-900 font-medium bg-gray-50 px-3 py-2 rounded-[5px] border border-gray-100 break-all whitespace-normal"
						title={String(value)}
					>
						{String(value)}
					</div>
				</div>
			))}
		</div>
	);
}
