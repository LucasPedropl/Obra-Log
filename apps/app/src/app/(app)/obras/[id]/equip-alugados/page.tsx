import { redirect } from 'next/navigation';

export default async function EquipAlugadosObraRedirectPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	redirect(`/obras/${id}/equip-alugados/ativos`);
}
