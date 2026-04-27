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

	const isAuthRoute = request.nextUrl.pathname.startsWith('/auth');
	const isLoginRoute = request.nextUrl.pathname === '/auth/login';
	const isSelectInstanceRoute =
		request.nextUrl.pathname === '/selecionar-instancia';
	const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');

	const selectedCompanyId = request.cookies.get('selectedCompanyId')?.value;

	// Permitir o Next carregar scripts internos e API publico
	if (
		request.nextUrl.pathname.startsWith('/api') ||
		request.nextUrl.pathname.startsWith('/_next') ||
		request.nextUrl.pathname.includes('.')
	) {
		return supabaseResponse;
	}

	// Permite que pule a rota de instâncias
	if (request.nextUrl.pathname === '/selecionar-instancia') {
		if (!user) {
			const url = request.nextUrl.clone();
			url.pathname = '/auth/login';
			return NextResponse.redirect(url);
		}
		// Se estiver logado, ele simplesmente cai no return supabaseResponse do final.
		return supabaseResponse;
	}

	// Situação 1: O usuário NÃO está logado mas tentando acessar o sistema fechado (raíz)
	if (!user && !isAuthRoute && !isSelectInstanceRoute && !isAdminRoute) {
		const url = request.nextUrl.clone();
		url.pathname = '/auth/login';
		return NextResponse.redirect(url);
	}

	// Situação 2: O usuário JÁ está logado mas não escolheu a filial ainda
	if (
		user &&
		!selectedCompanyId &&
		!isSelectInstanceRoute &&
		!isLoginRoute &&
		!isAdminRoute
	) {
		const url = request.nextUrl.clone();
		url.pathname = '/selecionar-instancia';
		return NextResponse.redirect(url);
	}

	// Situação 3: O usuário JÁ está logado mas tentando acessar a tela de Login novamente
	if (user && isLoginRoute) {
		if (selectedCompanyId) {
			const url = request.nextUrl.clone();
			url.pathname = '/obras';
			return NextResponse.redirect(url);
		} else {
			const url = request.nextUrl.clone();
			url.pathname = '/selecionar-instancia';
			return NextResponse.redirect(url);
		}
	}

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
