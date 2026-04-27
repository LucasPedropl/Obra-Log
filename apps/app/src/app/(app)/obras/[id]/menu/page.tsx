'use client';

import React, { use, useState } from 'react';
import Link from 'next/link';
import {
	Building2,
	Package,
	Users,
	Wrench,
	HardHat,
	Truck,
	ArrowRightLeft,
	Plus,
	Box,
	UserPlus,
	Hammer,
	LayoutDashboard,
	ChevronRight,
} from 'lucide-react';
import { AddSiteCollaboratorForm } from '@/features/colaboradores/components/AddSiteCollaboratorForm';
import { AddInventoryForm } from '@/features/almoxarifado/components/AddInventoryForm';
import { AddRentedForm } from '@/features/equip-alugados/components/AddRentedForm';

type ModalType = 'colaborador' | 'insumo' | 'equipamento' | null;

export default function MobileMenuPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const resolvedParams = use(params);
	const obraId = resolvedParams.id;

	const [activeModal, setActiveModal] = useState<ModalType>(null);

	const menuItems = [
		{
			name: 'Visão Geral',
			icon: LayoutDashboard,
			href: `/obras/${obraId}/visao-geral`,
			color: 'text-blue-500',
			bg: 'bg-blue-50',
		},
		{
			name: 'Almoxarifado',
			icon: Package,
			href: `/obras/${obraId}/almoxarifado`,
			color: 'text-amber-500',
			bg: 'bg-amber-50',
		},
		{
			name: 'Colaboradores',
			icon: Users,
			href: `/obras/${obraId}/colaboradores`,
			color: 'text-emerald-500',
			bg: 'bg-emerald-50',
		},
		{
			name: 'Ferramentas (Disp)',
			icon: Wrench,
			href: `/obras/${obraId}/ferramentas/disponiveis`,
			color: 'text-rose-500',
			bg: 'bg-rose-50',
		},
		{
			name: 'Ferramentas (Em uso)',
			icon: Wrench,
			href: `/obras/${obraId}/ferramentas/em-uso`,
			color: 'text-rose-500',
			bg: 'bg-rose-50',
		},
		{
			name: 'EPIs (Disp)',
			icon: HardHat,
			href: `/obras/${obraId}/epis/disponiveis`,
			color: 'text-cyan-500',
			bg: 'bg-cyan-50',
		},
		{
			name: 'Equip. Alugados (Ativos)',
			icon: Truck,
			href: `/obras/${obraId}/equip-alugados/ativos`,
			color: 'text-purple-500',
			bg: 'bg-purple-50',
		},
		{
			name: 'Movimentações',
			icon: ArrowRightLeft,
			href: `/obras/${obraId}/movimentacoes`,
			color: 'text-gray-500',
			bg: 'bg-gray-50',
		},
	];

	return (
		<div className="w-full flex flex-col gap-6 pb-4 animate-in fade-in-0 duration-300">
			<div>
				<h1 className="text-2xl font-bold text-gray-900 mb-1">
					Menu da Obra
				</h1>
				<p className="text-sm text-gray-500">
					Navegue pelas áreas ou acesse ações rápidas
				</p>
			</div>

			{/* Ações Rápidas (Cards no estilo Grid) */}
			<section>
				<h2 className="text-sm font-semibold text-gray-900 uppercase tracking-widest mb-3">
					Ações Rápidas
				</h2>
				<div className="grid grid-cols-2 gap-3">
					<button
						onClick={() => setActiveModal('insumo')}
						className="flex flex-col items-center justify-center p-4 rounded-xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow gap-2 active:scale-[0.98]"
					>
						<div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
							<Box className="w-5 h-5" />
						</div>
						<span className="text-sm font-medium text-gray-700 text-center">
							Entrada no
							<br />
							Almoxarifado
						</span>
					</button>

					<button
						onClick={() => setActiveModal('colaborador')}
						className="flex flex-col items-center justify-center p-4 rounded-xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow gap-2 active:scale-[0.98]"
					>
						<div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
							<UserPlus className="w-5 h-5" />
						</div>
						<span className="text-sm font-medium text-gray-700 text-center">
							Alojar
							<br />
							Colaborador
						</span>
					</button>

					<button
						onClick={() => setActiveModal('equipamento')}
						className="flex flex-col items-center justify-center p-4 rounded-xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow gap-2 active:scale-[0.98]"
					>
						<div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
							<Hammer className="w-5 h-5" />
						</div>
						<span className="text-sm font-medium text-gray-700 text-center">
							Novo Equip.
							<br />
							Alugado
						</span>
					</button>
				</div>
			</section>

			{/* Lista de Páginas */}
			<section className="mb-4">
				<h2 className="text-sm font-semibold text-gray-900 uppercase tracking-widest mb-3">
					Navegação
				</h2>
				<div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
					{menuItems.map((item, index) => (
						<Link
							key={item.name}
							href={item.href}
							className={`flex items-center justify-between p-4 bg-white hover:bg-gray-50 active:bg-gray-100 transition-colors ${
								index !== menuItems.length - 1
									? 'border-b border-gray-100'
									: ''
							}`}
						>
							<div className="flex items-center gap-3">
								<div
									className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.bg} ${item.color}`}
								>
									<item.icon className="w-4 h-4" />
								</div>
								<span className="font-medium text-gray-800">
									{item.name}
								</span>
							</div>
							<ChevronRight className="w-5 h-5 text-gray-300" />
						</Link>
					))}
				</div>
			</section>

			{/* Modais de Ação Rápida */}
			{activeModal === 'colaborador' && (
				<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm shadow-2xl p-4 animate-in fade-in">
					<AddSiteCollaboratorForm
						siteId={obraId}
						onCancel={() => setActiveModal(null)}
						onSaved={() => setActiveModal(null)}
					/>
				</div>
			)}

			{activeModal === 'insumo' && (
				<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
					<AddInventoryForm
						siteId={obraId}
						onCancel={() => setActiveModal(null)}
						onSaved={() => setActiveModal(null)}
						existingCatalogIds={[]}
					/>
				</div>
			)}

			{activeModal === 'equipamento' && (
				<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
					<AddRentedForm
						siteId={obraId}
						onCancel={() => setActiveModal(null)}
						onSaved={() => setActiveModal(null)}
					/>
				</div>
			)}
		</div>
	);
}
