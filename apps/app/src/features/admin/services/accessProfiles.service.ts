import { createClient } from '@/config/supabase';

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

		return profiles.map(profile => ({
			...profile,
			permissions: profile.permissions || {},
			scope: profile.obra_scope === 'ALL' ? 'ALL_SITES' : 'SPECIFIC_SITES',
			allowed_sites: [], // Implementar futuramente se houver tabela de vínculo
		})) as AccessProfile[];
	},

	async createProfile(
		data: Omit<AccessProfile, 'id'>,
	): Promise<AccessProfile> {
		const supabase = createClient();
		
		const { data: profile, error } = await supabase
			.from('access_profiles')
			.insert({
				company_id: data.company_id,
				name: data.name,
				permissions: data.permissions || {},
				obra_scope: data.scope === 'ALL_SITES' ? 'ALL' : 'SELECTED'
			})
			.select()
			.single();

		if (error) throw error;

		return {
			...profile,
			permissions: profile.permissions || {},
			scope: profile.obra_scope === 'ALL' ? 'ALL_SITES' : 'SPECIFIC_SITES',
			allowed_sites: []
		} as AccessProfile;
	},

	async updateProfile(
		id: string,
		data: Partial<AccessProfile>,
	): Promise<AccessProfile> {
		const supabase = createClient();
		
		const updateData: any = {};
		if (data.name) updateData.name = data.name;
		if (data.permissions) updateData.permissions = data.permissions;
		if (data.scope) updateData.obra_scope = data.scope === 'ALL_SITES' ? 'ALL' : 'SELECTED';
		
		const { data: updatedProfile, error } = await supabase
			.from('access_profiles')
			.update(updateData)
			.eq('id', id)
			.select()
			.single();

		if (error) throw error;

		return {
			...updatedProfile,
			permissions: updatedProfile.permissions || {},
			scope: updatedProfile.obra_scope === 'ALL' ? 'ALL_SITES' : 'SPECIFIC_SITES',
			allowed_sites: []
		} as AccessProfile;
	},

	async deleteProfile(id: string): Promise<void> {
		const supabase = createClient();
		
		const { error } = await supabase
			.from('access_profiles')
			.delete()
			.eq('id', id);

		if (error) throw error;
	},

	async getProfileById(id: string): Promise<AccessProfile | null> {
		const supabase = createClient();
		
		const { data, error } = await supabase
			.from('access_profiles')
			.select('*')
			.eq('id', id)
			.single();

		if (error) return null;

		return {
			...data,
			permissions: data.permissions || {},
			scope: data.obra_scope === 'ALL' ? 'ALL_SITES' : 'SPECIFIC_SITES',
			allowed_sites: [],
		} as AccessProfile;
	},
};
