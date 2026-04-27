import { createClient } from '@/config/supabase';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005';

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
		const {
			data: { session },
		} = await supabase.auth.getSession();

		const response = await fetch(
			`${API_URL}/api/access_profiles?company_id=${companyId}`,
			{
				headers: {
					Authorization: `Bearer ${session?.access_token}`,
				},
			},
		);

		if (!response.ok) throw new Error('Falha ao buscar perfis de acesso');
		return response.json();
	},

	async createProfile(
		data: Omit<AccessProfile, 'id'>,
	): Promise<AccessProfile> {
		const supabase = createClient();
		const {
			data: { session },
		} = await supabase.auth.getSession();

		const response = await fetch(`${API_URL}/api/access_profiles`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${session?.access_token}`,
			},
			body: JSON.stringify(data),
		});

		if (!response.ok) throw new Error('Falha ao criar perfil de acesso');
		return response.json();
	},

	async updateProfile(
		id: string,
		data: Partial<AccessProfile>,
	): Promise<AccessProfile> {
		const supabase = createClient();
		const {
			data: { session },
		} = await supabase.auth.getSession();

		const response = await fetch(`${API_URL}/api/access_profiles/${id}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${session?.access_token}`,
			},
			body: JSON.stringify(data),
		});

		if (!response.ok)
			throw new Error('Falha ao atualizar perfil de acesso');
		return response.json();
	},

	async deleteProfile(id: string): Promise<void> {
		const supabase = createClient();
		const {
			data: { session },
		} = await supabase.auth.getSession();

		const response = await fetch(`${API_URL}/api/access_profiles/${id}`, {
			method: 'DELETE',
			headers: {
				Authorization: `Bearer ${session?.access_token}`,
			},
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(
				errorData.error || 'Falha ao deletar perfil de acesso',
			);
		}
	},
};
