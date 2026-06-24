import { useState, useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
	deletePrivateDocumentAction,
	uploadPrivateDocumentAction,
} from '@/app/actions/documentStorageActions';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { X, Loader2 } from 'lucide-react';
import { getActiveCompanyId } from '@/lib/utils';
import { ManageSelectsModal } from '@/features/insumos/components/ManageSelectsModal';
import { useToast } from '@/components/ui/toaster';
import { useSupplyItems } from '@/features/insumos/hooks/useSupplyItems';
import { useRentedEquipments } from '@/features/equip-alugados/hooks/useRentedEquipments';
import {
	addRentedSchema,
	AddRentedFormData,
} from '../schemas/addRentedSchema';
import { AddRentedCategoryModal } from './AddRentedCategoryModal';
import {
	AddRentedPhotosSection,
	RentedPhoto,
} from './AddRentedPhotosSection';

interface AddRentedFormProps {
	siteId: string;
	onCancel: () => void;
	onSaved: () => void;
}

interface CategoryItem {
	id: string;
	primary_category: string;
	secondary_category: string;
}

export function AddRentedForm({
	siteId,
	onCancel,
	onSaved,
}: AddRentedFormProps) {
	const { addToast } = useToast();
	const { fetchCategories, createCategory } = useSupplyItems();
	const { registerEquipment } = useRentedEquipments(siteId);

	const [categories, setCategories] = useState<CategoryItem[]>([]);
	const [companyId, setCompanyId] = useState<string | null>(null);
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [photos, setPhotos] = useState<RentedPhoto[]>([]);
	const [isUploading, setIsUploading] = useState(false);

	const [isManageCategoriesOpen, setIsManageCategoriesOpen] = useState(false);
	const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
	const [newCategoryData, setNewCategoryData] = useState({
		primary: '',
		secondary: '',
	});
	const [isCreatingCat, setIsCreatingCat] = useState(false);

	const {
		register,
		handleSubmit,
		control,
		setValue,
		formState: { errors, isSubmitting },
	} = useForm<AddRentedFormData>({
		resolver: zodResolver(addRentedSchema),
		defaultValues: {
			name: '',
			categoryId: '',
			quantity: 1,
			entryDate: '',
			observations: '',
		},
	});

	useEffect(() => {
		async function fetchContext() {
			if (!siteId) return;

			try {
				const currentCompanyId = getActiveCompanyId();
				if (!currentCompanyId) {
					throw new Error('Nenhuma empresa ativa selecionada.');
				}

				setCompanyId(currentCompanyId);
				const catData = await fetchCategories();

				if (catData) {
					setCategories(
						catData.map((c) => ({
							id: c.id,
							primary_category: c.primary_category,
							secondary_category: c.secondary_category || '',
						})),
					);
				}
			} catch (err: unknown) {
				const message =
					err instanceof Error
						? err.message
						: 'Erro ao carregar dados do sistema';
				console.error('Error fetching context:', err);
				setSubmitError(message);
			}
		}
		fetchContext();
	}, [siteId, fetchCategories]);

	const handleCreateCategory = () => {
		setNewCategoryData({ primary: '', secondary: '' });
		setIsCategoryModalOpen(true);
	};

	const confirmCreateCategory = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!newCategoryData.primary.trim() || !companyId) return;
		setIsCreatingCat(true);

		try {
			const newId = await createCategory({
				primary: newCategoryData.primary,
				secondary: newCategoryData.secondary || undefined,
			});

			const newCat: CategoryItem = {
				id: newId,
				primary_category: newCategoryData.primary,
				secondary_category: newCategoryData.secondary,
			};

			setCategories((prev) =>
				[...prev, newCat].sort((a, b) =>
					a.primary_category.localeCompare(b.primary_category),
				),
			);
			setValue('categoryId', newId, { shouldValidate: true });
			addToast('Categoria cadastrada com sucesso!', 'success');
			setIsCategoryModalOpen(false);
			setNewCategoryData({ primary: '', secondary: '' });
		} catch (err: unknown) {
			const message =
				err instanceof Error ? err.message : 'Erro ao criar categoria';
			console.error('ERRO AO CRIAR CATEGORIA:', err);
			addToast(message, 'error');
		} finally {
			setIsCreatingCat(false);
		}
	};

	const handleDeleteCategories = async (ids: string[]) => {
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

	const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		if (!files || files.length === 0) return;

		if (!companyId) {
			addToast('Erro: Empresa não identificada.', 'error');
			return;
		}

		setIsUploading(true);
		try {
			for (let i = 0; i < files.length; i++) {
				const file = files[i];
				const formData = new FormData();
				formData.append('file', file);
				formData.append('bucket', 'rented-equipments');

				const result = await uploadPrivateDocumentAction(formData);
				if (!result.success) throw new Error(result.error);

				setPhotos((prev) => [
					...prev,
					{ name: file.name, url: result.signedUrl, path: result.path },
				]);
			}
			addToast('Arquivo(s) enviado(s) com sucesso!', 'success');
		} catch (err: unknown) {
			const message =
				err instanceof Error ? err.message : 'Erro no upload';
			console.error('Upload error:', message);
			addToast(`Erro no upload: ${message}`, 'error');
		} finally {
			setIsUploading(false);
			if (e.target) e.target.value = '';
		}
	};

	const removePhoto = async (index: number) => {
		const photo = photos[index];
		if (photo.path) {
			await deletePrivateDocumentAction({
				bucket: 'rented-equipments',
				path: photo.path,
			});
		}
		setPhotos((prev) => prev.filter((_, i) => i !== index));
	};

	const onSubmit = async (data: AddRentedFormData) => {
		if (!companyId) {
			setSubmitError('Nenhuma empresa ativa selecionada.');
			return;
		}

		setSubmitError(null);

		try {
			const selectedCategory = categories.find(
				(c) => c.id === data.categoryId,
			);
			const categoryName = selectedCategory?.primary_category || 'Geral';
			const entryPhotosUrl =
				photos.length > 0
					? photos.map((p) => p.url).join(';')
					: undefined;

			const result = await registerEquipment({
				name: data.name,
				categoryId: data.categoryId,
				categoryName,
				quantity: data.quantity,
				entryDate: data.entryDate,
				observations: data.observations ?? '',
				entryPhotosUrl,
			});

			if (!result.success) throw new Error(result.error);
			onSaved();
		} catch (err: unknown) {
			const message =
				err instanceof Error
					? err.message
					: 'Erro ao salvar equipamento alugado';
			console.error('ERRO AO CADASTRAR EQUIPAMENTO:', err);
			setSubmitError(message);
		}
	};

	return (
		<div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
			<div className="flex items-center justify-between p-6 border-b border-gray-100">
				<div>
					<h2 className="text-xl font-bold text-gray-900">
						Novo Equipamento Alugado
					</h2>
					<p className="text-sm text-gray-500 mt-1">
						Registre o equipamento, defina se é EPI ou Ferramenta.
					</p>
				</div>
				<button
					type="button"
					onClick={onCancel}
					className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-colors"
				>
					<X className="w-5 h-5" />
				</button>
			</div>

			<div className="flex-1 overflow-y-auto p-6">
				{submitError && (
					<div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
						{submitError}
					</div>
				)}

				<form
					id="add-rented-form"
					onSubmit={handleSubmit(onSubmit)}
					className="space-y-6"
				>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4 z-50">
						<div className="col-span-2">
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Nome do Equipamento *
							</label>
							<input
								type="text"
								{...register('name')}
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#101828]"
								placeholder="Betoneira 400L"
							/>
							{errors.name && (
								<span className="text-destructive text-xs mt-1">
									{errors.name.message}
								</span>
							)}
						</div>

						<div className="col-span-2 sm:col-span-1">
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Categoria *
							</label>
							<Controller
								name="categoryId"
								control={control}
								render={({ field }) => (
									<SearchableSelect
										options={categories.map((c) => ({
											value: c.id,
											label: c.secondary_category
												? `${c.primary_category} - ${c.secondary_category}`
												: c.primary_category,
										}))}
										value={field.value}
										onChange={field.onChange}
										placeholder="Selecionar categoria..."
										onManage={() =>
											setIsManageCategoriesOpen(true)
										}
										onCreate={handleCreateCategory}
									/>
								)}
							/>
							{errors.categoryId && (
								<span className="text-destructive text-xs mt-1">
									{errors.categoryId.message}
								</span>
							)}
						</div>

						<div className="col-span-2 sm:col-span-1">
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Quantidade *
							</label>
							<input
								type="number"
								min={1}
								{...register('quantity', { valueAsNumber: true })}
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#101828]"
							/>
							{errors.quantity && (
								<span className="text-destructive text-xs mt-1">
									{errors.quantity.message}
								</span>
							)}
						</div>

						<div className="col-span-2 sm:col-span-1">
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Data/Hora de Chegada *
							</label>
							<input
								type="datetime-local"
								{...register('entryDate')}
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#101828]"
							/>
							{errors.entryDate && (
								<span className="text-destructive text-xs mt-1">
									{errors.entryDate.message}
								</span>
							)}
						</div>

						<div className="col-span-2">
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Observações
							</label>
							<textarea
								{...register('observations')}
								rows={3}
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#101828]"
								placeholder="Detalhes ou condições da entrega..."
							/>
						</div>

						<AddRentedPhotosSection
							photos={photos}
							isUploading={isUploading}
							onUpload={handleFileUpload}
							onRemove={removePhoto}
						/>
					</div>
				</form>
			</div>

			<div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
				<button
					type="button"
					onClick={onCancel}
					disabled={isSubmitting}
					className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
				>
					Cancelar
				</button>
				<button
					type="submit"
					form="add-rented-form"
					disabled={isSubmitting}
					className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#101828] border border-transparent rounded-md hover:bg-[#1b263b] disabled:opacity-50 min-w-[120px] transition-colors shadow-sm"
				>
					{isSubmitting ? (
						<>
							<Loader2 className="w-4 h-4 animate-spin" />
							Salvando...
						</>
					) : (
						'Salvar'
					)}
				</button>
			</div>

			{isCategoryModalOpen && (
				<AddRentedCategoryModal
					categories={categories}
					newCategoryData={newCategoryData}
					isCreating={isCreatingCat}
					onClose={() => setIsCategoryModalOpen(false)}
					onChange={setNewCategoryData}
					onSubmit={confirmCreateCategory}
				/>
			)}

			{isManageCategoriesOpen && (
				<ManageSelectsModal
					title="Gerenciar Categorias"
					description="Visualize, edite ou exclua categorias."
					items={categories.map((c) => ({
						id: c.id,
						title: c.primary_category,
						subtitle: c.secondary_category,
						isInUse: false,
					}))}
					onClose={() => setIsManageCategoriesOpen(false)}
					onDelete={handleDeleteCategories}
					onEdit={handleEditCategory}
				/>
			)}
		</div>
	);
}
