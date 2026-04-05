import React from 'react';
import { ERPLayout } from '../../components/layout/ERPLayout';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
	Database,
	FileText,
	Ruler,
	Tags,
	KeyRound,
	UserCheck,
	ShieldCheck,
	Settings,
	ChevronRight,
} from 'lucide-react';

export default function MobileMenu() {
	const { isAllowed } = useAuth();

	const menuGroupsRaw = [
		{
			title: 'Cadastros Básicos',
			items: [
				{
					name: 'Insumos',
					path: '/app/config-dados/insumos',
					icon: FileText,
					resource: 'insumos' as const,
				},
				{
					name: 'Unid. de Medidas',
					path: '/app/config-dados/unidades',
					icon: Ruler,
					alwaysShow: true,
				},
				{
					name: 'Categorias',
					path: '/app/config-dados/categorias',
					icon: Tags,
					alwaysShow: true,
				},
			],
		},
		{
			title: 'Acesso ao sistema',
			items: [
				{
					name: 'Usuários',
					path: '/app/acesso/usuarios',
					icon: UserCheck,
					resource: 'usuarios' as const,
				},
				{
					name: 'Perfis de acesso',
					path: '/app/acesso/perfis',
					icon: ShieldCheck,
					resource: 'perfis' as const,
				},
			],
		},
		{
			title: 'Configurações',
			items: [
				{
					name: 'Configurações Gerais',
					path: '/app/configuracoes',
					icon: Settings,
					alwaysShow: true,
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
					<h1 className="text-2xl font-bold text-text-main">Menu</h1>
					<p className="text-sm text-text-muted mt-1">
						Acesso rápido a todos os módulos do sistema
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
