import { redirect } from 'next/navigation';

export default async function FerramentasObraRedirectPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	redirect(`/obras/${id}/ferramentas/disponiveis`);
}
