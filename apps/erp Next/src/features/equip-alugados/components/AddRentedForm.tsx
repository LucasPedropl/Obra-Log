import { useState, useEffect } from 'react';
import { createClient } from '@/config/supabase';

import { X, Upload, Loader2, Info } from 'lucide-react';

interface AddRentedFormProps {
	siteId: string;
	onCancel: () => void;
	onSaved: () => void;
}

export function AddRentedForm({
	siteId,
	onCancel,
	onSaved,
}: AddRentedFormProps) {
	const supabase = createClient();
	const [user, setUser] = useState<any>(null);
	useEffect(() => {
		supabase.auth.getUser().then(({ data }) => {
			if (data?.user) setUser(data.user);
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

	const [categories, setCategories] = useState<any[]>([]);
	const [companyId, setCompanyId] = useState<string | null>(null);

	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		async function fetchContext() {
			if (!siteId) return;

			// Fetch company_id from site
			const { data: siteData } = await supabase
				.from('construction_sites')
				.select('company_id')
				.eq('id', siteId)
				.single();

			if (siteData?.company_id) {
				setCompanyId(siteData.company_id);

				// Fetch categories
				const { data: catData } = await supabase
					.from('categories')
					.select('id, primary_category')
					.eq('company_id', siteData.company_id)
					.order('primary_category');

				if (catData) {
					setCategories(catData);
				}
			}
		}
		fetchContext();
	}, [siteId]);

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

			// Get a default unit (UN)
			const { data: units } = await supabase
				.from('measurement_units')
				.select('id')
				.eq('company_id', companyId)
				.eq('abbreviation', 'UN')
				.limit(1);

			const unitId = units?.[0]?.id || null; // Fallback to null if not found

			// 1. Create Catalog Item
			const { data: catalogItem, error: catalogError } = await supabase
				.from('catalogs')
				.insert({
					company_id: companyId,
					category_id: categoryId,
					unit_id: unitId,
					name: `[ALUGADO] ${name}`,
					is_stock_controlled: true,
					is_rented_equipment: true,
					is_tool: listType === 'FERRAMENTA',
				})
				.select('id')
				.single();

			if (catalogError) throw catalogError;
			const catalogId = catalogItem.id;

			// 2. Add to Site Inventory
			const { data: inventoryItem, error: invError } = await supabase
				.from('site_inventory')
				.insert({
					site_id: siteId,
					catalog_id: catalogId,
					quantity: Number(quantity),
				})
				.select('id')
				.single();

			if (invError) throw invError;
			const inventoryId = inventoryItem.id;

			// 3. Link to EPI or Tools list
			if (listType === 'EPI') {
				await supabase.from('site_epis').insert({
					site_id: siteId,
					inventory_id: inventoryId,
				});
			} else {
				await supabase.from('site_tools').insert({
					site_id: siteId,
					inventory_id: inventoryId,
				});
			}

			// 4. Record Entry Movement
			await supabase.from('site_movements').insert({
				site_id: siteId,
				inventory_id: inventoryId,
				created_by: user.id,
				type: 'IN',
				quantity_delta: Number(quantity),
				reason: 'PURCHASE',
			});

			// 5. Record Rented Equipment
			const { error: rentError } = await supabase
				.from('rented_equipments')
				.insert({
					site_id: siteId,
					name,
					category: categoryName,
					quantity: Number(quantity),
					entry_date: new Date(entryDate).toISOString(),
					status: 'ACTIVE',
					description: observations,
					inventory_id: inventoryId,
				});

			if (rentError) throw rentError;

			onSaved();
		} catch (err: any) {
			console.error(err);
			setError(err.message || 'Erro ao salvar o equipamento.');
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
							<select
								value={categoryId}
								onChange={(e) => setCategoryId(e.target.value)}
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#101828]"
								required
							>
								<option value="">Selecione...</option>
								{categories.map((c) => (
									<option key={c.id} value={c.id}>
										{c.primary_category}
									</option>
								))}
							</select>
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
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Destino no Sistema *
							</label>
							<div className="flex gap-4">
								<label className="flex items-center gap-2 cursor-pointer">
									<input
										type="radio"
										name="listType"
										value="FERRAMENTA"
										checked={listType === 'FERRAMENTA'}
										onChange={() =>
											setListType('FERRAMENTA')
										}
										className="w-4 h-4 text-[#101828] focus:ring-[#101828]"
									/>
									<span className="text-sm font-medium text-gray-700">
										Ferramentas
									</span>
								</label>
								<label className="flex items-center gap-2 cursor-pointer">
									<input
										type="radio"
										name="listType"
										value="EPI"
										checked={listType === 'EPI'}
										onChange={() => setListType('EPI')}
										className="w-4 h-4 text-[#101828] focus:ring-[#101828]"
									/>
									<span className="text-sm font-medium text-gray-700">
										EPIs
									</span>
								</label>
							</div>
							<p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
								<Info className="w-3 h-3" />O item também
								aparecerá automaticamente no botão de
								Almoxarifado.
							</p>
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
		</div>
	);
}
