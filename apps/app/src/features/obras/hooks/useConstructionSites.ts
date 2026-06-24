import {
	createConstructionSiteAdmin,
	deleteConstructionSiteAdmin,
	getConstructionSitesAdmin,
	updateConstructionSiteAdmin,
} from '@/app/actions/adminActions';
import { getActiveCompanyId } from '@/lib/utils';
import { useState } from 'react';
import {
	constructionSiteSchema,
	type ConstructionSiteFormData,
} from '../schemas/constructionSiteSchema';

export { constructionSiteSchema, type ConstructionSiteFormData };

export function useConstructionSites() {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const createConstructionSite = async (data: ConstructionSiteFormData) => {
		try {
			setIsLoading(true);
			setError(null);
			const companyId = getActiveCompanyId();

			if (!companyId) {
				setError('Nenhuma empresa selecionada.');
				return false;
			}

			await createConstructionSiteAdmin({
				name: data.name,
				company_id: companyId,
			});

			return true;
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : 'Erro ao cadastrar a obra';
			console.error('Error creating construction site:', err);
			setError(message);
			return false;
		} finally {
			setIsLoading(false);
		}
	};

	const updateConstructionSite = async (
		id: string,
		data: ConstructionSiteFormData,
	) => {
		try {
			setIsLoading(true);
			setError(null);
			const companyId = getActiveCompanyId();
			if (!companyId) {
				setError('Nenhuma empresa selecionada.');
				return false;
			}
			await updateConstructionSiteAdmin(id, {
				name: data.name,
				company_id: companyId,
			});
			return true;
		} catch (err: unknown) {
			const message =
				err instanceof Error ? err.message : 'Erro ao atualizar a obra';
			console.error('Error updating construction site:', err);
			setError(message);
			return false;
		} finally {
			setIsLoading(false);
		}
	};

	const deleteConstructionSite = async (id: string) => {
		try {
			setIsLoading(true);
			setError(null);
			const companyId = getActiveCompanyId();
			if (!companyId) {
				setError('Nenhuma empresa selecionada.');
				return false;
			}
			await deleteConstructionSiteAdmin(id, companyId);
			return true;
		} catch (err: unknown) {
			const message =
				err instanceof Error ? err.message : 'Erro ao excluir a obra';
			console.error('Error deleting construction site:', err);
			setError(message);
			return false;
		} finally {
			setIsLoading(false);
		}
	};

	const fetchConstructionSites = async () => {
		try {
			setIsLoading(true);
			setError(null);
			const companyId = getActiveCompanyId();

			if (!companyId) {
				console.warn('Attempted to fetch construction sites without a selected company.');
				return [];
			}

			const data = await getConstructionSitesAdmin(companyId);
			return data || [];
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : 'Erro ao buscar as obras';
			console.error('Error fetching construction sites:', err);
			setError(message);
			return [];
		} finally {
			setIsLoading(false);
		}
	};

	return {
		createConstructionSite,
		updateConstructionSite,
		deleteConstructionSite,
		fetchConstructionSites,
		isLoading,
		error,
	};
}
