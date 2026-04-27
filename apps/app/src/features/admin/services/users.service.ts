import { saveGlobalUserAction, SaveUserResponse } from '@/app/actions/globalUsers';

export const usersService = {
	async createUser(data: {
		email: string;
		full_name: string;
		profile_id: string;
	}): Promise<SaveUserResponse> {
		const result = await saveGlobalUserAction({
			email: data.email,
			fullName: data.full_name,
			isCompanyAdmin: false,
			assignments: data.profile_id ? [{ instanceId: '', profileId: data.profile_id }] : [],
		});

		if (!result.success) {
			throw new Error(result.error || 'Erro ao criar usuário');
		}

		return result;
	},
};
