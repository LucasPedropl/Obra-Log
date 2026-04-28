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
		
		const { data: profiles, error: profileError } = await supabase
			.from('access_profiles')
			.select('*')
			.eq('company_id', companyId)
			.order('name', { ascending: true });

		if (profileError) throw profileError;

		if (!profiles || profiles.length === 0) return [];

		const profileIds = profiles.map(p => p.id);
		const { data: permsData, error: permsError } = await supabase
			.from('profile_permissions')
			.select('*')
			.in('profile_id', profileIds);

		if (permsError) throw permsError;

		return profiles.map(profile => {
			const profilePerms = permsData.filter(p => p.profile_id === profile.id);
			const permissionsObj: Record<string, any> = {};
			let scope: 'ALL_SITES' | 'SPECIFIC_SITES' = 'SPECIFIC_SITES';

			profilePerms.forEach(p => {
				if (p.permission_key.startsWith('SCOPE.')) {
					scope = p.permission_key.split('.')[1] as any;
				} else {
					const parts = p.permission_key.split('.');
					if (parts.length === 2) {
						const [resource, action] = parts;
						if (!permissionsObj[resource]) {
							permissionsObj[resource] = { view: false, create: false, edit: false, delete: false };
						}
						permissionsObj[resource][action] = true;
					}
				}
			});

			return {
				...profile,
				permissions: permissionsObj,
				scope,
				allowed_sites: [],
			};
		}) as AccessProfile[];
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
			})
			.select()
			.single();

		if (error) throw error;

		const permissionsToInsert: { profile_id: string; permission_key: string }[] = [];
		
		if (data.scope) {
			permissionsToInsert.push({
				profile_id: profile.id,
				permission_key: `SCOPE.${data.scope}`
			});
		}

		if (data.permissions) {
			Object.entries(data.permissions).forEach(([resource, actions]) => {
				Object.entries(actions).forEach(([action, value]) => {
					if (value) {
						permissionsToInsert.push({
							profile_id: profile.id,
							permission_key: `${resource}.${action}`
						});
					}
				});
			});
		}

		if (permissionsToInsert.length > 0) {
			const { error: permsError } = await supabase
				.from('profile_permissions')
				.insert(permissionsToInsert);
			
			if (permsError) throw permsError;
		}

		return {
			...profile,
			permissions: data.permissions || {},
			scope: data.scope || 'ALL_SITES',
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
		
		let profile: any = { id };
		
		if (Object.keys(updateData).length > 0) {
			const { data: updatedProfile, error } = await supabase
				.from('access_profiles')
				.update(updateData)
				.eq('id', id)
				.select()
				.single();

			if (error) throw error;
			profile = updatedProfile;
		}

		if (data.permissions || data.scope) {
			const { error: deleteError } = await supabase
				.from('profile_permissions')
				.delete()
				.eq('profile_id', id);

			if (deleteError) throw deleteError;

			const permissionsToInsert: { profile_id: string; permission_key: string }[] = [];
			
			if (data.scope) {
				permissionsToInsert.push({
					profile_id: id,
					permission_key: `SCOPE.${data.scope}`
				});
			}

			if (data.permissions) {
				Object.entries(data.permissions).forEach(([resource, actions]) => {
					Object.entries(actions).forEach(([action, value]) => {
						if (value) {
							permissionsToInsert.push({
								profile_id: id,
								permission_key: `${resource}.${action}`
							});
						}
					});
				});
			}

			if (permissionsToInsert.length > 0) {
				const { error: permsError } = await supabase
					.from('profile_permissions')
					.insert(permissionsToInsert);
				
				if (permsError) throw permsError;
			}
		}

		return {
			...profile,
			permissions: data.permissions || {},
			scope: data.scope || 'ALL_SITES',
			allowed_sites: []
		} as AccessProfile;
	},

	async deleteProfile(id: string): Promise<void> {
		const supabase = createClient();
		
		// Delete permissions first to prevent foreign key errors
		await supabase.from('profile_permissions').delete().eq('profile_id', id);
		
		const { error } = await supabase
			.from('access_profiles')
			.delete()
			.eq('id', id);

		if (error) throw error;
	},
};
