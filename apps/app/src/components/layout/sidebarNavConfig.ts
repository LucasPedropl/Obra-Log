import type { PermissionActions } from '@/context/PermissionsContext';

export type NavItem = {
	name: string;
	icon: string;
	href?: string;
	resource?: string;
	children?: { name: string; href: string; resource?: string }[];
};

export const sistemaNavItems: NavItem[] = [
	{ name: 'Dashboard', icon: 'SquaresFour', href: '/dashboard', resource: 'dashboard' },
	{ name: 'Obras', icon: 'Buildings', href: '/obras', resource: 'obras' },
	{ name: 'Insumos', icon: 'Package', href: '/insumos', resource: 'insumos' },
	{ name: 'Colaboradores', icon: 'Users', href: '/colaboradores', resource: 'colaboradores' },
	{
		name: 'Acesso ao Sistema',
		icon: 'ShieldCheck',
		children: [
			{ name: 'Perfis de Acesso', href: '/acesso/perfis', resource: 'perfis' },
			{ name: 'Usuários', href: '/acesso/usuarios', resource: 'usuarios' },
		],
	},
];

export function buildObraNavItems(obraId: string): NavItem[] {
	return [
		{
			name: 'Visão Geral',
			icon: 'ChartPieSlice',
			href: `/obras/${obraId}/visao-geral`,
			resource: 'site_dashboard',
		},
		{
			name: 'Almoxarifado',
			icon: 'Warehouse',
			href: `/obras/${obraId}/almoxarifado`,
			resource: 'site_insumos',
		},
		{
			name: 'Colaboradores',
			icon: 'UsersThree',
			href: `/obras/${obraId}/colaboradores`,
			resource: 'site_colaboradores',
		},
		{
			name: 'Ferramentas',
			icon: 'Wrench',
			resource: 'site_insumos',
			children: [
				{ name: 'Disponíveis', href: `/obras/${obraId}/ferramentas/disponiveis` },
				{ name: 'Em uso', href: `/obras/${obraId}/ferramentas/em-uso` },
				{ name: 'Histórico', href: `/obras/${obraId}/ferramentas/historico` },
			],
		},
		{
			name: 'EPIs',
			icon: 'HardHat',
			resource: 'site_insumos',
			children: [
				{ name: 'Disponíveis', href: `/obras/${obraId}/epis/disponiveis` },
				{ name: 'Histórico', href: `/obras/${obraId}/epis/historico` },
			],
		},
		{
			name: 'Equip. Alugados',
			icon: 'Truck',
			resource: 'site_equipamentos',
			children: [
				{ name: 'Ativos', href: `/obras/${obraId}/equip-alugados/ativos` },
				{ name: 'Histórico', href: `/obras/${obraId}/equip-alugados/historico` },
			],
		},
		{
			name: 'Movimentações',
			icon: 'ArrowsLeftRight',
			href: `/obras/${obraId}/movimentacoes`,
			resource: 'site_insumos',
		},
	];
}

type CanFn = (resource: string, action: keyof PermissionActions) => boolean;

export function filterNavItemsByPermissions(
	items: NavItem[],
	can: CanFn,
	isSuperAdmin: boolean,
): NavItem[] {
	if (isSuperAdmin) return items;

	return items
		.filter((item) => {
			if (item.children) {
				const hasAccessToAnyChild = item.children.some(
					(child) => !child.resource || can(child.resource, 'view'),
				);
				const hasAccessToParent = !item.resource || can(item.resource, 'view');
				return hasAccessToParent && (item.children.length === 0 || hasAccessToAnyChild);
			}
			if (item.resource) return can(item.resource, 'view');
			return true;
		})
		.map((item) => {
			if (!item.children) return item;
			return {
				...item,
				children: item.children.filter(
					(child) => !child.resource || can(child.resource, 'view'),
				),
			};
		});
}
