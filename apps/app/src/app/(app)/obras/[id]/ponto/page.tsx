'use client';

import React, { use, useMemo } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { useSiteCollaborators } from '@/features/mao-de-obra/hooks/useSiteCollaborators';
import { useSiteAttendance } from '@/features/ponto/hooks/useSiteAttendance';
import { DailyAttendanceTable } from '@/features/ponto/components/DailyAttendanceTable';
import { Loader2, Users } from 'lucide-react';
import { EmptyState } from '@/components/shared/EmptyState';

export default function PontoObraPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id: siteId } = use(params);

	const todayStr = useMemo(() => {
		const today = new Date();
		const yyyy = today.getFullYear();
		const mm = String(today.getMonth() + 1).padStart(2, '0');
		const dd = String(today.getDate()).padStart(2, '0');
		return `${yyyy}-${mm}-${dd}`;
	}, []);

	const { collaborators, isLoading: loadingColabs } =
		useSiteCollaborators(siteId);
	const { records, isLoading, error, saveCell } = useSiteAttendance(
		siteId,
		todayStr,
		todayStr,
	);

	const gridCollaborators = collaborators.map(
		(c: { collaboratorId: string; name: string; role_title: string }) => ({
			collaboratorId: c.collaboratorId,
			name: c.name,
			role_title: c.role_title,
		}),
	);

	return (
		<ProtectedRoute resource="site_ponto">
			<div className="w-full flex flex-col gap-6">
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
					<PageHeader
						title="Ponto Diário (Hoje)"
						description="Lance a frequência, horários de almoço e observações dos colaboradores para o dia de hoje."
					/>
				</div>

				{error && (
					<div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
						{error}
					</div>
				)}

				{loadingColabs || isLoading ? (
					<div className="flex items-center justify-center p-12">
						<Loader2 className="h-8 w-8 animate-spin text-gray-400" />
					</div>
				) : collaborators.length === 0 ? (
					<EmptyState
						title="Nenhum Colaborador Alocado"
						description="Aloque colaboradores na aba Colaboradores para registrar o ponto."
						icon={<Users className="w-8 h-8 text-gray-400" />}
					/>
				) : (
					<DailyAttendanceTable
						collaborators={gridCollaborators}
						date={todayStr}
						records={records}
						onSave={async (collaboratorId, date, data) =>
							saveCell({
								siteId,
								collaboratorId,
								workDate: date,
								...data,
							})
						}
					/>
				)}
			</div>
		</ProtectedRoute>
	);
}
