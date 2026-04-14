import { useState } from 'react';
import { getActiveCompanyId } from '@/lib/utils';
import { z } from 'zod';
import {
	createCollaboratorAdmin,
	getCollaboratorsAdmin,
	deleteCollaboratorAdmin,
} from '@/app/actions/adminActions';

export const collaboratorSchema = z.object({
	name: z.string().min(1, 'O nome é obrigatório'),
	role_title: z.string().min(1, 'O cargo/função é obrigatório'),
	cpf: z.string().optional(),
	rg: z.string().optional(),
	birth_date: z.string().optional(),
	cellphone: z.string().optional(),
	email: z.string().email('Email inválido').optional().or(z.literal('')),
	cep: z.string().optional(),
	street: z.string().optional(),
	number: z.string().optional(),
	neighborhood: z.string().optional(),
});

export type CollaboratorFormData = z.infer<typeof collaboratorSchema>;

export function useCollaborators() {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const createCollaborator = async (data: CollaboratorFormData) => {
		try {
			setIsLoading(true);
			setError(null);
			const companyId = getActiveCompanyId();

			if (!companyId) {
				throw new Error('Nenhuma empresa selecionada.');
			}

			const payload = {
				company_id: companyId,
				name: data.name,
				role_title: data.role_title,
				cpf: data.cpf || null,
				rg: data.rg || null,
				birth_date: data.birth_date || null,
				cellphone: data.cellphone || null,
				email: data.email || null,
				cep: data.cep || null,
				street: data.street || null,
				number: data.number || null,
				neighborhood: data.neighborhood || null,
			};

			await createCollaboratorAdmin(payload);

			return true;
		} catch (err: any) {
			console.error('Error creating collaborator:', err);
			setError(err.message || 'Erro ao cadastrar o colaborador');
			return false;
		} finally {
			setIsLoading(false);
		}
	};

	const fetchCollaborators = async () => {
		try {
			setIsLoading(true);
			setError(null);
			const companyId = getActiveCompanyId();
			if (!companyId) return [];

			const data = await getCollaboratorsAdmin(companyId);
			return data || [];
		} catch (err: any) {
			console.error('Error fetching collaborators:', err);
			setError(err.message || 'Erro ao buscar os colaboradores');
			return [];
		} finally {
			setIsLoading(false);
		}
	};

	const deleteCollaborator = async (id: string) => {
		try {
			setIsLoading(true);
			setError(null);
			const companyId = getActiveCompanyId();
			if (!companyId) throw new Error('Nenhuma empresa selecionada.');

			await deleteCollaboratorAdmin(id, companyId);
			return true;
		} catch (err: any) {
			console.error('Error deleting collaborator:', err);
			setError(err.message || 'Erro ao excluir o colaborador');
			return false;
		} finally {
			setIsLoading(false);
		}
	};

	return {
		createCollaborator,
		fetchCollaborators,
		deleteCollaborator,
		isLoading,
		error,
	};
}
