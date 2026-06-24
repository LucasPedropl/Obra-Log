import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
	getSiteInventoryAdmin,
	getSiteEpisAdmin,
	addSiteEpisAdmin,
} from '@/app/actions/adminActions';
import { addEPISchema, AddEPIFormData } from '../schemas/addEPISchema';
import { AddEPIItemList, EPIInventoryItem } from './AddEPIItemList';

interface AddEPIFormProps {
	onCancel: () => void;
	onSaved: () => void;
	siteId: string;
}

interface RawEPIItem {
	inventory_id: string;
}

interface RawInventoryItem {
	id: string;
	quantity: number;
	catalogs: {
		name: string;
		code: string | null;
		is_tool: boolean | null;
		measurement_units: {
			abbreviation: string;
		} | null;
		categories: {
			primary_category: string;
			secondary_category: string | null;
		} | null;
	} | null;
}

export function AddEPIForm({ onCancel, onSaved, siteId }: AddEPIFormProps) {
	const [searchTerm, setSearchTerm] = useState('');
	const [inventoryItems, setInventoryItems] = useState<EPIInventoryItem[]>(
		[],
	);
	const [isLoading, setIsLoading] = useState(true);
	const [submitError, setSubmitError] = useState<string | null>(null);

	const {
		watch,
		setValue,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<AddEPIFormData>({
		resolver: zodResolver(addEPISchema),
		defaultValues: { selectedIds: [] },
	});

	const selectedIds = watch('selectedIds');

	useEffect(() => {
		const fetchInventory = async () => {
			try {
				setIsLoading(true);
				setSubmitError(null);

				const [existingEPIs, inventoryData] = await Promise.all([
					getSiteEpisAdmin(siteId),
					getSiteInventoryAdmin(siteId),
				]);

				const existingIds = new Set(
					(existingEPIs as unknown as RawEPIItem[])?.map(
						(t) => t.inventory_id,
					) || [],
				);

				const formatted: EPIInventoryItem[] = (
					(inventoryData as unknown as RawInventoryItem[]) || []
				)
					.filter(
						(item) =>
							!existingIds.has(item.id) &&
							item.catalogs?.is_tool !== true,
					)
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
				console.error('Error fetching inventory for EPIs:', err);
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

	const onSubmit = async (data: AddEPIFormData) => {
		try {
			setSubmitError(null);
			await addSiteEpisAdmin(siteId, data.selectedIds);
			onSaved();
		} catch (err: unknown) {
			const message =
				err instanceof Error ? err.message : 'Erro ao salvar EPIs';
			console.error('Error adding EPIs:', err);
			setSubmitError(message);
		}
	};

	return (
		<div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-[600px] max-w-[95vw] overflow-hidden flex flex-col h-[600px]">
			<div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50 shrink-0">
				<div>
					<h2 className="text-base font-semibold text-gray-900">
						Cadastrar EPIs
					</h2>
					<p className="text-xs text-gray-500 mt-0.5">
						Selecione os insumos do almoxarifado que serão
						controlados como EPI.
					</p>
				</div>
				<Button
					variant="ghost"
					size="icon"
					className="h-8 w-8 text-gray-500 hover:text-gray-900 hover:bg-gray-200/50 rounded-[5px]"
					onClick={onCancel}
				>
					<X className="h-4 w-4" />
				</Button>
			</div>

			<form
				id="add-epi-form"
				onSubmit={handleSubmit(onSubmit)}
				className="flex-1 overflow-hidden flex flex-col"
			>
				<div className="p-4 border-b border-gray-100 shrink-0">
					<div className="relative">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
						<input
							type="text"
							placeholder="Buscar por nome, código ou categoria..."
							className="flex h-10 w-full rounded-[5px] border border-gray-300 bg-white pl-9 pr-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#101828]"
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
						/>
					</div>
				</div>

				<div className="flex-1 overflow-auto p-4 bg-gray-50/30">
					{(submitError || errors.selectedIds) && (
						<div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-[5px] border border-red-200 uppercase font-medium">
							{submitError || errors.selectedIds?.message}
						</div>
					)}

					{isLoading ? (
						<div className="flex justify-center items-center h-full">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#101828]" />
						</div>
					) : (
						<AddEPIItemList
							items={filteredItems}
							selectedIds={selectedIds}
							onToggle={toggleSelection}
						/>
					)}
				</div>
			</form>

			<div className="flex items-center justify-between p-4 border-t border-gray-100 bg-white shrink-0">
				<span className="text-xs font-medium text-gray-500">
					{selectedIds.length}{' '}
					{selectedIds.length === 1
						? 'item selecionado'
						: 'itens selecionados'}
				</span>
				<div className="flex gap-2">
					<Button
						variant="outline"
						onClick={onCancel}
						className="h-9 px-4 text-xs font-semibold rounded-[5px] border-gray-300 text-gray-700 hover:bg-gray-50 uppercase"
					>
						Cancelar
					</Button>
					<Button
						type="submit"
						form="add-epi-form"
						disabled={selectedIds.length === 0 || isSubmitting}
						className="h-9 px-4 text-xs font-semibold rounded-[5px] bg-[#101828] hover:bg-[#1b263b] text-white uppercase"
					>
						{isSubmitting ? 'Salvando...' : 'Adicionar EPIs'}
					</Button>
				</div>
			</div>
		</div>
	);
}
