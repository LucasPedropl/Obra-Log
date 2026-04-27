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
	allowed_sites: string[];
}

export const accessProfilesService = {
	async getProfiles(companyId: string): Promise<AccessProfile[]> {
		const supabase = createClient();
		const { data, error } = await supabase
			.from('access_profiles')
			.select('*')
			.eq('company_id', companyId)
			.order('name', { ascending: true });

		if (error) throw error;
		return (data as any[]) || [];
	},

	async createProfile(
		data: Omit<AccessProfile, 'id'>,
	): Promise<AccessProfile> {
		const supabase = createClient();
		const { data: profile, error } = await supabase
			.from('access_profiles')
			.insert(data)
			.select()
			.single();

		if (error) throw error;
		return profile as AccessProfile;
	},

	async updateProfile(
		id: string,
		data: Partial<AccessProfile>,
	): Promise<AccessProfile> {
		const supabase = createClient();
		const { data: profile, error } = await supabase
			.from('access_profiles')
			.update(data)
			.eq('id', id)
			.select()
			.single();

		if (error) throw error;
		return profile as AccessProfile;
	},

	async deleteProfile(id: string): Promise<void> {
		const supabase = createClient();
		const { error } = await supabase
			.from('access_profiles')
			.delete()
			.eq('id', id);

		if (error) throw error;
	},
};
