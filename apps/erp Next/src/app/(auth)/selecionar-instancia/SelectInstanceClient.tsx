'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Building2, ChevronRight } from 'lucide-react';
import { createClient } from '@/config/supabase';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface Company {
	id: string;
	name: string;
	fantasy_name: string;
	cnpj: string;
	parent_tenant_id?: string | null;
}

interface Instance {
	id: string;
	name: string;
	cnpj: string;
}

export function SelectInstanceClient() {
	const router = useRouter();
	const supabase = createClient();

	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [userId, setUserId] = useState<string | null>(null);
	const [companies, setCompanies] = useState<Company[]>([]);
	const [selectedParentCompany, setSelectedParentCompany] =
		useState<Company | null>(null);
	const [instances, setInstances] = useState<Instance[]>([]);
	const [loadingInstances, setLoadingInstances] = useState(false);

	useEffect(() => {
		const loadUserAndCompanies = async () => {
			try {
				const {
					data: { session },
				} = await supabase.auth.getSession();
				if (!session?.user) {
					router.push('/auth/login');
					return;
				}

				const currentUserId = session.user.id;
				setUserId(currentUserId);

				const response = await fetch(
					`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005'}/api/users/${currentUserId}/companies`,
					{
						headers: {
							Authorization: `Bearer ${session.access_token}`,
						},
					},
				);

				if (!response.ok) throw new Error('Falha ao buscar empresas');

				const data = await response.json();

				// Extraí a empresa (`companies`) do join do banco se vier aninhado, caso contrário usa o próprio objeto
				const mappedCompanies: Company[] = data.map(
					(item: Company | { companies: Company }) => 
						('companies' in item ? item.companies : item),
				);

				// Filtra valores nulos/vazios
				const validCompanies = mappedCompanies.filter(Boolean);

				setCompanies(validCompanies);

				// Se tiver apenas uma empresa raiz, seleciona automaticamente
				if (
					validCompanies.length === 1 &&
					!validCompanies[0].parent_tenant_id
				) {
					handleSelectCompany(validCompanies[0]);
				}
			} catch (err: unknown) {
				console.error(err);
				setError('Não foi possível carregar as empresas vinculadas.');
			} finally {
				setLoading(false);
			}
		};

		loadUserAndCompanies();
	}, []);

	const handleSelectCompany = async (company: Company) => {
		setSelectedParentCompany(company);
		setLoadingInstances(true);
		try {
			const {
				data: { session },
			} = await supabase.auth.getSession();

			const response = await fetch(
				`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005'}/api/companies/${company.id}/instances`,
				{
					headers: {
						Authorization: `Bearer ${session?.access_token}`,
					},
				},
			);
			if (!response.ok) throw new Error('Falha ao buscar instâncias');

			const data = await response.json();
			setInstances(data);
		} catch (err: unknown) {
			console.error(err);
			// Fallback ou erro
		} finally {
			setLoadingInstances(false);
		}
	};

	const handleSelectInstance = async (
		instanceId: string,
		companyId: string,
	) => {
		// No Next.js o ideal é salvar em Cookie para SSR ou localStorage para Hooks
		// Como o layout depende disso, Cookie é melhor.
		document.cookie = `selectedCompanyId=${instanceId}; path=/; max-age=86400; SameSite=Lax`;
		document.cookie = `parentCompanyId=${companyId}; path=/; max-age=86400; SameSite=Lax`;

		router.push('/dashboard');
		router.refresh();
	};

	const handleLogout = async () => {
		await supabase.auth.signOut();
		router.push('/auth/login');
		router.refresh();
	};

	const getInitials = (name: string) => {
		if (!name) return 'EX';
		return name
			.split(' ')
			.map((n) => n[0])
			.join('')
			.substring(0, 2)
			.toUpperCase();
	};

	return (
		<div className="min-h-screen bg-[#141414] text-white flex flex-col items-center justify-center p-4">
			<div className="absolute top-8 left-8">
				<img
					src="/logo-white.svg"
					alt="Obra-Log"
					className="h-8 opacity-90"
					onError={(e) => (e.currentTarget.style.display = 'none')}
				/>
				<h1 className="text-2xl font-bold tracking-tighter text-white">
					Obra<span className="text-blue-500">Log</span>
				</h1>
			</div>

			<Button
				variant="ghost"
				className="absolute top-8 right-8 text-gray-400 hover:text-white hover:bg-white/10"
				onClick={handleLogout}
			>
				<LogOut className="h-5 w-5 mr-2" />
				Sair
			</Button>

			<div className="w-full max-w-5xl text-center space-y-12 animate-in fade-in duration-500">
				<div className="space-y-4">
					<h2 className="text-4xl md:text-5xl font-medium tracking-tight">
						{!selectedParentCompany
							? 'Quem está acessando?'
							: `Selecione a filial de ${selectedParentCompany.fantasy_name || selectedParentCompany.name}`}
					</h2>
					<p className="text-gray-400 text-lg">
						{!selectedParentCompany
							? 'Escolha uma empresa para gerenciar.'
							: 'Escolha a instância (filial ou matriz) que deseja acessar.'}
					</p>
				</div>

				{loading && (
					<div className="flex justify-center gap-6 flex-wrap">
						{[1, 2, 3].map((i) => (
							<div
								key={i}
								className="flex flex-col items-center gap-4"
							>
								<Skeleton className="h-32 w-32 md:h-40 md:w-40 rounded-xl bg-white/10" />
								<Skeleton className="h-4 w-24 bg-white/10" />
							</div>
						))}
					</div>
				)}

				{!loading && !selectedParentCompany && (
					<div className="flex justify-center gap-6 flex-wrap items-start">
						{companies
							.filter((c) => !c.parent_tenant_id)
							.map((company) => (
								<button
									key={company.id}
									onClick={() => handleSelectCompany(company)}
									className="group flex flex-col items-center gap-4 transition-all duration-300 hover:-translate-y-2"
								>
									<div className="h-32 w-32 md:h-40 md:w-40 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shadow-lg border-2 border-transparent group-hover:border-white transition-colors duration-300 relative overflow-hidden">
										<span className="text-4xl md:text-5xl font-bold text-white/90 group-hover:text-white group-hover:scale-110 transition-transform duration-300">
											{getInitials(
												company.fantasy_name ||
													company.name,
											)}
										</span>
										<div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
									</div>
									<span className="text-gray-400 group-hover:text-white font-medium text-lg transition-colors">
										{company.fantasy_name || company.name}
									</span>
								</button>
							))}
						{companies.length === 0 && !error && (
							<div className="text-gray-400">
								Nenhuma empresa encontrada para este usuário.
							</div>
						)}
					</div>
				)}

				{selectedParentCompany && (
					<div className="flex flex-col items-center gap-8">
						<button
							onClick={() => setSelectedParentCompany(null)}
							className="text-gray-400 hover:text-white flex items-center text-sm transition-colors mb-4"
						>
							<ChevronRight className="h-4 w-4 mr-1 rotate-180" />
							Voltar para empresas
						</button>

						{loadingInstances ? (
							<div className="flex justify-center gap-6 flex-wrap">
								<Skeleton className="h-32 w-32 rounded-xl bg-white/10" />
							</div>
						) : (
							<div className="flex justify-center gap-6 flex-wrap items-start">
								{/* Opção da Matriz/Própria Empresa Se aplicável */}
								<button
									onClick={() =>
										handleSelectInstance(
											selectedParentCompany.id,
											selectedParentCompany.id,
										)
									}
									className="group flex flex-col items-center gap-4 transition-all duration-300 hover:-translate-y-1"
								>
									<div className="h-28 w-28 md:h-36 md:w-36 rounded-xl bg-slate-800 flex items-center justify-center shadow-lg border-2 border-transparent group-hover:border-blue-500 transition-colors duration-300">
										<Building2 className="h-12 w-12 text-slate-400 group-hover:text-blue-500 transition-colors" />
									</div>
									<div className="flex flex-col items-center">
										<span className="text-gray-300 group-hover:text-white font-medium text-lg transition-colors">
											Matriz (Principal)
										</span>
										<span className="text-gray-500 text-sm">
											{selectedParentCompany.cnpj}
										</span>
									</div>
								</button>

								{/* Lista de Filiais */}
								{instances.map((instance) => (
									<button
										key={instance.id}
										onClick={() =>
											handleSelectInstance(
												instance.id,
												selectedParentCompany.id,
											)
										}
										className="group flex flex-col items-center gap-4 transition-all duration-300 hover:-translate-y-1"
									>
										<div className="h-28 w-28 md:h-36 md:w-36 rounded-xl bg-slate-800/80 hover:bg-slate-700 flex items-center justify-center shadow-lg border-2 border-transparent group-hover:border-white transition-colors duration-300">
											<span className="text-3xl font-bold text-slate-400 group-hover:text-white transition-colors">
												{getInitials(instance.name)}
											</span>
										</div>
										<div className="flex flex-col items-center">
											<span className="text-gray-400 group-hover:text-white font-medium text-base transition-colors max-w-[150px] truncate">
												{instance.name}
											</span>
											<span className="text-gray-500 text-xs mt-1">
												{instance.cnpj}
											</span>
										</div>
									</button>
								))}
							</div>
						)}
					</div>
				)}

				{error && (
					<div className="text-red-400 mt-4 p-4 bg-red-500/10 rounded-lg inline-block">
						{error}
					</div>
				)}
			</div>
		</div>
	);
}
