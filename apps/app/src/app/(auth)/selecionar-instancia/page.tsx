import { SelectInstanceClient } from './SelectInstanceClient';
import { cookies } from 'next/headers';

export default async function SelectInstancePage() {
	// Middleware já garante que há sessão aqui!
	return <SelectInstanceClient />;
}
