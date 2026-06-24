import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
	getSiteInventoryAdmin,
	getSiteToolsAdmin,
	addSiteToolsAdmin,
} from '@/app/actions/adminActions';
import { addToolSchema, AddToolFormData } from '../schemas/addToolSchema';
import { AddToolItemList, ToolInventoryItem } from './AddToolItemList';

interface AddToolFormProps {
	onCancel: () => void;
	onSaved: () => void;
	siteId: string;
}

interface RawSiteTool {
	inventory_id: string;
}

interface RawInventoryItem {
	id: string;
	quantity: number;
	catalogs: {
		name: string;
		code: string | null;
		measurement_units: {
			abbreviation: string;
		} | null;
		categories: {
			primary_category: string;
			secondary_category: string | null;
		} | null;
	} | null;
}

export function AddToolForm({ onCancel, onSaved, siteId }: AddToolFormProps) {
	const [searchTerm, setSearchTerm] = useState('');
	const [inventoryItems, setInventoryItems] = useState<ToolInventoryItem[]>(
		[],
	);
	const [isLoading, setIsLoading] = useState(true);
	const [submitError, setSubmitError] = useState<string | null>(null);

	const {
		watch,
		setValue,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<AddToolFormData>({
		resolver: zodResolver(addToolSchema),
		defaultValues: { selectedIds: [] },
	});

	const selectedIds = watch('selectedIds');

	useEffect(() => {
		const fetchInventory = async () => {
			try {
				setIsLoading(true);
				setSubmitError(null);

				const [existingTools, inventoryData] = await Promise.all([
					getSiteToolsAdmin(siteId),
					getSiteInventoryAdmin(siteId),
				]);

				const existingIds = new Set(
					(existingTools as unknown as RawSiteTool[])?.map(
						(t) => t.inventory_id,
					) || [],
				);

				const formatted: ToolInventoryItem[] = (
					(inventoryData as unknown as RawInventoryItem[]) || []
				)
					.filter((item) => !existingIds.has(item.id))
					.map((item) => {
						const catalog = item.catalogs ?? null;
						return {
							id: item.id,
							name: catalog?.name || 'Produto sem nome',
							code: catalog?.code || 'S/C',
							unit:
								catalog?.measurement_units?.abbreviation ||
								'UN',
							category:
								catalog?.categories?.primary_category ||
								'Sem Categoria',
							subcategory:
								catalog?.categories?.secondary_category || '',
							quantity: item.quantity || 0,
						};
					});

				setInventoryItems(formatted);
			} catch (err: unknown) {
				const message =
					err instanceof Error
						? err.message
						: 'Erro ao carregar dados do inventário';
				console.error('Error fetching inventory for tools:', err);
				setSubmitError(message);
			} finally {
				setIsLoading(false);
			}
		};

		if (siteId) fetchInventory();
	}, [siteId]);

	const filteredItems = inventoryItems.filter(
		(item) =>
			item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
			item.category.toLowerCase().includes(searchTerm.toLowerCase()),
	);

	const toggleSelection = (id: string) => {
		const nextIds = selectedIds.includes(id)
			? selectedIds.filter((i) => i !== id)
			: [...selectedIds, id];
		setValue('selectedIds', nextIds, { shouldValidate: true });
	};

	const onSubmit = async (data: AddToolFormData) => {
		try {
			setSubmitError(null);
			await addSiteToolsAdmin(siteId, data.selectedIds);
			onSaved();
		} catch (err: unknown) {
			const message =
				err instanceof Error ? err.message : 'Erro ao salvar ferramentas';
			console.error('Error saving tools:', err);
			setSubmitError(message);
		}
	};

	if (isLoading) {
		return (
			<div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-[800px] h-[650px] max-w-[95vw] max-h-[90vh] flex items-center justify-center">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#101828]" />
			</div>
		);
	}

	return (
		<div className="bg-white text-gray-900 rounded-xl shadow-2xl border border-gray-200 w-[800px] h-[650px] max-w-[95vw] max-h-[90vh] flex flex-col">
			<div className="p-6 border-b border-gray-200 flex justify-between items-start shrink-0">
				<div>
					<h2 className="text-xl font-bold text-gray-900 tracking-tight">
						Adicionar Ferramentas à Obra
					</h2>
					<p className="text-sm text-gray-500 mt-1">
						Selecione os insumos do almoxarifado para gerenciá-los
						como ferramentas de empréstimo.
					</p>
				</div>
				<button
					type="button"
					onClick={onCancel}
					className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-[5px] transition-colors p-1.5"
				>
					<X size={20} />
				</button>
			</div>

			<form
				id="add-tool-form"
				onSubmit={handleSubmit(onSubmit)}
				className="p-6 flex-1 overflow-hidden flex flex-col bg-gray-50/50"
			>
				<div className="flex flex-col gap-2 mb-5 shrink-0">
					<div className="relative">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
						<input
							type="text"
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							placeholder="Pesquise por nome, código ou categoria..."
							className="w-full bg-white border border-gray-300 rounded-[5px] py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#101828]/20 focus:border-[#101828] shadow-sm transition-all"
						/>
					</div>
				</div>

				{(submitError || errors.selectedIds) && (
					<div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded border border-red-200">
						{submitError || errors.selectedIds?.message}
					</div>
				)}

				<div className="grid grid-cols-1 gap-3 overflow-y-auto pr-2 rounded-[5px] flex-1 pb-4">
					<AddToolItemList
						items={filteredItems}
						selectedIds={selectedIds}
						onToggle={toggleSelection}
					/>
				</div>
			</form>

			<div className="p-5 border-t border-gray-200 flex flex-row items-center justify-between bg-white rounded-b-xl shrink-0">
				<div className="text-sm font-medium text-gray-600">
					Selecionados:{' '}
					<span className="font-bold text-[#101828] bg-blue-50 px-2 py-0.5 rounded-[5px]">
						{selectedIds.length}
					</span>
				</div>
				<div className="flex items-center gap-3">
					<Button
						type="button"
						variant="ghost"
						onClick={onCancel}
						className="text-gray-600 hover:bg-gray-100 hover:text-gray-900 font-semibold rounded-[5px] px-6"
					>
						Cancelar
					</Button>
					<Button
						type="submit"
						form="add-tool-form"
						disabled={selectedIds.length === 0 || isSubmitting}
						className="bg-[#101828] hover:bg-[#1b263b] text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-md rounded-[5px] px-8 transition-colors"
					>
						{isSubmitting ? 'Salvando...' : 'Salvar como Ferramenta'}
					</Button>
				</div>
			</div>
		</div>
	);
}
