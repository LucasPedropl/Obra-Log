import { useState, useEffect } from 'react';
import { getSiteCollaboratorsAdmin } from '@/app/actions/adminActions';

export interface SiteCollaborator {
	id: string; // site_collaborators.id
	collaboratorId: string; // collaborators.id
	name: string;
	role_title: string;
	cpf: string;
}

interface RawSiteCollaborator {
	id: string;
	collaborator_id: string;
	collaborators: {
		name: string | null;
		role_title: string | null;
		cpf: string | null;
	} | null;
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
			const formatted: SiteCollaborator[] = (rawData as unknown as RawSiteCollaborator[]).map((item) => ({
				id: item.id,
				collaboratorId: item.collaborator_id,
				name: item.collaborators?.name || 'Vazio',
				role_title: item.collaborators?.role_title || 'Sem função',
				cpf: item.collaborators?.cpf || 'Sem CPF',
			}));
			setCollaborators(formatted);
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : 'Erro ao carregar colaboradores da obra';
			console.error('Error fetching site collaborators:', err);
			setError(message);
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
