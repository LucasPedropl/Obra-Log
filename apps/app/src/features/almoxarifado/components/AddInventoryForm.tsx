import React, { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSupplyItems } from '@/features/insumos/hooks/useSupplyItems';
import { addSiteInventoryItemsAction } from '@/app/actions/inventoryActions';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toaster';
import {
	addInventorySchema,
	addInventoryStep1Schema,
	AddInventoryFormData,
	InventoryItemConfig,
} from '../schemas/addInventorySchema';
import { AddInventoryConfigStep } from './AddInventoryConfigStep';
import { AddInventorySelectStep } from './AddInventorySelectStep';
import {
	AddInventoryPayloadItem,
	RawSupplyItem,
	SupplyItemOption,
} from './addInventoryTypes';

interface AddInventoryFormProps {
	onCancel: () => void;
	onSaved: () => void;
	siteId: string;
	existingCatalogIds: string[];
}

export function AddInventoryForm({
	onCancel,
	onSaved,
	siteId,
	existingCatalogIds,
}: AddInventoryFormProps) {
	const [step, setStep] = useState(1);
	const [searchTerm, setSearchTerm] = useState('');
	const [globalItems, setGlobalItems] = useState<SupplyItemOption[]>([]);
	const [isFetching, setIsFetching] = useState(true);
	const [saveError, setSaveError] = useState<string | null>(null);

	const { fetchSupplyItems } = useSupplyItems();
	const { addToast } = useToast();

	const {
		watch,
		setValue,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<AddInventoryFormData>({
		resolver: zodResolver(addInventorySchema),
		defaultValues: {
			selectedIds: [],
			items: [],
		},
	});

	const selectedIds = watch('selectedIds');
	const items = watch('items');

	useEffect(() => {
		fetchSupplyItems().then((res) => {
			const mapped = ((res as unknown as RawSupplyItem[]) || []).map(
				(item) => ({
					id: item.id,
					name: item.name,
					code: item.code || '-',
					unit: item.measurement_units?.abbreviation || 'UN',
					category:
						item.categories?.primary_category || 'Sem Categoria',
					subcategory:
						item.categories?.secondary_category || '',
				}),
			);
			setGlobalItems(mapped);
			setIsFetching(false);
		});
	}, [fetchSupplyItems]);

	const availableItems = useMemo(() => {
		const existingIds = new Set(existingCatalogIds);
		return globalItems.filter((item) => !existingIds.has(item.id));
	}, [globalItems, existingCatalogIds]);

	const filteredItems = availableItems.filter(
		(item) =>
			item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			item.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			item.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			item.subcategory?.toLowerCase().includes(searchTerm.toLowerCase()),
	);

	const syncItemsFromSelection = (ids: string[]) => {
		const nextItems: InventoryItemConfig[] = ids.map((id) => {
			const existing = items.find((i) => i.catalogId === id);
			return (
				existing ?? {
					catalogId: id,
					quantity: 0,
					category: 'NONE',
				}
			);
		});
		setValue('items', nextItems, { shouldValidate: true });
	};

	const toggleSelection = (id: string) => {
		const nextIds = selectedIds.includes(id)
			? selectedIds.filter((i) => i !== id)
			: [...selectedIds, id];
		setValue('selectedIds', nextIds, { shouldValidate: true });
		syncItemsFromSelection(nextIds);
	};

	const handleQuantityChange = (catalogId: string, quantity: number) => {
		const nextItems = items.map((item) =>
			item.catalogId === catalogId ? { ...item, quantity } : item,
		);
		setValue('items', nextItems, { shouldValidate: true });
	};

	const handleCategoryChange = (
		catalogId: string,
		category: InventoryItemConfig['category'],
	) => {
		const nextItems = items.map((item) =>
			item.catalogId === catalogId ? { ...item, category } : item,
		);
		setValue('items', nextItems, { shouldValidate: true });
	};

	const handleAdvance = () => {
		const step1Result = addInventoryStep1Schema.safeParse({ selectedIds });
		if (!step1Result.success) {
			setSaveError(
				step1Result.error.issues[0]?.message ?? 'Seleção inválida',
			);
			return;
		}
		setSaveError(null);
		syncItemsFromSelection(selectedIds);
		setStep(2);
	};

	const onSubmit = async (data: AddInventoryFormData) => {
		setSaveError(null);
		try {
			const payload: AddInventoryPayloadItem[] = data.items.map(
				(item) => ({
					catalogId: item.catalogId,
					quantity: item.quantity,
					category: item.category,
				}),
			);

			const result = await addSiteInventoryItemsAction(siteId, payload);
			if (!result.success) throw new Error(result.error);

			addToast('Inventário atualizado com sucesso!', 'success');
			onSaved();
		} catch (err: unknown) {
			console.error('Erro ao salvar inventário:', err);
			const message =
				err instanceof Error ? err.message : 'Erro desconhecido';
			setSaveError(message);
		}
	};

	return (
		<div className="bg-white text-gray-900 rounded-xl shadow-2xl border border-gray-200 w-[800px] h-[650px] max-w-[95vw] max-h-[90vh] flex flex-col">
			<div className="p-6 border-b border-gray-200 flex justify-between items-start shrink-0">
				<div>
					<h2 className="text-xl font-bold text-gray-900 tracking-tight">
						{step === 1
							? 'Adicionar Insumos à Obra'
							: 'Configurar Quantidades e Destinação'}
					</h2>
					<p className="text-sm text-gray-500 mt-1">
						{step === 1
							? 'Selecione os insumos do catálogo global que farão parte do estoque da obra.'
							: 'Defina o estoque inicial e se o insumo será classificado como Ferramenta ou EPI na obra.'}
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
				id="add-inventory-form"
				onSubmit={handleSubmit(onSubmit)}
				className="p-6 flex-1 overflow-hidden flex flex-col bg-gray-50/50"
			>
				{(saveError || errors.selectedIds || errors.items) && (
					<div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-[5px] text-red-700 text-sm shrink-0">
						{saveError ||
							errors.selectedIds?.message ||
							errors.items?.message}
					</div>
				)}

				{step === 1 ? (
					<AddInventorySelectStep
						searchTerm={searchTerm}
						onSearchChange={setSearchTerm}
						isFetching={isFetching}
						filteredItems={filteredItems}
						selectedIds={selectedIds}
						onToggle={toggleSelection}
					/>
				) : (
					<AddInventoryConfigStep
						selectedIds={selectedIds}
						globalItems={globalItems}
						items={items}
						onQuantityChange={handleQuantityChange}
						onCategoryChange={handleCategoryChange}
					/>
				)}
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
						onClick={step === 1 ? onCancel : () => setStep(1)}
						className="text-gray-600 hover:bg-gray-100 hover:text-gray-900 font-semibold rounded-[5px] px-6"
					>
						{step === 1 ? 'Cancelar' : 'Voltar'}
					</Button>

					{step === 1 ? (
						<Button
							type="button"
							onClick={handleAdvance}
							disabled={selectedIds.length === 0}
							className="bg-[#101828] hover:bg-[#1b263b] text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-md rounded-[5px] px-8 transition-colors"
						>
							Avançar
						</Button>
					) : (
						<Button
							type="submit"
							form="add-inventory-form"
							disabled={isSubmitting}
							className="bg-[#101828] hover:bg-[#1b263b] text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-md rounded-[5px] px-8 transition-colors"
						>
							{isSubmitting ? 'Salvando...' : 'Salvar no Estoque'}
						</Button>
					)}
				</div>
			</div>
		</div>
	);
}
