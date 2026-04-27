const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005';

export const usersService = {
	async createUser(data: any) {
		const response = await fetch(`${API_URL}/api/tenant/users`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(data),
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(errorData.error || 'Erro ao criar usuário');
		}

		return response.json();
	},
};
