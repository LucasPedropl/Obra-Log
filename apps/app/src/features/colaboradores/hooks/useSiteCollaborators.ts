import { useState, useEffect } from 'react';
import { getSiteCollaboratorsAdmin } from '@/app/actions/adminActions';

export interface SiteCollaborator {
	id: string; // site_collaborators.id
	collaboratorId: string; // collaborators.id
	name: string;
	role_title: string;
	cpf: string;
}

export function useSiteCollaborators(siteId: string) {
	const [collaborators, setCollaborators] = useState<SiteCollaborator[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchCollaborators = async () => {
		try {
			setIsLoading(true);
			setError(null);
			const rawData = await getSiteCollaboratorsAdmin(siteId);
			const formatted: SiteCollaborator[] = rawData.map((item: any) => ({
				id: item.id,
				collaboratorId: item.collaborator_id,
				name: item.collaborators?.name || 'Vazio',
				role_title: item.collaborators?.role_title || 'Sem função',
				cpf: item.collaborators?.cpf || 'Sem CPF',
			}));
			setCollaborators(formatted);
		} catch (err: any) {
			console.error('Error fetching site collaborators:', err);
			setError(err.message);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		if (siteId) {
			fetchCollaborators();
		}
	}, [siteId]);

	return { collaborators, isLoading, error, refetch: fetchCollaborators };
}
