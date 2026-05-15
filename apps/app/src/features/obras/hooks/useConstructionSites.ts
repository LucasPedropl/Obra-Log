import {
	createConstructionSiteAdmin,
	getConstructionSitesAdmin,
} from '@/app/actions/adminActions';
import { getActiveCompanyId } from '@/lib/utils';
import { useState } from 'react';
import { z } from 'zod';

export const constructionSiteSchema = z.object({
	name: z.string().min(1, 'O nome da obra é obrigatório'),
});

export type ConstructionSiteFormData = z.infer<typeof constructionSiteSchema>;

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
		fetchConstructionSites,
		isLoading,
		error,
	};
}
