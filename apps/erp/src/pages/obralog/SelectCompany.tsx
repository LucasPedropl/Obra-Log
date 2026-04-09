import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Loader2, LogOut, Plus } from 'lucide-react';
import { supabase } from '../../config/supabase';
import { authService } from '../../features/auth/services/auth.service';

export default function SelectCompany() {
	const [tenant, setTenant] = useState<any>(null);
	const [instances, setInstances] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');

	// Create instance state
	const [isCreating, setIsCreating] = useState(false);
	const [newInstanceName, setNewInstanceName] = useState('');
	const [savingInstance, setSavingInstance] = useState(false);

	const navigate = useNavigate();

	useEffect(() => {
		fetchData();
	}, []);

	const fetchData = async () => {
		try {
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (!user) throw new Error('Usuário não autenticado');

			// Fetch companies user is linked to (Tenants)
			const userCompanies = await authService.getUserCompanies(user.id);
			const validTenants = (userCompanies
				?.map((cu: any) => cu.companies)
				.filter((c: any) => c && c.active && !c.parent_id) ||
				[]) as any[];

			if (validTenants.length === 0) {
				// Fallback: If no tenants, check if they are linked to instances directly
				const validInstances = (userCompanies
					?.map((cu: any) => cu.companies)
					.filter((c: any) => c && c.active && c.parent_id) ||
					[]) as any[];

				if (validInstances.length === 0) {
					throw new Error(
						'Você não está vinculado a nenhuma empresa ativa.',
					);
				}

				if (validInstances.length === 1) {
					handleSelect(validInstances[0].id);
					return;
				} else {
					setInstances(validInstances);
					setLoading(false);
					return;
				}
			}

			// We assume 1 tenant per user for now
			const currentTenant = validTenants[0];
			setTenant(currentTenant);

			// Fetch instances for this tenant
			const tenantInstances = await authService.getCompanyInstances(
				currentTenant.id,
			);
			setInstances(tenantInstances || []);

			if (tenantInstances.length === 0) {
				setIsCreating(true); // Force create if 0 instances
			}
		} catch (err: any) {
			setError(err.message || 'Erro ao carregar empresas');
		} finally {
			setLoading(false);
		}
	};

	const handleSelect = async (companyId: string) => {
		localStorage.setItem('selectedCompanyId', companyId);
		window.dispatchEvent(new Event('storage'));
		navigate('/app/dashboard');
	};

	const handleCreateInstance = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!tenant || !newInstanceName.trim()) return;

		setSavingInstance(true);
		try {
			await authService.createCompanyInstance(tenant.id, newInstanceName);
			setNewInstanceName('');
			setIsCreating(false);
			await fetchData(); // Reload instances
		} catch (err: any) {
			setError(err.message || 'Erro ao criar instância');
		} finally {
			setSavingInstance(false);
		}
	};

	const handleLogout = async () => {
		await authService.logout();
		navigate('/app/login');
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-slate-900 flex items-center justify-center">
				<Loader2 className="animate-spin text-emerald-500 w-12 h-12" />
			</div>
		);
	}

	// FORCE CREATION SCREEN
	if (isCreating) {
		return (
			<div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
				<div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center animate-fade-in">
					<div className="flex flex-col items-center mb-6">
						<div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-4">
							<Building2 size={32} />
						</div>
						<h1 className="text-2xl font-bold text-slate-900">
							{instances.length === 0
								? 'Configurar Sistema'
								: 'Nova Instância'}
						</h1>
						<p className="text-slate-500 text-sm mt-2">
							{instances.length === 0
								? 'Bem-vindo! Para começar, cadastre os dados da sua empresa dona da instância:'
								: 'Adicione o nome da nova instância (empresa) que utilizará o sistema.'}
						</p>
					</div>

					{error && (
						<div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 text-left">
							{error}
						</div>
					)}

					<form onSubmit={handleCreateInstance} className="space-y-4">
						<div className="text-left">
							<label className="block text-sm font-medium text-slate-700 mb-1">
								Razão Social / Nome da Instância
							</label>
							<input
								type="text"
								value={newInstanceName}
								onChange={(e) =>
									setNewInstanceName(e.target.value)
								}
								required
								className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
								placeholder="Construtora Exemplo Ltda."
							/>
						</div>

						<div className="flex gap-3 mt-6">
							{instances.length > 0 && (
								<button
									type="button"
									onClick={() => setIsCreating(false)}
									className="flex-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center"
								>
									Cancelar
								</button>
							)}
							<button
								type="submit"
								disabled={savingInstance}
								className={`flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center ${instances.length === 0 ? 'w-full' : ''}`}
							>
								{savingInstance ? (
									<Loader2 className="animate-spin w-5 h-5" />
								) : instances.length === 0 ? (
									'Concluir'
								) : (
									'Adicionar'
								)}
							</button>
						</div>
					</form>

					{instances.length === 0 && (
						<button
							onClick={handleLogout}
							className="mt-6 w-full flex items-center justify-center gap-2 text-slate-500 hover:text-slate-700 text-sm font-medium transition-colors"
						>
							<LogOut size={16} /> Sair
						</button>
					)}
				</div>
			</div>
		);
	}

	// NETFLIX STYLE SELECTION SCREEN
	return (
		<div className="min-h-screen bg-[#111] flex flex-col items-center justify-center p-4">
			<div className="w-full max-w-5xl mx-auto flex flex-col items-center animate-fade-in">
				<h1 className="text-4xl md:text-5xl font-bold text-white mb-12 text-center">
					Quem está acessando?
				</h1>

				{error && (
					<div className="mb-8 p-3 bg-red-900/50 text-red-200 border border-red-800 rounded-lg max-w-md w-full text-center">
						{error}
					</div>
				)}

				<div className="flex flex-wrap justify-center gap-6 md:gap-10">
					{instances.map((instance) => (
						<button
							key={instance.id}
							onClick={() => handleSelect(instance.id)}
							className="group flex flex-col items-center transition-transform hover:scale-105"
						>
							<div className="w-32 h-32 md:w-40 md:h-40 rounded-lg bg-emerald-600 flex items-center justify-center shadow-lg border-2 border-transparent group-hover:border-white transition-all overflow-hidden mb-3">
								<span className="text-5xl md:text-6xl font-bold text-white uppercase tracking-tighter">
									{instance.name.substring(0, 2)}
								</span>
							</div>
							<span className="text-slate-400 group-hover:text-white font-medium text-lg transition-colors truncate w-32 md:w-40 text-center">
								{instance.name}
							</span>
						</button>
					))}

					{/* Plus Button (If under max_instances or max_instances is unlimited) */}
					{tenant &&
						(!tenant.max_instances ||
							instances.length < tenant.max_instances) && (
							<button
								onClick={() => setIsCreating(true)}
								className="group flex flex-col items-center transition-transform hover:scale-105"
							>
								<div className="w-32 h-32 md:w-40 md:h-40 rounded-lg flex items-center justify-center border-2 border-slate-600 hover:border-slate-300 hover:bg-slate-800/50 transition-all mb-3">
									<Plus
										size={48}
										className="text-slate-500 group-hover:text-slate-300"
									/>
								</div>
								<span className="text-slate-500 group-hover:text-slate-300 font-medium text-lg transition-colors">
									Nova Instância
								</span>
							</button>
						)}
				</div>

				<button
					onClick={handleLogout}
					className="mt-16 flex items-center justify-center gap-2 text-slate-500 border border-slate-700 hover:border-slate-500 hover:text-slate-300 px-6 py-2 rounded-full text-sm font-medium transition-colors"
				>
					<LogOut size={16} /> Sair
				</button>
			</div>
		</div>
	);
}
