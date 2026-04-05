import React from 'react';
import { ERPLayout } from '../../../components/layout/ERPLayout';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import {
	LayoutDashboard,
	Package,
	Users,
	HardHat,
	Wrench,
	Truck,
	ArrowRightLeft,
	ArrowLeft,
	ChevronRight,
	History,
	ClipboardList,
} from 'lucide-react';

export default function MobileProjectMenu() {
	const { id } = useParams();
	const { isAllowed } = useAuth();

	const menuGroupsRaw = [
		{
			title: 'Visão Geral',
			items: [
				{
					name: 'Dashboard da Obra',
					path: `/app/obras/${id}/visao-geral`,
					icon: LayoutDashboard,
					alwaysShow: true,
				},
			],
		},
		{
			title: 'Almoxarifado e Equipe',
			items: [
				{
					name: 'Almoxarifado',
					path: `/app/obras/${id}/almoxarifado`,
					icon: Package,
					alwaysShow: true,
				},
				{
					name: 'Colaboradores',
					path: `/app/obras/${id}/colaboradores`,
					icon: Users,
					resource: 'colaboradores' as const,
				},
				{
					name: 'Movimentações',
					path: `/app/obras/${id}/movimentacoes`,
					icon: ArrowRightLeft,
					resource: 'movimentacoes' as const,
				},
			],
		},
		{
			title: 'EPIs',
			items: [
				{
					name: 'EPIs Disponíveis',
					path: `/app/obras/${id}/epis/disponiveis`,
					icon: HardHat,
					resource: 'epis' as const,
				},
				{
					name: 'Histórico de EPIs',
					path: `/app/obras/${id}/epis/historico`,
					icon: History,
					resource: 'epis' as const,
				},
			],
		},
		{
			title: 'Ferramentas',
			items: [
				{
					name: 'Disponíveis',
					path: `/app/obras/${id}/ferramentas/disponiveis`,
					icon: ClipboardList,
					resource: 'ferramentas' as const,
				},
				{
					name: 'Empréstimos',
					path: `/app/obras/${id}/ferramentas/emprestimos`,
					icon: ArrowLeft,
					resource: 'ferramentas' as const,
				},
				{
					name: 'Histórico',
					path: `/app/obras/${id}/ferramentas/historico`,
					icon: History,
					resource: 'ferramentas' as const,
				},
			],
		},
		{
			title: 'Equipamentos',
			items: [
				{
					name: 'Alugados',
					path: `/app/obras/${id}/equip-alugados`,
					icon: Truck,
					resource: 'equip_alugados' as const,
				},
			],
		},
	];

	const menuGroups = menuGroupsRaw
		.map((group) => {
			const visibleItems = group.items.filter((item) => {
				if (item.alwaysShow) return true;
				if (item.resource && isAllowed(item.resource as any, 'view'))
					return true;
				return false;
			});
			return { ...group, items: visibleItems };
		})
		.filter((group) => group.items.length > 0);

	return (
		<ERPLayout>
			<div className="space-y-6 max-w-lg mx-auto">
				<div className="mb-2">
					<h1 className="text-2xl font-bold text-text-main">
						Menu da Obra
					</h1>
					<p className="text-sm text-text-muted mt-1">
						Acesso rápido aos módulos deste canteiro
					</p>
				</div>

				<div className="space-y-6">
					{menuGroups.map((group, index) => (
						<div key={index} className="space-y-2">
							<h2 className="text-xs font-bold text-text-muted uppercase tracking-wider pl-2">
								{group.title}
							</h2>
							<div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
								{group.items.map((item, itemIndex) => (
									<Link
										key={itemIndex}
										to={item.path}
										className={`flex items-center justify-between p-4 bg-surface hover:bg-background transition-colors ${
											itemIndex !== group.items.length - 1
												? 'border-b border-border'
												: ''
										}`}
									>
										<div className="flex items-center gap-3 text-text-main font-medium">
											<div className="w-10 h-10 rounded-lg bg-background border border-border flex items-center justify-center text-text-muted">
												<item.icon size={20} />
											</div>
											{item.name}
										</div>
										<ChevronRight
											size={18}
											className="text-text-muted opacity-50"
										/>
									</Link>
								))}
							</div>
						</div>
					))}
				</div>
			</div>
		</ERPLayout>
	);
}
