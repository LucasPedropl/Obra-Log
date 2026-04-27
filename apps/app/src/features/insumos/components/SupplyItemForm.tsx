import {
	importCategoriesAdmin,
	importUnitsAdmin,
} from '@/app/actions/adminActions';
import { ImportModal } from '@/components/shared/ImportModal';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { useToast } from '@/components/ui/toaster';
import { createClient } from '@/config/supabase';
import { getActiveCompanyId } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
	SupplyItemFormData,
	supplyItemSchema,
	useSupplyItems,
} from '../hooks/useSupplyItems';
import { ManageSelectsModal } from './ManageSelectsModal';

interface SimpleCategory {
	id: string;
	primary_category: string;
	secondary_category: string | null;
}

interface SimpleUnit {
	id: string;
	name: string;
	abbreviation: string;
}

interface SupplyItemFormProps {
	onCancel?: () => void;
	initialData?: {
		id?: string;
		name?: string;
		category_id?: string;
		unit_id?: string;
		min_threshold?: number;
		is_stock_controlled?: boolean;
	};
}

export function SupplyItemForm({ onCancel, initialData }: SupplyItemFormProps) {
	const { addToast } = useToast();
	const {
		createSupplyItem,
		createCategory,
		createUnit,
		fetchCategories,
		fetchUnits,
		isLoading,
		error,
	} = useSupplyItems();
	const {
		register,
		handleSubmit,
		control,
		setValue,
		watch,
		formState: { errors },
	} = useForm<SupplyItemFormData>({
		resolver: zodResolver(supplyItemSchema),
		defaultValues: initialData
			? {
					name: initialData.name || '',
					category_id: initialData.category_id || '',
					unit_id: initialData.unit_id || '',
					min_threshold: initialData.min_threshold || 0,
					is_stock_controlled:
						initialData.is_stock_controlled ?? false,
				}
			: {
					name: '',
					category_id: '',
					unit_id: '',
					min_threshold: 0,
					is_stock_controlled: false,
				},
	});

	const isStockControlled = watch('is_stock_controlled');

	const [categories, setCategories] = useState<SimpleCategory[]>([]);
	const [units, setUnits] = useState<SimpleUnit[]>([]);

	// State for the Modals
	const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
	const [newCategoryData, setNewCategoryData] = useState({
		primary: '',
		secondary: '',
	});

	const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
	const [newUnitData, setNewUnitData] = useState({
		name: '',
		abbreviation: '',
	});

	const [isManageCategoriesOpen, setIsManageCategoriesOpen] = useState(false);
	const [isManageUnitsOpen, setIsManageUnitsOpen] = useState(false);
	const [isImportCatsOpen, setIsImportCatsOpen] = useState(false);
	const [isImportUnitsOpen, setIsImportUnitsOpen] = useState(false);

	useEffect(() => {
		const loadData = async () => {
			const [catRes, unRes] = await Promise.all([
				fetchCategories(),
				fetchUnits(),
			]);

			if (catRes) {
				setCategories(catRes as unknown as SimpleCategory[]);
			}
			if (unRes) {
				setUnits(unRes as unknown as SimpleUnit[]);
			}
		};
		loadData();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isImportCatsOpen, isImportUnitsOpen]);

	const handleCreateCategory = (newCategoryLabel: string) => {
		setNewCategoryData({ primary: newCategoryLabel, secondary: '' });
		setIsCategoryModalOpen(true);
	};

	const confirmCreateCategory = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			const labelToSave = newCategoryData.secondary
				? `${newCategoryData.primary} - ${newCategoryData.secondary}`
				: newCategoryData.primary;
			// Pass this structured data if createCategory supports it, else combine them
			const newId = await createCategory(labelToSave);
			setCategories([
				...categories,
				{
					id: newId,
					primary_category: newCategoryData.primary,
					secondary_category: newCategoryData.secondary,
				},
			]);
			setValue('category_id', newId, { shouldValidate: true });
			addToast('Categoria cadastrada com sucesso!', 'success');
			setIsCategoryModalOpen(false);
		} catch (err: unknown) {
			console.error(err);
			addToast('Erro ao criar categoria.', 'error');
		}
	};

	const handleCreateUnit = (newUnitLabel: string) => {
		const match = newUnitLabel.match(/^(.*?)(?:\s*\((.*?)\))?$/);
		const name = match?.[1]?.trim() || newUnitLabel;
		const abbreviation =
			match?.[2]?.trim() || name.substring(0, 2).toLowerCase();

		setNewUnitData({ name, abbreviation });
		setIsUnitModalOpen(true);
	};

	const confirmCreateUnit = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			const newId = await createUnit(
				newUnitData.name,
				newUnitData.abbreviation,
			);
			setUnits([
				...units,
				{
					id: newId,
					name: newUnitData.name,
					abbreviation: newUnitData.abbreviation,
				},
			]);
			setValue('unit_id', newId, { shouldValidate: true });
			addToast('Unidade de medida cadastrada com sucesso!', 'success');
			setIsUnitModalOpen(false);
		} catch (err: unknown) {
			console.error(err);
			addToast('Erro ao criar unidade de medida.', 'error');
		}
	};

	const handleDeleteCategories = async (ids: string[]) => {
		// Mock API call to delete categories
		setCategories((prev) => prev.filter((c) => !ids.includes(c.id)));
	};

	const handleEditCategory = (id: string) => {
		const cat = categories.find((c) => c.id === id);
		if (cat) {
			setNewCategoryData({
				primary: cat.primary_category,
				secondary: cat.secondary_category || '',
			});
			setIsCategoryModalOpen(true);
		}
	};

	const handleDeleteUnits = async (ids: string[]) => {
		// Mock API call to delete units
		setUnits((prev) => prev.filter((u) => !ids.includes(u.id)));
	};

	const handleEditUnit = (id: string) => {
		const unit = units.find((u) => u.id === id);
		if (unit) {
			setNewUnitData({
				name: unit.name,
				abbreviation: unit.abbreviation,
			});
			setIsUnitModalOpen(true);
		}
	};

	const onSubmit = async (data: SupplyItemFormData) => {
		let success;
		if (initialData?.id) {
			// TODO: Update logic here once API route is there
			// success = await updateSupplyItem({ ...data, id: initialData.id });
			success = true;
			addToast('Insumo atualizado com sucesso!', 'success');
		} else {
			success = await createSupplyItem(data);
			if (success) {
				addToast('Insumo cadastrado com sucesso!', 'success');
			} else {
				addToast('Erro ao cadastrar o insumo', 'error');
			}
		}

		if (success && onCancel) {
			onCancel();
		}
	};

	return (
		<div className="p-6 bg-card rounded-xl border border-border shadow-xl overflow-hidden">
			<h2 className="text-2xl font-bold mb-6">
				{initialData
					? 'Editar Insumo do Catálogo'
					: 'Cadastrar Insumo do Catálogo'}
			</h2>
			{error && (
				<div className="mb-4 text-destructive text-sm font-medium">
					{error}
				</div>
			)}

			<form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
				<div>
					<label className="block text-sm font-medium mb-1">
						Nome do Insumo
					</label>
					<input
						type="text"
						{...register('name')}
						className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
						placeholder="Ex: Cimento CP II 50kg"
					/>
					{errors.name && (
						<span className="text-destructive text-xs mt-1">
							{errors.name.message}
						</span>
					)}
				</div>

				<div>
					<label className="block text-sm font-medium mb-1">
						Categoria
					</label>
					<Controller
						name="category_id"
						control={control}
						render={({ field }) => (
							<SearchableSelect
								options={categories.map((c) => ({
									value: c.id,
									label: c.primary_category,
									subLabel: c.secondary_category || undefined,
								}))}
								value={field.value}
								onChange={(val) => field.onChange(val)}
								onCreate={handleCreateCategory}
								onManage={() => setIsManageCategoriesOpen(true)}
								placeholder="Pesquise ou selecione uma categoria"
							/>
						)}
					/>
					{errors.category_id && (
						<span className="text-destructive text-xs mt-1">
							{errors.category_id.message}
						</span>
					)}
				</div>

				<div>
					<label className="block text-sm font-medium mb-1">
						Unidade de Medida
					</label>
					<Controller
						name="unit_id"
						control={control}
						render={({ field }) => (
							<SearchableSelect
								options={units.map((u) => ({
									value: u.id,
									label: u.name,
									subLabel: u.abbreviation,
								}))}
								value={field.value}
								onChange={(val) => field.onChange(val)}
								onCreate={handleCreateUnit}
								onManage={() => setIsManageUnitsOpen(true)}
								placeholder="Pesquise ou selecione uma unidade (Ex: un, kg)"
							/>
						)}
					/>
					{errors.unit_id && (
						<span className="text-destructive text-xs mt-1">
							{errors.unit_id.message}
						</span>
					)}
				</div>

				<div className="flex items-center gap-2 mt-4 mb-2">
					<input
						type="checkbox"
						{...register('is_stock_controlled')}
						className="w-4 h-4 rounded border-input"
					/>
					<label className="text-sm font-medium border-none p-0 bg-transparent text-foreground">
						Controlar Estoque?
					</label>
				</div>

				{!isStockControlled && (
					<div className="grid grid-cols-2 gap-4">
						<div>
							<label className="block text-sm font-medium mb-1">
								Estoque Mínimo
							</label>
							<input
								type="number"
								{...register('min_threshold', {
									valueAsNumber: true,
								})}
								className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
							/>
							{errors.min_threshold && (
								<span className="text-destructive text-xs mt-1">
									{errors.min_threshold.message}
								</span>
							)}
						</div>
					</div>
				)}

				<div className="flex gap-3 pt-6 mt-4 border-t border-border">
					{onCancel && (
						<button
							type="button"
							onClick={onCancel}
							disabled={isLoading}
							className="w-full bg-transparent border border-input hover:bg-accent text-foreground h-10 px-4 py-2 flex items-center justify-center rounded-md font-medium transition-colors disabled:opacity-50"
						>
							Cancelar
						</button>
					)}
					<button
						type="submit"
						disabled={isLoading}
						className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 flex items-center justify-center rounded-md font-medium transition-colors disabled:opacity-50"
					>
						{isLoading ? 'Cadastrando...' : 'Cadastrar Insumo'}
					</button>
				</div>
			</form>

			{isCategoryModalOpen && (
				<div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 backdrop-blur-sm">
					<div className="bg-white text-gray-900 rounded-xl shadow-2xl border border-gray-200 w-[500px] max-w-[95vw] p-6">
						<h3 className="text-xl font-bold mb-4">
							Nova Categoria
						</h3>
						<form
							onSubmit={confirmCreateCategory}
							className="space-y-4"
						>
							<div>
								<label className="block text-sm font-medium mb-1">
									Categoria Principal
								</label>
								<input
									type="text"
									required
									value={newCategoryData.primary}
									onChange={(e) =>
										setNewCategoryData({
											...newCategoryData,
											primary: e.target.value,
										})
									}
									className="w-full flex h-10 rounded-[5px] border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#101828]/20 focus:border-[#101828]"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">
									Subcategoria{' '}
									<span className="text-gray-400 font-normal">
										(Opcional)
									</span>
								</label>
								<input
									type="text"
									value={newCategoryData.secondary}
									onChange={(e) =>
										setNewCategoryData({
											...newCategoryData,
											secondary: e.target.value,
										})
									}
									className="w-full flex h-10 rounded-[5px] border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#101828]/20 focus:border-[#101828]"
									placeholder="Ex: Cimento e Argamassas"
								/>
							</div>
							<div className="flex justify-end gap-3 pt-4">
								<button
									type="button"
									onClick={() =>
										setIsCategoryModalOpen(false)
									}
									className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-[5px]"
								>
									Cancelar
								</button>
								<button
									type="submit"
									className="px-4 py-2 text-sm font-semibold text-white bg-[#101828] hover:bg-[#1b263b] rounded-[5px] shadow-sm"
								>
									Salvar Categoria
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{isUnitModalOpen && (
				<div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 backdrop-blur-sm">
					<div className="bg-white text-gray-900 rounded-xl shadow-2xl border border-gray-200 w-[500px] max-w-[95vw] p-6">
						<h3 className="text-xl font-bold mb-4">
							Nova Unidade de Medida
						</h3>
						<form
							onSubmit={confirmCreateUnit}
							className="space-y-4"
						>
							<div>
								<label className="block text-sm font-medium mb-1">
									Nome da Unidade
								</label>
								<input
									type="text"
									required
									value={newUnitData.name}
									onChange={(e) =>
										setNewUnitData({
											...newUnitData,
											name: e.target.value,
										})
									}
									className="w-full flex h-10 rounded-[5px] border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#101828]/20 focus:border-[#101828]"
									placeholder="Ex: Quilograma"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">
									Abreviação
								</label>
								<input
									type="text"
									required
									value={newUnitData.abbreviation}
									onChange={(e) =>
										setNewUnitData({
											...newUnitData,
											abbreviation: e.target.value,
										})
									}
									className="w-full flex h-10 rounded-[5px] border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#101828]/20 focus:border-[#101828]"
									placeholder="Ex: KG"
								/>
							</div>
							<div className="flex justify-end gap-3 pt-4">
								<button
									type="button"
									onClick={() => setIsUnitModalOpen(false)}
									className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-[5px]"
								>
									Cancelar
								</button>
								<button
									type="submit"
									className="px-4 py-2 text-sm font-semibold text-white bg-[#101828] hover:bg-[#1b263b] rounded-[5px] shadow-sm"
								>
									Salvar Unidade
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{isManageCategoriesOpen && (
				<ManageSelectsModal
					title="Gerenciar Categorias"
					description="Visualize, edite ou exclua categorias de insumos. Categorias em uso não podem ser excluídas."
					items={categories.map((c) => ({
						id: c.id,
						title: c.primary_category,
						subtitle: c.secondary_category,
						isInUse: Math.random() > 0.7, // Mocking randomly some items in use
					}))}
					onClose={() => setIsManageCategoriesOpen(false)}
					onDelete={handleDeleteCategories}
					onEdit={handleEditCategory}
					onImport={() => {
						setIsManageCategoriesOpen(false);
						setIsImportCatsOpen(true);
					}}
				/>
			)}

			{isManageUnitsOpen && (
				<ManageSelectsModal
					title="Gerenciar Unidades de Medida"
					description="Visualize, edite ou exclua unidades de medida. Unidades em uso não podem ser excluídas."
					items={units.map((u) => ({
						id: u.id,
						title: u.name,
						subtitle: u.abbreviation,
						isInUse: Math.random() > 0.7, // Mocking randomly some items in use
					}))}
					onClose={() => setIsManageUnitsOpen(false)}
					onDelete={handleDeleteUnits}
					onEdit={handleEditUnit}
					onImport={() => {
						setIsManageUnitsOpen(false);
						setIsImportUnitsOpen(true);
					}}
				/>
			)}

			<ImportModal
				isOpen={isImportCatsOpen}
				onClose={() => setIsImportCatsOpen(false)}
				title="Importar Categorias"
				description="Formato: Categoria Primária;Secundária (opcional)"
				onImportLines={async (lines) => {
					const supabase = createClient();
					const result: any[] = [];
					const companyId = getActiveCompanyId();
					if (!companyId)
						throw new Error('Nenhuma empresa selecionada.');

					for (const line of lines) {
						const parts = line.split(';');
						if (parts.length >= 1) {
							result.push({
								primary_category: parts[0].trim(),
								secondary_category: parts[1]
									? parts[1].trim()
									: null,
								company_id: companyId,
								entry_type: 'PRODUTO',
							});
						}
					}
					if (result.length > 0) {
						await importCategoriesAdmin(result);
						fetchCategories();
					}
				}}
			/>

			<ImportModal
				isOpen={isImportUnitsOpen}
				onClose={() => setIsImportUnitsOpen(false)}
				title="Importar Unidades de Medida"
				description="Formato: Nome da Unidade;Abreviação"
				onImportLines={async (lines) => {
					const supabase = createClient();
					const result: any[] = [];
					const companyId = getActiveCompanyId();
					if (!companyId)
						throw new Error('Nenhuma empresa selecionada.');

					for (const line of lines) {
						const parts = line.split(';');
						if (parts.length >= 2) {
							result.push({
								name: parts[0].trim(),
								abbreviation: parts[1].trim(),
								company_id: companyId,
								entry_type: 'PRODUTO',
							});
						}
					}
					if (result.length > 0) {
						await importUnitsAdmin(result);
						fetchUnits();
					}
				}}
			/>
		</div>
	);
}
