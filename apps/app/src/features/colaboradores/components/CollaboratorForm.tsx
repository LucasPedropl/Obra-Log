'use client';

import { createAccessProfileAdmin } from '@/app/actions/adminActions';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { useToast } from '@/components/ui/toaster';
import { createClient } from '@/config/supabase';
import { AccessProfileForm } from '@/features/admin/components/AccessProfileForm';
import { maskCEP, maskCPF, maskDate, maskPhone, unmask } from '@/lib/maskUtils';
import { getActiveCompanyId } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import {
	Calendar,
	Check,
	ChevronLeft,
	ChevronRight,
	File,
	FileText,
	Info,
	Loader2,
	Mail,
	MapPin,
	Phone,
	Shield,
	Smartphone,
	UploadCloud,
	User,
	X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
	CollaboratorFormData,
	collaboratorSchema,
	useCollaborators,
} from '../hooks/useCollaborators';

interface CollaboratorFormProps {
	onCancel?: () => void;
	initialData?: {
		id?: string;
		name?: string;
		role_title?: string;
		cpf?: string;
		rg?: string;
		birth_date?: string | Date;
		cellphone?: string;
		email?: string;
		cep?: string;
		street?: string;
		number?: string;
		neighborhood?: string;
		complement?: string;
		city?: string;
		state?: string;
		profile_id?: string;
		documents_json?: any[];
	};
}

const InputLabel = ({ children }: { children: React.ReactNode }) => (
	<label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 ml-1">
		{children}
	</label>
);

const InputClass =
	'block w-full rounded-2xl border-2 border-slate-100 bg-slate-50/50 px-4 py-3.5 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all duration-200 hover:border-slate-200 focus:border-slate-900 focus:bg-white focus:ring-0 disabled:opacity-50 disabled:cursor-not-allowed';

export function CollaboratorForm({
	onCancel,
	initialData,
}: CollaboratorFormProps) {
	const supabase = createClient();
	const { addToast } = useToast();
	const [currentStep, setCurrentStep] = useState(1);
	const [accessProfiles, setAccessProfiles] = useState<any[]>([]);
	const [documents, setDocuments] = useState<any[]>(
		initialData?.documents_json || [],
	);
	const [isUploading, setIsUploading] = useState(false);
	const [isFetchingCep, setIsFetchingCep] = useState(false);

	// Novos estados solicitados
	const [isProfileSelectOpen, setIsProfileSelectOpen] = useState(false);
	const [showProfileModal, setShowProfileModal] = useState(false);
	const [isCreatingProfile, setIsCreatingProfile] = useState(false);

	const {
		createCollaborator,
		updateCollaborator,
		fetchAccessProfiles,
		isLoading,
		error,
	} = useCollaborators();

	const {
		register,
		handleSubmit,
		control,
		setValue,
		trigger,
		formState: { errors },
	} = useForm<CollaboratorFormData>({
		resolver: zodResolver(collaboratorSchema),
		mode: 'onChange',
		defaultValues: initialData
			? {
					name: initialData.name || '',
					role_title: initialData.role_title || '',
					cpf: initialData.cpf || '',
					rg: initialData.rg || '',
					birth_date: initialData.birth_date
						? new Date(initialData.birth_date)
								.toISOString()
								.split('T')[0]
								.split('-')
								.reverse()
								.join('/')
						: '',
					cellphone: initialData.cellphone || '',
					email: initialData.email || '',
					cep: initialData.cep || '',
					street: initialData.street || '',
					number: initialData.number || '',
					neighborhood: initialData.neighborhood || '',
					complement: initialData.complement || '',
					city: initialData.city || '',
					state: initialData.state || '',
					profile_id: initialData.profile_id || '',
					documents_json: initialData.documents_json || [],
				}
			: {
					documents_json: [],
				},
	});

	const loadProfiles = async () => {
		const data = await fetchAccessProfiles();
		setAccessProfiles(data);
	};

	useEffect(() => {
		loadProfiles();
	}, []);

	useEffect(() => {
		setValue('documents_json', documents);
	}, [documents, setValue]);

	const handleCEPBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
		const cep = unmask(e.target.value);
		if (cep.length !== 8) return;

		setIsFetchingCep(true);
		try {
			const response = await fetch(
				`https://viacep.com.br/ws/${cep}/json/`,
			);
			const data = await response.json();

			if (data.erro) {
				addToast('CEP não encontrado.', 'error');
				return;
			}

			setValue('street', data.logradouro);
			setValue('neighborhood', data.bairro);
			setValue('city', data.localidade);
			setValue('state', data.uf);

			trigger(['street', 'neighborhood', 'city', 'state']);
			addToast('Endereço preenchido automaticamente!', 'success');
		} catch (err) {
			console.error('CEP error:', err);
		} finally {
			setIsFetchingCep(false);
		}
	};

	const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		if (!files || files.length === 0) return;

		const companyId = getActiveCompanyId();
		if (!companyId) {
			addToast('Erro: Empresa não identificada.', 'error');
			return;
		}

		setIsUploading(true);
		try {
			for (let i = 0; i < files.length; i++) {
				const file = files[i];
				const fileExt = file.name.split('.').pop();
				const fileName = `${crypto.randomUUID()}.${fileExt}`;
				const filePath = `${companyId}/${fileName}`;

				const { error: uploadError } = await supabase.storage
					.from('collaborator-documents')
					.upload(filePath, file);

				if (uploadError) throw uploadError;

				const {
					data: { publicUrl },
				} = supabase.storage
					.from('collaborator-documents')
					.getPublicUrl(filePath);

				setDocuments((prev) => [
					...prev,
					{ name: file.name, url: publicUrl, path: filePath },
				]);
			}
			addToast('Arquivo(s) enviado(s) com sucesso!', 'success');
		} catch (err: any) {
			console.error('Upload error:', err);
			addToast(`Erro no upload: ${err.message}`, 'error');
		} finally {
			setIsUploading(false);
			if (e.target) e.target.value = '';
		}
	};

	const removeDocument = async (index: number) => {
		const doc = documents[index];
		if (doc.path) {
			await supabase.storage
				.from('collaborator-documents')
				.remove([doc.path]);
		}
		setDocuments((prev) => prev.filter((_, i) => i !== index));
	};

	const onSubmit = async (data: CollaboratorFormData) => {
		let success;
		if (initialData?.id) {
			success = await updateCollaborator(initialData.id, data);
			if (success) {
				addToast('Colaborador atualizado com sucesso!', 'success');
			}
		} else {
			success = await createCollaborator(data);
			if (success) {
				addToast('Colaborador cadastrado com sucesso!', 'success');
			}
		}

		if (success && onCancel) {
			onCancel();
		}
	};

	const nextStep = async () => {
		let fieldsToValidate: (keyof CollaboratorFormData)[] = [];

		if (currentStep === 1) {
			fieldsToValidate = ['name', 'cpf', 'role_title'];
		} else if (currentStep === 2) {
			fieldsToValidate = ['birth_date', 'cellphone', 'email'];
		} else if (currentStep === 3) {
			fieldsToValidate = [
				'cep',
				'street',
				'number',
				'neighborhood',
				'city',
				'state',
			];
		}

		const isStepValid = await trigger(fieldsToValidate);
		if (isStepValid) {
			setCurrentStep((prev) => Math.min(prev + 1, 4));
		} else {
			addToast('Preencha os campos obrigatórios corretamente.', 'error');
		}
	};

	const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

	const handleCreateProfile = async (profileData: any) => {
		setIsCreatingProfile(true);
		try {
			const companyId = getActiveCompanyId();
			if (!companyId) throw new Error('Empresa não identificada');

			await createAccessProfileAdmin({
				...profileData,
				company_id: companyId,
			});

			addToast('Perfil de acesso criado com sucesso!', 'success');
			await loadProfiles();
			setShowProfileModal(false);
		} catch (err: any) {
			console.error('Error creating profile:', err);
			addToast(`Erro ao criar perfil: ${err.message}`, 'error');
		} finally {
			setIsCreatingProfile(false);
		}
	};

	const steps = [
		{ id: 1, title: 'Identificação', icon: User },
		{ id: 2, title: 'Contato', icon: Phone },
		{ id: 3, title: 'Endereço', icon: MapPin },
		{ id: 4, title: 'Documentos', icon: FileText },
	];

	return (
		<div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl flex flex-col transition-all mx-auto font-sans text-slate-800 border border-slate-100 max-h-[90vh] relative">
			{/* Modal de Cadastro de Perfil (Overlay) */}
			{showProfileModal && (
				<div 
					className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto"
					onClick={() => setShowProfileModal(false)}
				>
					<div 
						className="relative w-full max-w-3xl mt-8 md:mt-0 animate-in fade-in zoom-in duration-300 bg-white p-8 rounded-2xl shadow-2xl border overflow-hidden max-h-[90vh]"
						onClick={(e) => e.stopPropagation()}
					>
						<button 
							onClick={() => setShowProfileModal(false)}
							className="absolute top-4 right-4 z-10 p-2 text-muted-foreground hover:bg-muted/30 rounded-full transition-colors"
						>
							<X size={20} />
						</button>

						<AccessProfileForm 
							companyId={getActiveCompanyId() || ''}
							onSubmit={handleCreateProfile}
							onCancel={() => setShowProfileModal(false)}
							isLoading={isCreatingProfile}
						/>
					</div>
				</div>
			)}

			{/* Header */}
			<div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white/50 backdrop-blur-sm z-10 rounded-t-3xl">
				<div>
					<h1 className="text-2xl font-bold tracking-tight text-slate-900">
						{initialData
							? 'Editar Colaborador'
							: 'Novo Colaborador'}
					</h1>
					<p className="text-sm text-slate-500 mt-1">
						Preencha os dados para manter o cadastro atualizado.
					</p>
				</div>
				<div className="flex items-center gap-4">
					<span className="bg-slate-100 text-slate-700 px-4 py-1.5 rounded-full text-[10px] md:text-xs font-bold tracking-widest uppercase">
						PASSO {currentStep}/4
					</span>
					{onCancel && (
						<button
							onClick={onCancel}
							className="text-slate-400 hover:text-slate-600 transition-colors bg-slate-50 hover:bg-slate-100 p-2 rounded-full"
						>
							<X size={20} />
						</button>
					)}
				</div>
			</div>

			{/* Stepper */}
			<div className="px-6 md:px-10 pt-8 pb-8">
				<div className="relative flex justify-between items-center">
					{/* Linha de fundo */}
					<div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-[3px] bg-slate-100 rounded-full z-0"></div>
					{/* Linha de progresso */}
					<div
						className="absolute left-0 top-1/2 -translate-y-1/2 h-[3px] bg-slate-900 rounded-full z-0 transition-all duration-500 ease-in-out"
						style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
					></div>

					{steps.map((step) => {
						const Icon = step.icon;
						const isActive = currentStep === step.id;
						const isCompleted = currentStep > step.id;

						return (
							<div
								key={step.id}
								className="relative z-10 flex flex-col items-center"
							>
								<div
									className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all duration-300 border-[3px]
										${isActive ? 'bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-900/20 scale-110' : ''}
										${isCompleted ? 'bg-slate-900 border-slate-900 text-white' : ''}
										${!isActive && !isCompleted ? 'bg-white border-slate-100 text-slate-400' : ''}
									`}
								>
									{isCompleted ? (
										<Check size={20} strokeWidth={3} />
									) : (
										<Icon size={20} />
									)}
								</div>
								<span
									className={`absolute -bottom-8 text-[9px] md:text-[11px] font-bold uppercase tracking-wider transition-colors whitespace-nowrap
									${isActive ? 'text-slate-900' : isCompleted ? 'text-slate-700' : 'text-slate-300'}
									${!isActive ? 'hidden sm:block' : ''}
								`}
								>
									{step.title}
								</span>
							</div>
						);
					})}
				</div>
			</div>

			{/* Form Area */}
			<form
				className="flex-1 flex flex-col overflow-hidden"
				onKeyDown={(e) => {
					if (e.key === 'Enter') e.preventDefault();
				}}
			>
				<div
					className="px-6 md:px-10 py-6 md:py-10 flex-1 overflow-x-hidden overflow-y-auto custom-scrollbar"
					style={{ scrollbarGutter: 'stable' }}
				>
					{error && (
						<div className="mb-8 p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
							<X size={18} />
							<span className="font-semibold">{error}</span>
						</div>
					)}

				<div className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both min-h-[400px]">
					{/* STEP 1 */}
					{currentStep === 1 && (
						<div className="space-y-6">
							<div>
								<InputLabel>Nome Completo *</InputLabel>
								<div className="relative group">
									<div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-slate-900 transition-colors">
										<User size={18} />
									</div>
									<input
										type="text"
										{...register('name')}
										placeholder="Ex: João Silva"
										className={`${InputClass} pl-11`}
									/>
								</div>
								{errors.name && (
									<span className="text-red-500 text-[10px] font-bold uppercase mt-1 ml-1">
										{errors.name.message}
									</span>
								)}
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div>
									<InputLabel>CPF *</InputLabel>
									<div className="relative group">
										<input
											type="text"
											{...register('cpf')}
											onChange={(e) =>
												setValue(
													'cpf',
													maskCPF(e.target.value),
												)
											}
											placeholder="000.000.000-00"
											className={InputClass}
										/>
									</div>
									{errors.cpf && (
										<span className="text-red-500 text-[10px] font-bold uppercase mt-1 ml-1">
											{errors.cpf.message}
										</span>
									)}
								</div>
								<div>
									<InputLabel>Cargo / Função *</InputLabel>
									<input
										type="text"
										{...register('role_title')}
										placeholder="Ex: Engenheiro Civil"
										className={InputClass}
									/>
									{errors.role_title && (
										<span className="text-red-500 text-[10px] font-bold uppercase mt-1 ml-1">
											{errors.role_title.message}
										</span>
									)}
								</div>
							</div>

							<div>
								<InputLabel>
									Perfil de Acesso (Opcional)
								</InputLabel>
								<Controller
									name="profile_id"
									control={control}
									render={({ field }) => (
										<SearchableSelect
											options={accessProfiles.map(
												(p) => ({
													value: p.id,
													label: p.name,
												}),
											)}
											value={field.value || ''}
											onChange={field.onChange}
											placeholder="Selecione um perfil de acesso..."
											onOpenChange={
												setIsProfileSelectOpen
											}
											onCreate={() =>
												setShowProfileModal(true)
											}
										/>
									)}
								/>
							</div>
						</div>
					)}

					{/* STEP 2 */}
					{currentStep === 2 && (
						<div className="space-y-6 min-h-[400px]">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div>
									<InputLabel>Data de Nascimento</InputLabel>
									<div className="relative group">
										<div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-slate-900 transition-colors">
											<Calendar size={18} />
										</div>
										<input
											type="text"
											{...register('birth_date')}
											onChange={(e) =>
												setValue(
													'birth_date',
													maskDate(e.target.value),
												)
											}
											placeholder="DD/MM/AAAA"
											className={`${InputClass} pl-11`}
										/>
									</div>
								</div>
								<div>
									<InputLabel>Celular</InputLabel>
									<div className="relative group">
										<div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-slate-900 transition-colors">
											<Smartphone size={18} />
										</div>
										<input
											type="text"
											{...register('cellphone')}
											onChange={(e) =>
												setValue(
													'cellphone',
													maskPhone(e.target.value),
												)
											}
											placeholder="(00) 00000-0000"
											className={`${InputClass} pl-11`}
										/>
									</div>
								</div>
							</div>

							<div>
								<InputLabel>
									E-mail Corporativo ou Pessoal
								</InputLabel>
								<div className="relative group">
									<div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-slate-900 transition-colors">
										<Mail size={18} />
									</div>
									<input
										type="email"
										{...register('email')}
										placeholder="email@empresa.com"
										className={`${InputClass} pl-11`}
									/>
								</div>
								{errors.email && (
									<span className="text-red-500 text-[10px] font-bold uppercase mt-1 ml-1">
										{errors.email.message}
									</span>
								)}
							</div>
						</div>
					)}

					{/* STEP 3 */}
					{currentStep === 3 && (
						<div className="space-y-6 min-h-[400px]">
							<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
								<div className="md:col-span-1">
									<InputLabel>CEP</InputLabel>
									<div className="relative">
										<input
											type="text"
											{...register('cep')}
											onChange={(e) =>
												setValue(
													'cep',
													maskCEP(e.target.value),
												)
											}
											onBlur={handleCEPBlur}
											placeholder="00000-000"
											className={InputClass}
										/>
										{isFetchingCep && (
											<div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
												<Loader2
													size={16}
													className="animate-spin text-slate-400"
												/>
											</div>
										)}
									</div>
								</div>
								<div className="md:col-span-2">
									<InputLabel>Rua / Logradouro</InputLabel>
									<input
										type="text"
										{...register('street')}
										placeholder="Ex: Av. Paulista"
										className={InputClass}
									/>
								</div>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div>
									<InputLabel>Número</InputLabel>
									<input
										type="text"
										{...register('number')}
										placeholder="Ex: 1000"
										className={InputClass}
									/>
								</div>
								<div>
									<InputLabel>Bairro</InputLabel>
									<input
										type="text"
										{...register('neighborhood')}
										placeholder="Ex: Bela Vista"
										className={InputClass}
									/>
								</div>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div>
									<InputLabel>Cidade</InputLabel>
									<input
										type="text"
										{...register('city')}
										placeholder="Ex: São Paulo"
										className={InputClass}
									/>
								</div>
								<div>
									<InputLabel>Estado (UF)</InputLabel>
									<input
										type="text"
										{...register('state')}
										maxLength={2}
										placeholder="Ex: SP"
										className={`${InputClass} uppercase`}
									/>
								</div>
							</div>
						</div>
					)}

					{/* STEP 4 */}
					{currentStep === 4 && (
						<div className="flex flex-col items-center justify-center h-full">
							<div className="w-full">
								<InputLabel>
									Anexar Documentos Pessoais
								</InputLabel>

								<div className="mt-2 group relative block w-full rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-8 md:p-12 text-center hover:border-slate-400 hover:bg-slate-50 transition-all duration-200">
									<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm border border-slate-100 mb-4 group-hover:scale-110 transition-transform duration-300">
										{isUploading ? (
											<Loader2 className="h-8 w-8 text-slate-700 animate-spin" />
										) : (
											<UploadCloud className="h-8 w-8 text-slate-700" />
										)}
									</div>
									<span className="mt-2 block text-base font-bold text-slate-900">
										Toque ou arraste arquivos
									</span>
									<span className="mt-1 block text-sm text-slate-500 font-medium">
										Formatos suportados: PDF, JPG, PNG (Máx
										5MB)
									</span>

									<input
										type="file"
										multiple
										onChange={handleFileUpload}
										disabled={isUploading}
										className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
									/>
								</div>
							</div>

							{documents.length > 0 && (
								<div className="w-full space-y-3 mt-8">
									<InputLabel>
										Arquivos Anexados ({documents.length})
									</InputLabel>
									<div className="grid grid-cols-1 gap-3">
										{documents.map((doc, idx) => (
											<div
												key={idx}
												className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl group hover:border-slate-300 transition-all"
											>
												<div className="flex items-center gap-4 overflow-hidden">
													<div className="w-10 h-10 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center text-slate-600">
														<File size={20} />
													</div>
													<div className="flex flex-col min-w-0">
														<a
															href={doc.url}
															target="_blank"
															rel="noopener noreferrer"
															className="text-sm font-bold text-slate-800 truncate hover:text-slate-900"
														>
															{doc.name}
														</a>
														<span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
															Ver arquivo
														</span>
													</div>
												</div>
												<button
													type="button"
													onClick={() =>
														removeDocument(idx)
													}
													className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
												>
													<X size={18} />
												</button>
											</div>
										))}
									</div>
								</div>
							)}

							<div className="mt-8 w-full flex items-start gap-3 bg-slate-50 border border-slate-100 p-4 rounded-2xl text-[13px] text-slate-600 leading-relaxed">
								<div className="mt-0.5 text-slate-400 shrink-0">
									<Info size={18} />
								</div>
								<p>
									Certifique-se de anexar cópias legíveis do{' '}
									<strong>RG ou CNH</strong>, e{' '}
									<strong>Comprovante de Residência</strong>.
									Você pode adicionar mais arquivos depois
									pelo painel.
								</p>
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Footer Actions */}
			<div className="px-6 md:px-8 py-6 bg-slate-50 border-t border-slate-100 flex justify-between items-center rounded-b-3xl">
				{currentStep === 1 ? (
					onCancel && (
						<button
							key="cancel-btn"
							type="button"
							onClick={onCancel}
							className="px-6 py-3 rounded-2xl border-2 border-slate-100 bg-white text-slate-700 font-bold text-sm hover:bg-slate-50 hover:border-slate-200 transition-all focus:ring-4 focus:ring-slate-100 focus:outline-none active:scale-95"
						>
							Cancelar
						</button>
					)
				) : (
					<button
						key="prev-btn"
						type="button"
						onClick={prevStep}
						className="px-6 py-3 rounded-2xl border-2 border-slate-100 bg-white text-slate-700 font-bold text-sm hover:bg-slate-50 hover:border-slate-200 transition-all focus:ring-4 focus:ring-slate-100 focus:outline-none flex items-center gap-2 active:scale-95"
					>
						<ChevronLeft size={18} /> Anterior
					</button>
				)}

				{currentStep < 4 ? (
					<button
						key="next-btn"
						type="button"
						onClick={nextStep}
						className="px-8 py-3 rounded-2xl bg-slate-900 text-white font-bold text-sm shadow-xl shadow-slate-200 hover:bg-slate-800 hover:shadow-slate-300 transition-all focus:ring-4 focus:ring-slate-900/20 focus:outline-none flex items-center gap-2 active:scale-95 group"
					>
						Continuar{' '}
						<ChevronRight className="w-4.5 h-4.5 group-hover:translate-x-1 transition-transform" />
					</button>
				) : (
					<button
						key="submit-btn"
						type="button"
						onClick={handleSubmit(onSubmit)}
						disabled={isLoading || isUploading}
						className="px-8 py-3 rounded-2xl bg-slate-900 text-white font-bold text-sm shadow-xl shadow-slate-200 hover:bg-slate-800 hover:shadow-slate-300 transition-all focus:ring-4 focus:ring-slate-900/20 focus:outline-none flex items-center gap-2 min-w-[160px] justify-center disabled:opacity-70 disabled:cursor-not-allowed active:scale-95"
					>
						{isLoading ? (
							<Loader2 className="w-4.5 h-4.5 animate-spin" />
						) : initialData ? (
							'Salvar Alterações'
						) : (
							'Finalizar Cadastro'
						)}
					</button>
				)}
			</div>
			</form>
		</div>
	);
}
