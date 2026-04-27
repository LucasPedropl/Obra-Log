import React, { useState } from 'react';
import { Search, X, Trash2, Pencil, AlertCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toaster';

interface ManageableItem {
	id: string;
	title: string;
	subtitle?: string;
	isInUse?: boolean; // Mock data for now: if used by an insumo, cannot delete
}

interface ManageSelectsModalProps {
	title: string;
	description: string;
	items: ManageableItem[];
	onClose: () => void;
	onDelete: (ids: string[]) => Promise<void>;
	onEdit: (id: string) => void;
}

export function ManageSelectsModal({
	title,
	description,
	items,
	onClose,
	onDelete,
	onEdit,
	onImport,
}: ManageSelectsModalProps & { onImport?: () => void }) {
	const { addToast } = useToast();
	const [searchTerm, setSearchTerm] = useState('');
	const [selectedIds, setSelectedIds] = useState<string[]>([]);
	const [deleteConfirmSingle, setDeleteConfirmSingle] = useState<
		string | null
	>(null);
	const [deleteConfirmBulk, setDeleteConfirmBulk] = useState(false);
	const [isProcessing, setIsProcessing] = useState(false);

	const filteredItems = items.filter(
		(item) =>
			item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
			(item.subtitle &&
				item.subtitle.toLowerCase().includes(searchTerm.toLowerCase())),
	);

	const toggleSelection = (id: string, isInUse: boolean = false) => {
		if (isInUse) return;
		setSelectedIds((prev) =>
			prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
		);
	};

	const selectAll = () => {
		const availableIds = filteredItems
			.filter((i) => !i.isInUse)
			.map((i) => i.id);
		if (selectedIds.length === availableIds.length) {
			setSelectedIds([]);
		} else {
			setSelectedIds(availableIds);
		}
	};

	const handleDeleteConfirm = async () => {
		setIsProcessing(true);
		try {
			if (deleteConfirmSingle) {
				await onDelete([deleteConfirmSingle]);
				setSelectedIds((prev) =>
					prev.filter((id) => id !== deleteConfirmSingle),
				);
			} else if (deleteConfirmBulk) {
				await onDelete(selectedIds);
				setSelectedIds([]);
			}
			addToast('Item(ns) excluído(s) com sucesso!', 'success');
		} catch (error) {
			addToast('Erro ao excluir item. Pode estar em uso.', 'error');
		} finally {
			setIsProcessing(false);
			setDeleteConfirmSingle(null);
			setDeleteConfirmBulk(false);
		}
	};

	return (
		<div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
			<div className="bg-white text-gray-900 rounded-xl shadow-2xl border border-gray-200 w-[600px] h-[600px] max-w-full max-h-full flex flex-col relative overflow-hidden">
				{/* Top Header */}
				<div className="p-6 border-b border-gray-200 flex justify-between items-start shrink-0">
					<div>
						<h2 className="text-xl font-bold text-gray-900 tracking-tight">
							{title}
						</h2>
						<p className="text-sm text-gray-500 mt-1">
							{description}
						</p>
					</div>
					<button
						onClick={onClose}
						className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-[5px] transition-colors p-1.5"
					>
						<X size={20} />
					</button>
				</div>

				{/* Toolbar / Search */}
				<div className="px-6 pt-5 pb-3 flex flex-col sm:flex-row gap-3 sm:items-center justify-between bg-gray-50/50 border-b border-gray-100">
					<div className="relative flex-1">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
						<input
							type="text"
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							placeholder="Pesquisar..."
							className="w-full bg-white border border-gray-300 rounded-[5px] py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#101828]/20 focus:border-[#101828] transition-all"
						/>
					</div>
					<div className="flex items-center gap-2">
						{onImport && (
							<Button
								variant="outline"
								size="sm"
								onClick={onImport}
								className="text-xs h-9 bg-white"
							>
								Importar TXT
							</Button>
						)}
						<Button
							variant="outline"
							size="sm"
							onClick={selectAll}
							className="text-xs h-9 bg-white"
						>
							{selectedIds.length > 0 &&
							selectedIds.length ===
								filteredItems.filter((i) => !i.isInUse).length
								? 'Desmarcar Todos'
								: 'Selecionar Visíveis'}
						</Button>
						{selectedIds.length > 0 && (
							<Button
								variant="default"
								size="sm"
								onClick={() => setDeleteConfirmBulk(true)}
								className="text-xs h-9 bg-red-600 hover:bg-red-700 text-white"
							>
								Excluir ({selectedIds.length})
							</Button>
						)}
					</div>
				</div>

				{/* List */}
				<div className="flex-1 overflow-y-auto p-2 bg-gray-50/50">
					<div className="flex flex-col gap-1 px-4 py-2">
						{filteredItems.map((item) => {
							const isSelected = selectedIds.includes(item.id);
							return (
								<div
									key={item.id}
									className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
										isSelected
											? 'bg-blue-50/50 border-blue-200'
											: 'bg-white border-gray-200 hover:border-gray-300'
									} ${item.isInUse ? 'opacity-70' : 'cursor-pointer'}`}
									onClick={() =>
										toggleSelection(item.id, item.isInUse)
									}
								>
									<div className="flex items-center gap-3">
										<div
											className={`flex items-center justify-center w-4 h-4 rounded border ${
												isSelected
													? 'bg-[#101828] border-[#101828] text-white'
													: item.isInUse
														? 'bg-gray-100 border-gray-300'
														: 'bg-white border-gray-300'
											}`}
										>
											{isSelected && (
												<Check
													size={12}
													strokeWidth={3}
												/>
											)}
										</div>
										<div className="flex flex-col">
											<span
												className={`text-sm font-semibold ${item.isInUse ? 'text-gray-600' : 'text-gray-900'}`}
											>
												{item.title}
											</span>
											{item.subtitle && (
												<span className="text-xs text-gray-500">
													{item.subtitle}
												</span>
											)}
										</div>
									</div>
									<div className="flex items-center gap-1">
										{item.isInUse && (
											<span className="text-[10px] font-medium uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 mr-2">
												Em Uso
											</span>
										)}
										<button
											onClick={(e) => {
												e.stopPropagation();
												onEdit(item.id);
											}}
											className="p-1.5 text-gray-400 hover:text-[#101828] hover:bg-gray-100 rounded-[5px] transition-colors"
											title="Editar"
										>
											<Pencil size={16} />
										</button>
										<button
											onClick={(e) => {
												e.stopPropagation();
												if (item.isInUse) {
													addToast(
														'Este item não pode ser excluído pois está em uso.',
														'error',
													);
													return;
												}
												setDeleteConfirmSingle(item.id);
											}}
											disabled={item.isInUse}
											className={`p-1.5 rounded-[5px] transition-colors ${
												item.isInUse
													? 'text-gray-300 cursor-not-allowed'
													: 'text-gray-400 hover:text-red-600 hover:bg-red-50'
											}`}
											title="Excluir"
										>
											<Trash2 size={16} />
										</button>
									</div>
								</div>
							);
						})}
						{filteredItems.length === 0 && (
							<div className="text-center py-10 text-gray-500 text-sm">
								Nenhum item encontrado.
							</div>
						)}
					</div>
				</div>

				{/* Footer */}
				<div className="p-4 border-t border-gray-200 bg-white flex justify-end shrink-0">
					<Button
						onClick={onClose}
						className="bg-[#101828] hover:bg-[#1b263b] text-white"
					>
						Concluir
					</Button>
				</div>

				{/* Confirmation Popups overlay */}
				{(deleteConfirmSingle || deleteConfirmBulk) && (
					<div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-sm p-6">
						<div className="bg-white rounded-xl shadow-xl w-full max-w-[400px] p-6 flex flex-col items-center text-center animate-in fade-in zoom-in duration-200">
							<div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-4">
								<AlertCircle size={24} />
							</div>
							<h3 className="text-lg font-bold text-gray-900 mb-2">
								Confirmar Exclusão
							</h3>
							<p className="text-sm text-gray-500 mb-6">
								Tem certeza que deseja excluir{' '}
								{deleteConfirmBulk
									? 'os itens selecionados'
									: 'este item'}
								? Esta ação não pode ser desfeita. (Itens em uso
								não serão afetados).
							</p>
							<div className="flex w-full gap-3">
								<Button
									variant="outline"
									onClick={() => {
										setDeleteConfirmSingle(null);
										setDeleteConfirmBulk(false);
									}}
									className="flex-1"
									disabled={isProcessing}
								>
									Cancelar
								</Button>
								<Button
									variant="default"
									onClick={handleDeleteConfirm}
									className="bg-red-600 hover:bg-red-700 text-white flex-1"
									disabled={isProcessing}
								>
									{isProcessing
										? 'Excluindo...'
										: 'Sim, excluir'}
								</Button>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
