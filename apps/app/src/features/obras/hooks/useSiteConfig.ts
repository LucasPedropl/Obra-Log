import { useCallback, useEffect, useState } from 'react';
import {
	getConstructionSiteByIdAdmin,
	updateSiteConfigAdmin,
} from '@/app/actions/adminActions';
import type { SiteConfigFormData } from '../schemas/constructionSiteSchema';

export interface SiteConfig {
	id: string;
	name: string;
	tolerance_minutes: number;
	workday_schedule_json: any;
}

/**
 * Loads and persists the operational configuration of a single construction
 * site (workday schedule and tolerance), used by the site config page.
 */
export function useSiteConfig(siteId: string) {
	const [config, setConfig] = useState<SiteConfig | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fetchConfig = useCallback(async () => {
		try {
			setIsLoading(true);
			setError(null);
			const data = await getConstructionSiteByIdAdmin(siteId);
			if (data) {
				setConfig({
					id: data.id,
					name: data.name,
					tolerance_minutes: Number(data.tolerance_minutes ?? 0),
					workday_schedule_json: data.workday_schedule_json || {
						monday: { start: '08:00', end: '17:00', active: true },
						tuesday: { start: '08:00', end: '17:00', active: true },
						wednesday: { start: '08:00', end: '17:00', active: true },
						thursday: { start: '08:00', end: '17:00', active: true },
						friday: { start: '08:00', end: '17:00', active: true },
						saturday: { start: '08:00', end: '12:00', active: true },
						sunday: { start: '', end: '', active: false },
					},
				});
			}
		} catch (err: unknown) {
			const message =
				err instanceof Error ? err.message : 'Erro ao carregar a configuração da obra';
			console.error('Error fetching site config:', err);
			setError(message);
		} finally {
			setIsLoading(false);
		}
	}, [siteId]);

	useEffect(() => {
		if (siteId) fetchConfig();
	}, [siteId, fetchConfig]);

	const saveConfig = async (data: SiteConfigFormData): Promise<boolean> => {
		try {
			setIsSaving(true);
			setError(null);
			await updateSiteConfigAdmin(siteId, data);
			await fetchConfig();
			return true;
		} catch (err: unknown) {
			const message =
				err instanceof Error ? err.message : 'Erro ao salvar a configuração da obra';
			console.error('Error saving site config:', err);
			setError(message);
			return false;
		} finally {
			setIsSaving(false);
		}
	};

	return { config, isLoading, isSaving, error, saveConfig, refetch: fetchConfig };
}
