import { redirect } from 'next/navigation';
import {
	assertSiteAccess,
	getAuthenticatedUserId,
} from '@/app/actions/_helpers';

export default async function ObraLayout({
	children,
	params,
}: {
	children: React.ReactNode;
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;

	try {
		const userId = await getAuthenticatedUserId();
		await assertSiteAccess(userId, id);
	} catch {
		redirect('/unauthorized');
	}

	return <>{children}</>;
}
