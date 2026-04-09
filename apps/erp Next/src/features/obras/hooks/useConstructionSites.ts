import { useState } from 'react';
import { getActiveCompanyId } from '@/lib/utils';
import { z } from 'zod';
import {
	createConstructionSiteAdmin,
	getConstructionSitesAdmin,
} from '@/app/actions/adminActions';

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
				throw new Error('Nenhuma empresa selecionada.');
			}

			await createConstructionSiteAdmin({
				name: data.name,
				company_id: companyId,
			});

			return true;
		} catch (err: any) {
			console.error('Error creating construction site:', err);
			setError(err.message || 'Erro ao cadastrar a obra');
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
				throw new Error('Nenhuma empresa selecionada.');
			}

			const data = await getConstructionSitesAdmin(companyId);
			return data || [];
		} catch (err: any) {
			console.error('Error fetching construction sites:', err);
			setError(err.message || 'Erro ao buscar as obras');
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
