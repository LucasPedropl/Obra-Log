import { createClient } from '@/config/supabase';
import {
	createAccessProfileAction,
	deleteAccessProfileAction,
	updateAccessProfileAction,
} from '@/app/actions/accessProfilesActions';

export interface AccessProfile {
	id: string;
	company_id: string;
	name: string;
	permissions: Record<
		string,
		{
			view: boolean;
			create: boolean;
			edit: boolean;
			delete: boolean;
		}
	>;
	scope: 'ALL_SITES' | 'SPECIFIC_SITES';
	obra_scope?: string;
	created_at?: string;
	allowed_sites: string[];
}

function parseAllowedSites(profile: Record<string, unknown>): string[] {
	const fromColumn = profile.allowed_sites;
	if (Array.isArray(fromColumn)) {
		return fromColumn.filter((id): id is string => typeof id === 'string');
	}

	const permissions = profile.permissions as
		| Record<string, unknown>
		| null
		| undefined;
	const fromPermissions = permissions?._allowed_sites;
	if (Array.isArray(fromPermissions)) {
		return fromPermissions.filter((id): id is string => typeof id === 'string');
	}

	return [];
}

function mapProfileRow(profile: Record<string, unknown>): AccessProfile {
	const permissions = (profile.permissions || {}) as Record<string, unknown>;
	const { _allowed_sites: _ignored, ...cleanPermissions } = permissions;

	return {
		...(profile as Omit<AccessProfile, 'permissions' | 'scope' | 'allowed_sites'>),
		permissions: cleanPermissions as AccessProfile['permissions'],
		scope:
			profile.obra_scope === 'ALL' ? 'ALL_SITES' : 'SPECIFIC_SITES',
		allowed_sites: parseAllowedSites(profile),
	};
}

export const accessProfilesService = {
	async getProfiles(companyId: string): Promise<AccessProfile[]> {
		const supabase = createClient();

		const { data: profiles, error: profileError } = await supabase
			.from('access_profiles')
			.select('*')
			.eq('company_id', companyId)
			.order('name', { ascending: true });

		if (profileError) throw profileError;

		if (!profiles || profiles.length === 0) return [];

		return profiles.map((profile) =>
			mapProfileRow(profile as Record<string, unknown>),
		);
	},

	async createProfile(
		data: Omit<AccessProfile, 'id'>,
	): Promise<AccessProfile> {
		const result = await createAccessProfileAction({
			company_id: data.company_id,
			name: data.name,
			permissions: data.permissions,
			scope: data.scope,
			allowed_sites: data.allowed_sites,
		});

		if (!result.success) throw new Error(result.error);
		return result.data as AccessProfile;
	},

	async updateProfile(
		id: string,
		data: Partial<AccessProfile>,
	): Promise<AccessProfile> {
		const result = await updateAccessProfileAction(id, {
			name: data.name,
			permissions: data.permissions,
			scope: data.scope,
			allowed_sites: data.allowed_sites,
		});

		if (!result.success) throw new Error(result.error);
		return result.data as AccessProfile;
	},

	async deleteProfile(id: string): Promise<void> {
		const result = await deleteAccessProfileAction(id);
		if (!result.success) throw new Error(result.error);
	},

	async getProfileById(id: string): Promise<AccessProfile | null> {
		const supabase = createClient();

		const { data, error } = await supabase
			.from('access_profiles')
			.select('*')
			.eq('id', id)
			.single();

		if (error) return null;

		return mapProfileRow(data as Record<string, unknown>);
	},
};
