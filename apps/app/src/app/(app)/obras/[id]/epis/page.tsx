import { redirect } from 'next/navigation';

export default async function EpisObraRedirectPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	redirect(`/obras/${id}/epis/disponiveis`);
}
