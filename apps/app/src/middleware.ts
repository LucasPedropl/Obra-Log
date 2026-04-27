import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
	// Cria uma cópia da resposta inicial caso o middleware não faça nenhum redirect duro
	let supabaseResponse = NextResponse.next({
		request,
	});

	// Ignorar variáveis ausentes no servidor (caso não possua .env rodando)
	// para evitar que o servidor "quebre" completamente com throw Error
	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
	const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

	const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
		cookies: {
			getAll() {
				return request.cookies.getAll();
			},
			setAll(cookiesToSet) {
				cookiesToSet.forEach(({ name, value }) =>
					request.cookies.set(name, value),
				);
				supabaseResponse = NextResponse.next({
					request,
				});
				cookiesToSet.forEach(({ name, value, options }) =>
					supabaseResponse.cookies.set(name, value, options),
				);
			},
		},
	});

	// IMPORTANTE: supabase.auth.getUser() em vez de getSession(),
	// para ir internamente aos servidores Supabase atestar se o token atual ainda é válido
	const {
		data: { user },
	} = await supabase.auth.getUser();

	// Verificação adicional: Se o banco de dados public foi resetado mas o Auth não,
	// o token ainda pode ser válido mas o usuário não existe mais no nosso esquema.
	let userExistsInDb = false;
	if (user) {
		try {
			const { data: dbUser, error: dbError } = await supabase
				.from('users')
				.select('id')
				.eq('id', user.id)
				.maybeSingle();
			
			// Se houver erro de tabela inexistente ou o usuário for nulo, consideramos que não existe
			userExistsInDb = !!dbUser && !dbError;
		} catch (err) {
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

	// Situação 0: Usuário "fantasma" (logado no Auth mas removido do DB/resetado)
	if (user && !userExistsInDb && !isAuthRoute) {
		// Se ele está no Auth mas não no banco público, forçamos o logout e redirect
		await supabase.auth.signOut();
		const url = request.nextUrl.clone();
		url.pathname = '/auth/login';
		
		const response = NextResponse.redirect(url);
		
		// Limpar cookies de sessão e empresa por segurança
		response.cookies.delete('selectedCompanyId');
		response.cookies.delete('parentCompanyId');
		
		// Tentar remover cookies do Supabase Auth para garantir limpeza total no browser
		const cookiesToClear = request.cookies.getAll();
		cookiesToClear.forEach(cookie => {
			if (cookie.name.includes('auth-token') || cookie.name.includes('supabase-auth')) {
				response.cookies.delete(cookie.name);
			}
		});

		return response;
	}

	// Situação 1: O usuário NÃO está logado mas tentando acessar o sistema fechado
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

	return supabaseResponse;
}

export const config = {
	matcher: [
		/*
		 * Ativa o Middleware em TODOS OS LUGARES, exceto rotas técnicas que não precisam:
		 * - _next/static (scripts essenciais do react/next)
		 * - _next/image (conversores globais nativos)
		 * - favicon.ico
		 * - Extensões gerais puras
		 */
		'/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
	],
};
