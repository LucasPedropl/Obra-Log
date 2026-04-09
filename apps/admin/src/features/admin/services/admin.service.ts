import { supabase } from '../../../config/supabase';

// Permite configurar a URL da API via .env (útil se o backend estiver no Render e o front na Vercel)
const API_URL = import.meta.env.VITE_API_URL || '';

/**
 * Função utilitária para pegar o token JWT da sessão atual
 */
const getAuthToken = async () => {
	const { data } = await supabase.auth.getSession();
	return data.session?.access_token || '';
};

export const adminService = {
	/**
	 * Cria uma nova empresa (Tenant)
	 */
	async createCompany(name: string, maxInstances: number = 1) {
		const token = await getAuthToken();
		const res = await fetch(`${API_URL}/api/admin/companies`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({ name, max_instances: maxInstances }),
		});

		if (!res.ok) {
			let errMessage = 'Erro ao criar empresa';
			try {
				const err = await res.json();
				errMessage = err.error || errMessage;
			} catch (e) {
				errMessage = `Erro no servidor (${res.status}). A API pode estar offline.`;
			}
			throw new Error(errMessage);
		}

		return res.json();
	},

	/**
	 * Atualiza o nome de uma empresa
	 */
	async updateCompany(companyId: string, name: string) {
		const token = await getAuthToken();
		const res = await fetch(`${API_URL}/api/admin/companies/${companyId}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({ name }),
		});

		if (!res.ok) {
			let errMessage = 'Erro ao atualizar empresa';
			try {
				const err = await res.json();
				errMessage = err.error || errMessage;
			} catch (e) {
				errMessage = `Erro no servidor (${res.status}). A API pode estar offline.`;
			}
			throw new Error(errMessage);
		}

		return res.json();
	},

	/**
	 * Cria um usuário Admin e vincula à empresa
	 */
	async createCompanyAdmin(companyId: string, email: string) {
		const token = await getAuthToken();
		const res = await fetch(`${API_URL}/api/admin/users`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({ companyId, email }),
		});

		if (!res.ok) {
			let errMessage = 'Erro ao criar usuário';
			try {
				const err = await res.json();
				errMessage = err.error || errMessage;
			} catch (e) {
				errMessage = `Erro no servidor (${res.status}). A API pode estar offline.`;
			}
			throw new Error(errMessage);
		}

		return res.json();
	},

	/**
	 * Lista os usuários de uma empresa
	 */
	async getCompanyUsers(companyId: string) {
		const token = await getAuthToken();
		const res = await fetch(
			`${API_URL}/api/admin/companies/${companyId}/users`,
			{
				headers: {
					Authorization: `Bearer ${token}`,
				},
			},
		);

		if (!res.ok) {
			let errMessage = 'Erro ao buscar usuários';
			try {
				const err = await res.json();
				errMessage = err.error || errMessage;
			} catch (e) {
				errMessage = `Erro no servidor (${res.status}). A API pode estar offline.`;
			}
			throw new Error(errMessage);
		}

		return res.json();
	},

	/**
	 * Reseta a senha de um usuário e gera uma nova senha temporária
	 */
	async resetUserPassword(userId: string) {
		const token = await getAuthToken();
		const res = await fetch(
			`${API_URL}/api/admin/users/${userId}/reset-password`,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
			},
		);

		if (!res.ok) {
			let errMessage = 'Erro ao resetar senha';
			try {
				const err = await res.json();
				errMessage = err.error || errMessage;
			} catch (e) {
				errMessage = `Erro no servidor (${res.status}). A API pode estar offline.`;
			}
			throw new Error(errMessage);
		}

		return res.json();
	},

	/**
	 * Deleta uma empresa e todos os seus dados
	 */
	async deleteCompany(companyId: string) {
		const token = await getAuthToken();
		const res = await fetch(`${API_URL}/api/admin/companies/${companyId}`, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`,
			},
		});

		if (!res.ok) {
			let errMessage = 'Erro ao deletar empresa';
			try {
				const err = await res.json();
				errMessage = err.error || errMessage;
			} catch (e) {
				errMessage = `Erro no servidor (${res.status}). A API pode estar offline.`;
			}
			throw new Error(errMessage);
		}

		return res.json();
	},

	/**
	 * Apaga todo o banco de dados, exceto o usuário admin atual
	 */
	async deleteDatabase(adminUserId: string) {
		const token = await getAuthToken();
		const res = await fetch(`${API_URL}/api/admin/delete-database`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({ adminUserId }),
		});

		if (!res.ok) {
			let errMessage = 'Erro ao apagar banco de dados';
			try {
				const err = await res.json();
				errMessage = err.error || errMessage;
			} catch (e) {
				errMessage = `Erro no servidor (${res.status}). A API pode estar offline.`;
			}
			throw new Error(errMessage);
		}

		return res.json();
	},
};
