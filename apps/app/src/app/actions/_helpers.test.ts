import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGetUser = vi.fn();
const mockFrom = vi.fn();
const mockCookiesGet = vi.fn();

vi.mock('@/config/supabaseServer', () => ({
	createServerSupabaseClient: vi.fn(async () => ({
		auth: { getUser: mockGetUser },
	})),
}));

vi.mock('@/config/supabaseAdmin', () => ({
	supabaseAdmin: { from: (...args: unknown[]) => mockFrom(...args) },
}));

vi.mock('next/headers', () => ({
	cookies: vi.fn(async () => ({
		get: mockCookiesGet,
	})),
}));

import {
	assertCompanyResourcePermission,
	assertInventoryBelongsToSite,
	assertSiteAccess,
	getValidatedCompanyId,
} from './_helpers';

type TableResponse = { data: unknown };

function createQueryChain(response: TableResponse) {
	const chain: Record<string, ReturnType<typeof vi.fn>> = {};
	chain.select = vi.fn(() => chain);
	chain.eq = vi.fn(() => chain);
	chain.maybeSingle = vi.fn(async () => response);
	return chain;
}

describe('_helpers', () => {
	let tableResponses: Record<string, TableResponse>;

	beforeEach(() => {
		vi.clearAllMocks();
		tableResponses = {};

		mockFrom.mockImplementation((table: string) =>
			createQueryChain(tableResponses[table] ?? { data: null }),
		);

		mockCookiesGet.mockImplementation((name: string) => {
			if (name === 'selectedCompanyId') return { value: 'company-1' };
			return undefined;
		});
	});

	describe('getValidatedCompanyId', () => {
		it('returns company id when membership exists', async () => {
			tableResponses.company_users = { data: { company_id: 'company-1' } };

			await expect(getValidatedCompanyId('user-1')).resolves.toBe('company-1');
		});

		it('throws when company cookie is missing', async () => {
			mockCookiesGet.mockReturnValue(undefined);

			await expect(getValidatedCompanyId('user-1')).rejects.toThrow(
				'Empresa não selecionada',
			);
		});

		it('throws when user has no membership', async () => {
			tableResponses.company_users = { data: null };

			await expect(getValidatedCompanyId('user-1')).rejects.toThrow(
				'Sem acesso a esta empresa',
			);
		});
	});

	describe('assertCompanyResourcePermission', () => {
		it('allows SUPER_ADMIN without profile permissions', async () => {
			tableResponses.profiles = { data: { is_super_admin: true } };

			await expect(
				assertCompanyResourcePermission(
					'user-1',
					'company-1',
					'insumos',
					'create',
				),
			).resolves.toBeUndefined();
		});

		it('allows ADMIN role', async () => {
			tableResponses.profiles = { data: { is_super_admin: false } };
			tableResponses.company_users = {
				data: { role: 'ADMIN', profile_id: null },
			};

			await expect(
				assertCompanyResourcePermission(
					'user-1',
					'company-1',
					'insumos',
					'delete',
				),
			).resolves.toBeUndefined();
		});

		it('throws when member has no profile_id', async () => {
			tableResponses.profiles = { data: { is_super_admin: false } };
			tableResponses.company_users = {
				data: { role: 'USER', profile_id: null },
			};

			await expect(
				assertCompanyResourcePermission(
					'user-1',
					'company-1',
					'insumos',
					'create',
				),
			).rejects.toThrow('Sem permissão para esta operação');
		});

		it('throws when resource action is not granted', async () => {
			tableResponses.profiles = { data: { is_super_admin: false } };
			tableResponses.company_users = {
				data: { role: 'USER', profile_id: 'profile-1' },
			};
			tableResponses.access_profiles = {
				data: { permissions: { insumos: { view: true } } },
			};

			await expect(
				assertCompanyResourcePermission(
					'user-1',
					'company-1',
					'insumos',
					'create',
				),
			).rejects.toThrow('Sem permissão para esta operação');
		});

		it('allows when resource action is granted', async () => {
			tableResponses.profiles = { data: { is_super_admin: false } };
			tableResponses.company_users = {
				data: { role: 'USER', profile_id: 'profile-1' },
			};
			tableResponses.access_profiles = {
				data: { permissions: { insumos: { create: true } } },
			};

			await expect(
				assertCompanyResourcePermission(
					'user-1',
					'company-1',
					'insumos',
					'create',
				),
			).resolves.toBeUndefined();
		});
	});

	describe('assertSiteAccess', () => {
		it('allows ADMIN for any site in company', async () => {
			tableResponses.company_users = { data: { company_id: 'company-1' } };
			tableResponses.construction_sites = {
				data: { id: 'site-1', company_id: 'company-1' },
			};
			tableResponses.profiles = { data: { is_super_admin: false } };
			tableResponses.company_users = {
				data: { role: 'ADMIN', profile_id: null },
			};

			mockFrom.mockImplementation((table: string) => {
				if (table === 'company_users') {
					const callIndex = mockFrom.mock.calls.filter(
						([t]) => t === 'company_users',
					).length;
					if (callIndex === 1) {
						return createQueryChain({ data: { company_id: 'company-1' } });
					}
					return createQueryChain({
						data: { role: 'ADMIN', profile_id: null },
					});
				}
				return createQueryChain(tableResponses[table] ?? { data: null });
			});

			await expect(assertSiteAccess('user-1', 'site-1')).resolves.toBeUndefined();
		});

		it('throws when site belongs to another company', async () => {
			tableResponses.company_users = { data: { company_id: 'company-1' } };
			tableResponses.construction_sites = {
				data: { id: 'site-1', company_id: 'company-2' },
			};

			await expect(assertSiteAccess('user-1', 'site-1')).rejects.toThrow(
				'Obra não encontrada ou sem acesso',
			);
		});
	});

	describe('assertInventoryBelongsToSite', () => {
		it('passes when inventory row matches site', async () => {
			tableResponses.site_inventory = {
				data: { id: 'inv-1', site_id: 'site-1' },
			};

			await expect(
				assertInventoryBelongsToSite('inv-1', 'site-1'),
			).resolves.toBeUndefined();
		});

		it('throws when inventory row is from another site', async () => {
			tableResponses.site_inventory = {
				data: { id: 'inv-1', site_id: 'site-2' },
			};

			await expect(
				assertInventoryBelongsToSite('inv-1', 'site-1'),
			).rejects.toThrow('Item de inventário não encontrado nesta obra');
		});
	});
});
