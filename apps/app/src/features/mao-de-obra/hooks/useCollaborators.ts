import { useState } from 'react';
import { getActiveCompanyId } from '@/lib/utils';
import { unmask, parseCurrencyToNumber } from '@/lib/maskUtils';
import {
	createCollaboratorAdmin,
	updateCollaboratorAdmin,
	getCollaboratorsAdmin,
	deleteCollaboratorAdmin,
	getAccessProfilesAdmin,
} from '@/app/actions/adminActions';

import {
	collaboratorSchema,
	type CollaboratorFormData,
} from '../schemas/collaboratorSchema';

export { collaboratorSchema, type CollaboratorFormData };

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

			const formatDate = (dateStr: string | null | undefined) => {
				if (!dateStr) return null;
				const parts = dateStr.split('/');
				if (parts.length === 3) {
					return `${parts[2]}-${parts[1]}-${parts[0]}`;
				}
				return dateStr;
			};

			const payload = {
				company_id: companyId,
				name: data.name,
				role_title: data.role_title,
				daily_rate: parseCurrencyToNumber(data.daily_rate),
				cpf: data.cpf ? unmask(data.cpf) : null,
				rg: data.rg || null,
				birth_date: formatDate(data.birth_date),
				cellphone: data.cellphone ? unmask(data.cellphone) : null,
				email: data.email || null,
				bank_name: data.bank_name?.trim() || null,
				pix_key_type: data.pix_key_type || null,
				pix_key: data.pix_key
					? data.pix_key_type === 'EMAIL' || data.pix_key_type === 'ALEATORIA'
						? data.pix_key.trim()
						: unmask(data.pix_key)
					: null,
				cep: data.cep ? unmask(data.cep) : null,
				street: data.street || null,
				number: data.number || null,
				neighborhood: data.neighborhood || null,
				complement: data.complement || null,
				city: data.city || null,
				state: data.state || null,
				profile_id: data.profile_id || null,
				documents_json: data.documents_json || [],
			};

			await createCollaboratorAdmin(payload);

			return true;
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : 'Erro ao cadastrar o colaborador';
			console.error('Error creating collaborator:', err);
			setError(message);
			return false;
		} finally {
			setIsLoading(false);
		}
	};

	const updateCollaborator = async (id: string, data: CollaboratorFormData) => {
		try {
			setIsLoading(true);
			setError(null);
			const companyId = getActiveCompanyId();

			if (!companyId) throw new Error('Nenhuma empresa selecionada.');

			const formatDate = (dateStr: string | null | undefined) => {
				if (!dateStr) return null;
				const parts = dateStr.split('/');
				if (parts.length === 3) {
					return `${parts[2]}-${parts[1]}-${parts[0]}`;
				}
				return dateStr;
			};

			const payload = {
				company_id: companyId,
				name: data.name,
				role_title: data.role_title,
				daily_rate: parseCurrencyToNumber(data.daily_rate),
				cpf: data.cpf ? unmask(data.cpf) : null,
				rg: data.rg || null,
				birth_date: formatDate(data.birth_date),
				cellphone: data.cellphone ? unmask(data.cellphone) : null,
				email: data.email || null,
				bank_name: data.bank_name?.trim() || null,
				pix_key_type: data.pix_key_type || null,
				pix_key: data.pix_key
					? data.pix_key_type === 'EMAIL' || data.pix_key_type === 'ALEATORIA'
						? data.pix_key.trim()
						: unmask(data.pix_key)
					: null,
				cep: data.cep ? unmask(data.cep) : null,
				street: data.street || null,
				number: data.number || null,
				neighborhood: data.neighborhood || null,
				complement: data.complement || null,
				city: data.city || null,
				state: data.state || null,
				profile_id: data.profile_id || null,
				documents_json: data.documents_json || [],
			};

			await updateCollaboratorAdmin(id, payload);

			return true;
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : 'Erro ao atualizar o colaborador';
			console.error('Error updating collaborator:', err);
			setError(message);
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
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : 'Erro ao buscar os colaboradores';
			console.error('Error fetching collaborators:', err);
			setError(message);
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
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : 'Erro ao excluir o colaborador';
			console.error('Error deleting collaborator:', err);
			setError(message);
			return false;
		} finally {
			setIsLoading(false);
		}
	};

	const fetchAccessProfiles = async () => {
		try {
			setIsLoading(true);
			setError(null);
			const companyId = getActiveCompanyId();
			if (!companyId) return [];

			const data = await getAccessProfilesAdmin(companyId);
			return data || [];
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : 'Erro ao buscar os perfis de acesso';
			console.error('Error fetching access profiles:', err);
			setError(message);
			return [];
		} finally {
			setIsLoading(false);
		}
	};

	return {
		createCollaborator,
		updateCollaborator,
		fetchCollaborators,
		deleteCollaborator,
		fetchAccessProfiles,
		isLoading,
		error,
	};
}
