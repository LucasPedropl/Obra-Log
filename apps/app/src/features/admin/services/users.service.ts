import { saveGlobalUserAction } from '@/app/actions/globalUsers';

export const usersService = {
	async createUser(data: any) {
		const result = await saveGlobalUserAction({
			email: data.email,
			fullName: data.full_name,
			isCompanyAdmin: false, // Por padrão usuários criados aqui não são admins globais da empresa
			assignments: data.profile_id ? [{ instanceId: '', profileId: data.profile_id }] : [], // Simplificado para o contexto atual
		});

		if (!result.success) {
			throw new Error(result.error || 'Erro ao criar usuário');
		}

		return result;
	},
};
