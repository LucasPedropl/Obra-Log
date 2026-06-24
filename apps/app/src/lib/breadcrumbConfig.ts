import { buildObraNavItems, sistemaNavItems } from '@/components/layout/sidebarNavConfig';

const STATIC_LABELS: Record<string, string> = {
	dashboard: 'Dashboard',
	obras: 'Obras',
	insumos: 'Insumos',
	colaboradores: 'Colaboradores',
	acesso: 'Acesso ao Sistema',
	perfis: 'Perfis de Acesso',
	usuarios: 'Usuários',
	menu: 'Menu',
};

function collectNavLabels(items: { name: string; href?: string; children?: { name: string; href: string }[] }[]) {
	const map = new Map<string, string>();
	for (const item of items) {
		if (item.href) map.set(item.href, item.name);
		item.children?.forEach((child) => map.set(child.href, child.name));
	}
	return map;
}

const OBRA_NAV = collectNavLabels(buildObraNavItems('_'));
const SISTEMA_NAV = collectNavLabels(sistemaNavItems);

/** Resolve o rótulo do módulo atual a partir do pathname. */
export function resolveModuleLabel(pathname: string): string | null {
	if (!pathname || pathname === '/') return null;

	const obraMatch = pathname.match(/^\/obras\/[^/]+(\/.*)?$/);
	if (obraMatch) {
		const suffix = obraMatch[1] ?? '';
		const normalized = `/obras/_${suffix}`;
		const fromNav = OBRA_NAV.get(normalized);
		if (fromNav) return fromNav;

		const segment = suffix.split('/').filter(Boolean).pop();
		if (segment && STATIC_LABELS[segment]) return STATIC_LABELS[segment];
		return 'Obra';
	}

	const fromNav = SISTEMA_NAV.get(pathname);
	if (fromNav) return fromNav;

	const segment = pathname.split('/').filter(Boolean).pop();
	if (segment && STATIC_LABELS[segment]) return STATIC_LABELS[segment];

	return null;
}

export function isObraContext(pathname: string): boolean {
	return /^\/obras\/[^/]+/.test(pathname);
}
