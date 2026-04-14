import React, { useState } from 'react';
import { Search, Check, Users, X, Grip, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AddSiteCollaboratorFormProps {
	onCancel: () => void;
	onSaved: () => void;
	siteId: string;
}

export function AddSiteCollaboratorForm({
	onCancel,
	onSaved,
	siteId,
}: AddSiteCollaboratorFormProps) {
	const [searchTerm, setSearchTerm] = useState('');
	const [selectedItems, setSelectedItems] = useState<string[]>([]);

	// Simulated global collaborators
	const [globalItems] = useState([
		{
			id: '1',
			name: 'João da Silva',
			role: 'Pedreiro',
			cpf: '111.222.333-44',
			department: 'Construção Civil',
			shift: 'Integral',
		},
		{
			id: '2',
			name: 'Maria Souza',
			role: 'Mestre de Obras',
			cpf: '222.333.444-55',
			department: 'Gestão de Obras',
			shift: 'Integral',
		},
		{
			id: '3',
			name: 'Carlos Ferreira',
			role: 'Eletricista',
			cpf: '333.444.555-66',
			department: 'Instalações',
			shift: 'Integral',
		},
		{
			id: '4',
			name: 'Ana Oliveira',
			role: 'Engenheira Civil',
			cpf: '444.555.666-77',
			department: 'Engenharia',
			shift: 'Integral',
		},
		{
			id: '5',
			name: 'Paulo Santos',
			role: 'Encanador',
			cpf: '555.666.777-88',
			department: 'Instalações',
			shift: 'Integral',
		},
		{
			id: '6',
			name: 'Fernanda Lima',
			role: 'Arquiteta',
			cpf: '666.777.888-99',
			department: 'Arquitetura',
			shift: 'Meio Período',
		},
		{
			id: '7',
			name: 'Lucas Pereira',
			role: 'Servente',
			cpf: '777.888.999-00',
			department: 'Construção Civil',
			shift: 'Integral',
		},
		{
			id: '8',
			name: 'Juliana Castro',
			role: 'Técnica de Segurança',
			cpf: '888.999.000-11',
			department: 'Segurança do Trabalho',
			shift: 'Integral',
		},
		{
			id: '9',
			name: 'Marcos Almeida',
			role: 'Armador',
			cpf: '999.000.111-22',
			department: 'Estruturas',
			shift: 'Integral',
		},
		{
			id: '10',
			name: 'Patricia Dias',
			role: 'Pintora',
			cpf: '000.111.222-33',
			department: 'Acabamentos',
			shift: 'Integral',
		},
		{
			id: '11',
			name: 'Ricardo Mendes',
			role: 'Carpinteiro',
			cpf: '123.234.345-45',
			department: 'Estruturas',
			shift: 'Meio Período',
		},
		{
			id: '12',
			name: 'Camila Rocha',
			role: 'Gesseira',
			cpf: '234.345.456-56',
			department: 'Acabamentos',
			shift: 'Integral',
		},
	]);

	const filteredItems = globalItems.filter(
		(item) =>
			item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			item.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
			item.cpf.includes(searchTerm.toLowerCase()) ||
			item.department.toLowerCase().includes(searchTerm.toLowerCase()),
	);

	const toggleSelection = (id: string) => {
		setSelectedItems((prev) => {
			if (prev.includes(id)) {
				return prev.filter((i) => i !== id);
			}
			return [...prev, id];
		});
	};

	const handleSave = () => {
		console.log({ selectedItems, siteId });
		onSaved();
	};

	return (
		<div className="bg-white text-gray-900 rounded-xl shadow-2xl border border-gray-200 w-[800px] h-[650px] max-w-[95vw] max-h-[90vh] flex flex-col">
			<div className="p-6 border-b border-gray-200 flex justify-between items-start shrink-0">
				<div>
					<h2 className="text-xl font-bold text-gray-900 tracking-tight">
						Alojar Colaboradores na Obra
					</h2>
					<p className="text-sm text-gray-500 mt-1">
						Selecione os colaboradores do cadastro global que serão
						alocados para esta obra.
					</p>
				</div>
				<button
					onClick={onCancel}
					className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-[5px] transition-colors p-1.5"
				>
					<X size={20} />
				</button>
			</div>

			<div className="p-6 flex-1 overflow-hidden flex flex-col bg-gray-50/50">
				<div className="flex flex-col h-full">
					<div className="flex flex-col gap-2 mb-5 shrink-0">
						<div className="relative">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
							<input
								type="text"
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								placeholder="Pesquise por nome, função, CPF ou departamento..."
								className="w-full bg-white border border-gray-300 rounded-[5px] py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#101828]/20 focus:border-[#101828] shadow-sm transition-all"
							/>
						</div>
					</div>

					<div className="grid grid-cols-1 gap-3 overflow-y-auto pr-2 rounded-[5px] flex-1 pb-4">
						{filteredItems.map((item) => {
							const isSelected = selectedItems.includes(item.id);
							return (
								<div
									key={item.id}
									onClick={() => toggleSelection(item.id)}
									className={`group flex items-start gap-4 p-4 rounded-lg cursor-pointer border transition-all duration-200 ${
										isSelected
											? 'bg-blue-50/50 border-[#101828] shadow-sm'
											: 'bg-white border-gray-200 hover:border-[#101828]/50 hover:shadow-sm'
									}`}
								>
									<div
										className={`mt-1 w-5 h-5 shrink-0 rounded-[5px] border flex items-center justify-center transition-all duration-200 ${
											isSelected
												? 'bg-[#101828] border-[#101828] text-white'
												: 'border-gray-300 bg-gray-50 group-hover:border-[#101828]/50'
										}`}
									>
										{isSelected && (
											<Check size={14} strokeWidth={3} />
										)}
									</div>

									{/* Avatar placeholder */}
									<div className="hidden sm:flex w-10 h-10 rounded-full bg-gray-100 flex-shrink-0 items-center justify-center border border-gray-200 mt-0.5">
										<UserCircle className="w-6 h-6 text-gray-400" />
									</div>

									<div className="flex flex-1 flex-col sm:flex-row sm:items-center justify-between gap-3">
										<div className="flex flex-col gap-1">
											<div className="font-semibold text-sm text-gray-900 group-hover:text-[#101828] transition-colors">
												{item.name}
											</div>
											<div className="flex items-center gap-2 text-xs font-medium text-gray-500">
												<div className="flex items-center gap-1.5">
													<Grip
														size={12}
														className="text-gray-400"
													/>
													<span className="bg-gray-100 px-2 py-0.5 rounded-[5px]">
														{item.department}
													</span>
												</div>
												<span className="text-gray-300">
													•
												</span>
												<span className="text-gray-500">
													{item.role}
												</span>
											</div>
										</div>
										<div className="flex flex-col sm:items-end gap-1.5 mt-2 sm:mt-0">
											<div className="inline-flex items-center text-xs font-mono font-medium text-gray-600 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-[5px]">
												CPF: {item.cpf}
											</div>
											<div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
												{item.shift}
											</div>
										</div>
									</div>
								</div>
							);
						})}

						{filteredItems.length === 0 && (
							<div className="text-center py-16 flex flex-col items-center justify-center h-full">
								<div className="w-16 h-16 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center mb-4">
									<Users className="w-8 h-8 text-gray-300" />
								</div>
								<p className="text-sm font-semibold text-gray-700">
									Nenhum colaborador encontrado
								</p>
								<p className="text-xs text-gray-500 mt-1.5 max-w-[250px] leading-relaxed">
									Não encontramos nenhum colaborador
									correspondente à sua pesquisa no cadastro
									global.
								</p>
							</div>
						)}
					</div>
				</div>
			</div>

			<div className="p-5 border-t border-gray-200 flex flex-row items-center justify-between bg-white rounded-b-xl shrink-0">
				<div className="text-sm font-medium text-gray-600">
					Selecionados:{' '}
					<span className="font-bold text-[#101828] bg-blue-50 px-2 py-0.5 rounded-[5px]">
						{selectedItems.length}
					</span>
				</div>
				<div className="flex items-center gap-3">
					<Button
						variant="ghost"
						onClick={onCancel}
						className="text-gray-600 hover:bg-gray-100 hover:text-gray-900 font-semibold rounded-[5px] px-6"
					>
						Cancelar
					</Button>

					<Button
						onClick={handleSave}
						disabled={selectedItems.length === 0}
						className="bg-[#101828] hover:bg-[#1b263b] text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-md rounded-[5px] px-8 transition-colors"
					>
						Alojar na Obra
					</Button>
				</div>
			</div>
		</div>
	);
}
