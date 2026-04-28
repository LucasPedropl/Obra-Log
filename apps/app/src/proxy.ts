import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
	// Cria uma cópia da resposta inicial caso o middleware não faça nenhum redirect duro
	let supabaseResponse = NextResponse.next({
		request,
	});

	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
	const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

	const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
		cookies: {
			getAll() {
				return request.cookies.getAll();
			},
			setAll(cookiesToSet) {
				cookiesToSet.forEach(({ name, value, options }) => {
					request.cookies.set(name, value);
					supabaseResponse.cookies.set(name, value, options);
				});
			},
		},
	});

	// IMPORTANTE: supabase.auth.getUser() em vez de getSession(),
	// para atestar se o token atual ainda é válido
	const {
		data: { user },
	} = await supabase.auth.getUser();

	// Verificação de existência no banco público
	let userExistsInDb = true; // Por padrão assumimos que existe para evitar logouts falsos
	if (user) {
		const { data: dbUser, error: dbError } = await supabase
			.from('users')
			.select('id')
			.eq('id', user.id)
			.maybeSingle();
		
		// Só marcamos como não existente se a consulta retornar COM SUCESSO (sem erro) e o resultado for NULO.
		// Se houver erro (dbError), mantemos userExistsInDb como true para evitar expulsão por falha técnica.
		if (!dbError && dbUser === null) {
			userExistsInDb = false;
		}
	}

	const pathname = request.nextUrl.pathname;
	const isAuthRoute = pathname.startsWith('/auth');
	const isLoginRoute = pathname === '/auth/login';
	const isSelectInstanceRoute = pathname === '/selecionar-instancia';
	const isAdminRoute = pathname.startsWith('/admin');
	const isPublicApi = pathname.startsWith('/api/public') || pathname.startsWith('/api/webhooks');

	const selectedCompanyId = request.cookies.get('selectedCompanyId')?.value;

	// Permitir o Next carregar scripts internos e assets
	if (
		pathname.startsWith('/_next') ||
		pathname.includes('.')
	) {
		return supabaseResponse;
	}

	// Situação 0: Usuário "fantasma" (logado no Auth mas definitivamente removido do DB)
	if (user && !userExistsInDb && !isAuthRoute) {
		await supabase.auth.signOut();
		const url = request.nextUrl.clone();
		url.pathname = '/auth/login';
		
		const response = NextResponse.redirect(url);
		
		// Copiar cookies de limpeza
		supabaseResponse.cookies.getAll().forEach(cookie => {
			response.cookies.set(cookie);
		});

		// Limpar cookies de empresa
		response.cookies.delete('selectedCompanyId');
		response.cookies.delete('parentCompanyId');
		
		return response;
	}

	// Situação 1: O usuário NÃO está logado
	if ((!user || !userExistsInDb) && !isAuthRoute && !isPublicApi) {
		const url = request.nextUrl.clone();
		url.pathname = '/auth/login';
		return NextResponse.redirect(url);
	}

	// Situação 2: O usuário JÁ está logado mas não escolheu a filial ainda
	if (
		user &&
		userExistsInDb &&
		!selectedCompanyId &&
		!isSelectInstanceRoute &&
		!isLoginRoute &&
		!isAdminRoute &&
		!isPublicApi
	) {
		const url = request.nextUrl.clone();
		url.pathname = '/selecionar-instancia';
		return NextResponse.redirect(url);
	}

	// Situação 3: O usuário JÁ está logado mas tentando acessar a tela de Login novamente
	if (user && userExistsInDb && isLoginRoute) {
		const url = request.nextUrl.clone();
		url.pathname = selectedCompanyId ? '/obras' : '/selecionar-instancia';
		return NextResponse.redirect(url);
	}

	return supabaseResponse;
}

export const config = {
	matcher: [
		'/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
	],
};
