'use client';

import React, { use } from 'react';
import { Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { SiteConfigForm } from '@/features/obras/components/SiteConfigForm';
import { useSiteConfig } from '@/features/obras/hooks/useSiteConfig';

export default function ObraConfiguracoesPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id: siteId } = use(params);
	const { config, isLoading, isSaving, error, saveConfig } =
		useSiteConfig(siteId);

	return (
		<ProtectedRoute resource="site_config">
			<div className="w-full flex flex-col gap-6">
				<PageHeader
					title="Configuração da Obra"
					description={
						config
							? `Parâmetros operacionais de ${config.name}`
							: 'Parâmetros operacionais da obra'
					}
				/>

				{isLoading ? (
					<div className="flex items-center justify-center p-12">
						<Loader2 className="h-8 w-8 animate-spin text-gray-400" />
					</div>
				) : error && !config ? (
					<div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
						{error}
					</div>
				) : config ? (
					<SiteConfigForm
						defaultValues={{
							tolerance_minutes: config.tolerance_minutes,
							workday_schedule_json: config.workday_schedule_json,
						}}
						isSaving={isSaving}
						onSubmit={saveConfig}
					/>
				) : null}
			</div>
		</ProtectedRoute>
	);
}
