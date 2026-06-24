'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/toaster';
import {
	getSettingsDataAction,
	updateCompanySettingsAction,
	updateProfileSettingsAction,
} from '@/app/actions/settingsActions';
import { SecurityTab } from '@/features/settings/components/SecurityTab';

type Tab = 'profile' | 'company' | 'security';

export default function SettingsPage() {
	const { addToast } = useToast();
	const [activeTab, setActiveTab] = useState<Tab>('profile');
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [profile, setProfile] = useState({ id: '', full_name: '', email: '', avatar_url: '' });
	const [company, setCompany] = useState({ id: '', name: '', cnpj: '' });

	useEffect(() => {
		const loadData = async () => {
			try {
				const result = await getSettingsDataAction();
				if (!result.success) {
					console.error('Error loading settings', result.error);
					return;
				}
				if (result.data) {
					setProfile(result.data.profile);
					setCompany(result.data.company);
				}
			} catch (error) {
				console.error('Error loading settings', error);
			} finally {
				setLoading(false);
			}
		};

		loadData();
	}, []);

	const handleSaveProfile = async (e: React.FormEvent) => {
		e.preventDefault();
		setSaving(true);
		try {
			const result = await updateProfileSettingsAction({
				fullName: profile.full_name,
			});

			if (!result.success) throw new Error(result.error);
			addToast('Perfil atualizado com sucesso!', 'success');
		} catch (error: unknown) {
			const message =
				error instanceof Error ? error.message : 'Erro desconhecido';
			addToast('Erro ao salvar perfil: ' + message, 'error');
		} finally {
			setSaving(false);
		}
	};

	const handleSaveCompany = async (e: React.FormEvent) => {
		e.preventDefault();
		setSaving(true);
		try {
			const result = await updateCompanySettingsAction({
				name: company.name,
				cnpj: company.cnpj,
			});

			if (!result.success) throw new Error(result.error);
			addToast('Dados da empresa atualizados!', 'success');
		} catch (error: unknown) {
			const message =
				error instanceof Error ? error.message : 'Erro desconhecido';
			addToast('Erro ao salvar empresa: ' + message, 'error');
		} finally {
			setSaving(false);
		}
	};

	if (loading) {
		return (
			<div className="flex flex-col items-center justify-center py-20">
				<Icon name="ArrowsClockwise" size={32} className="animate-spin text-blue-600 mb-4" />
				<p className="text-gray-500 font-medium">Carregando configurações...</p>
			</div>
		);
	}

	return (
		<div className="w-full flex flex-col gap-6 max-w-4xl mx-auto">
			<PageHeader
				title="Configurações"
				description="Gerencie suas informações pessoais e da sua empresa."
			/>

			<div className="flex flex-col md:flex-row gap-8 items-start">
				{/* Tabs Sidebar */}
				<aside className="w-full md:w-64 flex flex-col border border-gray-200 bg-white">
					<button
						onClick={() => setActiveTab('profile')}
						className={cn(
							'flex items-center gap-3 px-4 py-3 text-sm font-bold transition-all border-l-4',
							activeTab === 'profile'
								? 'bg-blue-50 text-blue-600 border-blue-600'
								: 'text-gray-600 border-transparent hover:bg-gray-50'
						)}
					>
						<Icon name="User" size={20} weight={activeTab === 'profile' ? 'bold' : 'regular'} />
						Meu Perfil
					</button>
					<button
						onClick={() => setActiveTab('company')}
						className={cn(
							'flex items-center gap-3 px-4 py-3 text-sm font-bold transition-all border-l-4',
							activeTab === 'company'
								? 'bg-blue-50 text-blue-600 border-blue-600'
								: 'text-gray-600 border-transparent hover:bg-gray-50'
						)}
					>
						<Icon name="Buildings" size={20} weight={activeTab === 'company' ? 'bold' : 'regular'} />
						Minha Empresa
					</button>
					<button
						onClick={() => setActiveTab('security')}
						className={cn(
							'flex items-center gap-3 px-4 py-3 text-sm font-bold transition-all border-l-4',
							activeTab === 'security'
								? 'bg-blue-50 text-blue-600 border-blue-600'
								: 'text-gray-600 border-transparent hover:bg-gray-50'
						)}
					>
						<Icon name="Lock" size={20} weight={activeTab === 'security' ? 'bold' : 'regular'} />
						Segurança
					</button>
				</aside>

				{/* Content Area */}
				<main className="flex-1 bg-white border border-gray-200 w-full">
					{activeTab === 'profile' && (
						<form onSubmit={handleSaveProfile} className="p-6 space-y-6">
							<div className="border-b border-gray-100 pb-4">
								<h3 className="text-lg font-bold text-gray-900">Informações Pessoais</h3>
								<p className="text-sm text-gray-500">Atualize seus dados de identificação no sistema.</p>
							</div>

							<div className="flex items-center gap-6">
								<div className="w-20 h-20 bg-gray-100 border border-gray-200 flex items-center justify-center relative overflow-hidden">
									{profile.avatar_url ? (
										<img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
									) : (
										<Icon name="User" size={32} className="text-gray-400" />
									)}
									<button type="button" className="absolute inset-0 bg-black/40 text-white opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
										<Icon name="Camera" size={20} />
									</button>
								</div>
								<div>
									<h4 className="text-sm font-bold text-gray-900">Sua Foto</h4>
									<p className="text-xs text-gray-500 mt-1">PNG ou JPG de até 2MB.</p>
									<div className="flex gap-2 mt-3">
										<Button type="button" size="sm" variant="outline" className="rounded-none text-[10px] font-bold uppercase tracking-wider h-8">
											Alterar
										</Button>
										<Button type="button" size="sm" variant="ghost" className="rounded-none text-[10px] font-bold uppercase tracking-wider h-8 text-red-500 hover:text-red-600 hover:bg-red-50">
											Remover
										</Button>
									</div>
								</div>
							</div>

							<div className="grid grid-cols-1 gap-4">
								<div className="space-y-1.5">
									<label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Nome Completo</label>
									<Input
										className="rounded-none h-11 border-gray-200 focus:border-blue-600 focus:ring-0"
										value={profile.full_name}
										onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
										placeholder="Seu nome"
										required
									/>
								</div>
								<div className="space-y-1.5 opacity-60">
									<label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">E-mail (Não editável)</label>
									<Input
										className="rounded-none h-11 border-gray-200 bg-gray-50 cursor-not-allowed"
										value={profile.email}
										readOnly
									/>
								</div>
							</div>

							<div className="pt-4 flex justify-end">
								<Button disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white rounded-none px-8 font-bold uppercase tracking-widest text-xs h-11">
									{saving ? <Icon name="ArrowsClockwise" size={16} className="animate-spin mr-2" /> : null}
									Salvar Alterações
								</Button>
							</div>
						</form>
					)}

					{activeTab === 'company' && (
						<form onSubmit={handleSaveCompany} className="p-6 space-y-6">
							<div className="border-b border-gray-100 pb-4">
								<h3 className="text-lg font-bold text-gray-900">Dados da Empresa</h3>
								<p className="text-sm text-gray-500">Configure as informações da organização ativa.</p>
							</div>

							<div className="grid grid-cols-1 gap-4">
								<div className="space-y-1.5">
									<label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Nome Fantasia / Razão Social</label>
									<Input
										className="rounded-none h-11 border-gray-200 focus:border-blue-600 focus:ring-0"
										value={company.name}
										onChange={(e) => setCompany({ ...company, name: e.target.value })}
										placeholder="Nome da empresa"
										required
									/>
								</div>
								<div className="space-y-1.5">
									<label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">CNPJ</label>
									<Input
										className="rounded-none h-11 border-gray-200 focus:border-blue-600 focus:ring-0"
										value={company.cnpj || ''}
										onChange={(e) => setCompany({ ...company, cnpj: e.target.value })}
										placeholder="00.000.000/0000-00"
									/>
								</div>
							</div>

							<div className="p-4 bg-orange-50 border-l-4 border-orange-500">
								<div className="flex gap-3">
									<Icon name="Warning" size={20} className="text-orange-600 shrink-0" />
									<div>
										<h5 className="text-xs font-bold text-orange-900 uppercase tracking-tight">Aviso de Limites</h5>
										<p className="text-[11px] text-orange-800 mt-1 leading-relaxed">
											As alterações nos dados da empresa podem afetar documentos fiscais e relatórios gerados pelo sistema. Certifique-se de que os dados estão corretos.
										</p>
									</div>
								</div>
							</div>

							<div className="pt-4 flex justify-end">
								<Button disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white rounded-none px-8 font-bold uppercase tracking-widest text-xs h-11">
									{saving ? <Icon name="ArrowsClockwise" size={16} className="animate-spin mr-2" /> : null}
									Atualizar Empresa
								</Button>
							</div>
						</form>
					)}

					{activeTab === 'security' && <SecurityTab />}
				</main>
			</div>
		</div>
	);
}
