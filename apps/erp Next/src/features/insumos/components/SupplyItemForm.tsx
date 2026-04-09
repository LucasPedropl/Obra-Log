import React, { useState, useEffect } from 'react';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createClient } from '@/config/supabase';
import { getActiveCompanyId } from '@/lib/utils';
import {
	useSupplyItems,
	supplyItemSchema,
	SupplyItemFormData,
} from '../hooks/useSupplyItems';
import { useToast } from '@/components/ui/toaster';

interface SupplyItemFormProps {
	onCancel?: () => void;
}

export function SupplyItemForm({ onCancel }: SupplyItemFormProps) {
	const { addToast } = useToast();
	const { createSupplyItem, createCategory, createUnit, isLoading, error } =
		useSupplyItems();
	const {
		register,
		handleSubmit,
		control,
		setValue,
		formState: { errors },
	} = useForm({
		resolver: zodResolver(supplyItemSchema),
		defaultValues: { is_stock_controlled: true, min_threshold: 0 },
	});

	const [categories, setCategories] = useState<
		{ value: string; label: string }[]
	>([]);
	const [units, setUnits] = useState<{ value: string; label: string }[]>([]);

	useEffect(() => {
		const loadData = async () => {
			const companyId = getActiveCompanyId();
			if (!companyId) return;

			const supabase = createClient();
			const [catRes, unRes] = await Promise.all([
				supabase
					.from('categories')
					.select('id, primary_category')
					.eq('company_id', companyId),
				supabase
					.from('measurement_units')
					.select('id, name, abbreviation')
					.eq('company_id', companyId),
			]);

			if (catRes.data) {
				setCategories(
					catRes.data.map((c) => ({
						value: c.id,
						label: c.primary_category,
					})),
				);
			}
			if (unRes.data) {
				setUnits(
					unRes.data.map((u) => ({
						value: u.id,
						label: `${u.name} (${u.abbreviation})`,
					})),
				);
			}
		};
		loadData();
	}, []);

	const handleCreateCategory = async (newCategoryLabel: string) => {
		try {
			const newId = await createCategory(newCategoryLabel);
			setCategories([
				...categories,
				{ value: newId, label: newCategoryLabel },
			]);
			setValue('category_id', newId, { shouldValidate: true });
			addToast('Categoria cadastrada com sucesso!', 'success');
		} catch (err) {
			addToast('Erro ao criar categoria.', 'error');
		}
	};

	const handleCreateUnit = async (newUnitLabel: string) => {
		const match = newUnitLabel.match(/^(.*?)(?:\s*\((.*?)\))?$/);
		const name = match?.[1]?.trim() || newUnitLabel;
		const abbreviation =
			match?.[2]?.trim() || name.substring(0, 2).toLowerCase();

		try {
			const newId = await createUnit(name, abbreviation);
			setUnits([...units, { value: newId, label: newUnitLabel }]);
			setValue('unit_id', newId, { shouldValidate: true });
			addToast('Unidade de medida cadastrada com sucesso!', 'success');
		} catch (err) {
			addToast('Erro ao criar unidade de medida.', 'error');
		}
	};

	const onSubmit = async (data: SupplyItemFormData) => {
		const success = await createSupplyItem(data);
		if (success) {
			addToast('Insumo cadastrado com sucesso!', 'success');
			if (onCancel) onCancel();
		} else {
			addToast('Erro ao cadastrar o insumo', 'error');
		}
	};

	return (
		<div className="p-6 bg-card rounded-xl border border-border shadow-xl overflow-hidden">
			<h2 className="text-2xl font-bold mb-6">
				Cadastrar Insumo do Catálogo
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
								options={categories}
								value={field.value}
								onChange={(val) => field.onChange(val)}
								onCreate={handleCreateCategory}
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
								options={units}
								value={field.value}
								onChange={(val) => field.onChange(val)}
								onCreate={handleCreateUnit}
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
		</div>
	);
}
