import { useState, useEffect } from 'react';
import { createClient } from '@/config/supabase';
import { SearchableSelect } from '@/components/ui/searchable-select';

import { X, Upload, Loader2, Info, Plus } from 'lucide-react';
import { getActiveCompanyId } from '@/lib/utils';

import { ManageSelectsModal } from '@/features/insumos/components/ManageSelectsModal';
import { useToast } from '@/components/ui/toaster';
import { useSupplyItems } from '@/features/insumos/hooks/useSupplyItems';
import { useRentedEquipments } from '@/features/equip-alugados/hooks/useRentedEquipments';

interface AddRentedFormProps {
	siteId: string;
	onCancel: () => void;
	onSaved: () => void;
}

interface SimpleUser {
	id: string;
	email?: string;
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
	const supabase = createClient();
	const { fetchCategories, createCategory } = useSupplyItems();
	const { registerEquipment } = useRentedEquipments(siteId);

	const [user, setUser] = useState<SimpleUser | null>(null);
	useEffect(() => {
		supabase.auth.getUser().then(({ data }) => {
			if (data?.user) setUser(data.user as unknown as SimpleUser);
		});
	}, [supabase]);
	const [name, setName] = useState('');
	const [categoryId, setCategoryId] = useState('');
	const [quantity, setQuantity] = useState<number | ''>('');
	const [entryDate, setEntryDate] = useState('');
	const [observations, setObservations] = useState('');
	const [listType, setListType] = useState<'FERRAMENTA' | 'EPI'>(
		'FERRAMENTA',
	);

	const [categories, setCategories] = useState<CategoryItem[]>([]);
	const [companyId, setCompanyId] = useState<string | null>(null);

	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Category creation state
	const [isManageCategoriesOpen, setIsManageCategoriesOpen] = useState(false);
	const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
	const [newCategoryData, setNewCategoryData] = useState({
		primary: '',
		secondary: '',
	});
	const [isCreatingCat, setIsCreatingCat] = useState(false);

	useEffect(() => {
		async function fetchContext() {
			if (!siteId) return;

			try {
				const currentCompanyId = getActiveCompanyId();
				if (!currentCompanyId) {
					throw new Error('Nenhuma empresa ativa selecionada.');
				}
				
				setCompanyId(currentCompanyId);

				// Fetch categories using client hook
				const catData = await fetchCategories();

				if (catData) {
					setCategories(
						catData.map((c) => ({
							id: c.id,
							primary_category: c.primary_category,
							secondary_category: c.secondary_category || '',
						})) as CategoryItem[],
					);
				}
			} catch (err: unknown) {
				const message = err instanceof Error ? err.message : 'Erro ao carregar dados do sistema';
				console.error('Error fetching context:', err);
				setError(message);
			}
		}
		fetchContext();
	}, [siteId, supabase]);

	const handleCreateCategory = (newCategoryLabel: string) => {
		setNewCategoryData({ primary: newCategoryLabel, secondary: '' });
		setIsCategoryModalOpen(true);
	};

	const confirmCreateCategory = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!newCategoryData.primary.trim() || !companyId) return;
		setIsCreatingCat(true);

		try {
			const labelToSave = newCategoryData.secondary
				? `${newCategoryData.primary} - ${newCategoryData.secondary}`
				: newCategoryData.primary;

			const newId = await createCategory(labelToSave);

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
			setCategoryId(newId);
			addToast('Categoria cadastrada com sucesso!', 'success');
			setIsCategoryModalOpen(false);
			setNewCategoryData({ primary: '', secondary: '' });
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : 'Erro ao criar categoria';
			console.error(err);
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

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (
			!name ||
			!categoryId ||
			!quantity ||
			!entryDate ||
			!companyId ||
			!user
		) {
			setError('Preencha todos os campos obrigatórios.');
			return;
		}

		setIsSubmitting(true);
		setError(null);

		try {
			// Find category name
			const selectedCategory = categories.find(
				(c) => c.id === categoryId,
			);
			const categoryName = selectedCategory?.primary_category || 'Geral';

			// Chamar o hook para realizar as inserções
			const result = await registerEquipment({
				companyId,
				userId: user.id,
				name,
				categoryId,
				categoryName,
				quantity: Number(quantity),
				entryDate,
				observations,
			});

			if (!result.success) {
				throw new Error(result.error);
			}

			onSaved();
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : 'Erro ao salvar equipamento alugado';
			console.error('ERRO AO CADASTRAR EQUIPAMENTO:', err);
			setError(message);
		} finally {
			setIsSubmitting(false);
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
					onClick={onCancel}
					className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-colors"
				>
					<X className="w-5 h-5" />
				</button>
			</div>

			<div className="flex-1 overflow-y-auto p-6">
				{error && (
					<div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
						{error}
					</div>
				)}

				<form
					id="add-rented-form"
					onSubmit={handleSubmit}
					className="space-y-6"
				>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4 z-50">
						<div className="col-span-2">
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Nome do Equipamento *
							</label>
							<input
								type="text"
								value={name}
								onChange={(e) => setName(e.target.value)}
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#101828]"
								placeholder="Betoneira 400L"
								required
							/>
						</div>

						<div className="col-span-2 sm:col-span-1">
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Categoria *
							</label>
							<div className="w-full">
								<SearchableSelect
									options={categories.map((c) => ({
										value: c.id,
									label: c.secondary_category
										? `${c.primary_category} - ${c.secondary_category}`
										: c.primary_category,
								}))}
								value={categoryId}
								onChange={(val) => setCategoryId(val)}
								placeholder="Selecionar categoria..."
								onManage={() => setIsManageCategoriesOpen(true)}
								onCreate={handleCreateCategory}
								/>
							</div>
						</div>

						<div className="col-span-2 sm:col-span-1">
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Quantidade *
							</label>
							<input
								type="number"
								min="1"
								value={quantity}
								onChange={(e) =>
									setQuantity(
										e.target.value
											? Number(e.target.value)
											: '',
									)
								}
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#101828]"
								required
							/>
						</div>

						<div className="col-span-2 sm:col-span-1">
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Data/Hora de Chegada *
							</label>
							<input
								type="datetime-local"
								value={entryDate}
								onChange={(e) => setEntryDate(e.target.value)}
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#101828]"
								required
							/>
						</div>

						<div className="col-span-2">
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Observações
							</label>
							<textarea
								value={observations}
								onChange={(e) =>
									setObservations(e.target.value)
								}
								rows={3}
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#101828]"
								placeholder="Detalhes ou condições da entrega..."
							/>
						</div>

						<div className="col-span-2">
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Anexo / Foto (Opcional)
							</label>
							<label className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center text-gray-500 hover:text-gray-700 hover:border-gray-400 hover:bg-gray-50 cursor-pointer transition-colors">
								<Upload className="w-6 h-6 mb-2 text-gray-400" />
								<span className="text-sm font-medium">
									Clique ou arraste imagens aqui
								</span>
								<span className="text-xs mt-1">
									PNG, JPG ou PDF (Máx. 5MB)
								</span>
								<input
									type="file"
									className="hidden"
									accept="image/*,.pdf"
									multiple
								/>
							</label>
						</div>
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
				<div className="fixed inset-0 z-[999] flex items-center justify-center p-4 h-[100dvh] w-screen">
					<div 
						className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300" 
						onClick={() => setIsCategoryModalOpen(false)}
					/>
					<div className="relative bg-white text-gray-900 rounded-xl shadow-2xl border border-gray-200 w-[500px] max-w-[95vw] p-6 animate-in fade-in zoom-in-95 duration-200">
						<h3 className="text-xl font-bold mb-4">
							Nova Categoria
						</h3>
						<form
							onSubmit={confirmCreateCategory}
							className="space-y-4"
						>
							<div>
								<label className="block text-sm font-medium mb-1">
									Categoria Primária
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
									placeholder="Ex: Escoras"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">
									Categoria Secundária (Opcional)
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
									placeholder="Ex: Metálicas"
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
									disabled={isCreatingCat}
									className="px-4 py-2 text-sm font-semibold text-white bg-[#101828] hover:bg-[#1b263b] rounded-[5px] shadow-sm disabled:opacity-50"
								>
									Salvar Categoria
								</button>
							</div>
						</form>
					</div>
				</div>
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
