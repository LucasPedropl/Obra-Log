import { redirect } from 'next/navigation';

export default function HomePage() {
	// Redireciona a raiz para o roteamento correto (obras)
	redirect('/obras');
}
