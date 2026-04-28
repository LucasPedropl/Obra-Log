import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
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

	// Refresca o token se necessário
	const {
		data: { user },
	} = await supabase.auth.getUser();

	const pathname = request.nextUrl.pathname;
	const isAuthRoute = pathname.startsWith('/login');

	// Permitir o Next carregar scripts internos e assets
	if (
		pathname.startsWith('/_next') ||
		pathname.includes('.') ||
		pathname === '/favicon.ico'
	) {
		return supabaseResponse;
	}

	// Se não estiver logado e tentar acessar área protegida
	if (!user && !isAuthRoute) {
		const url = request.nextUrl.clone();
		url.pathname = '/login';
		return NextResponse.redirect(url);
	}

	// Se estiver logado, verificar se é super admin
	if (user) {
		const { data: userData } = await supabase
			.from('users')
			.select('is_super_admin')
			.eq('id', user.id)
			.maybeSingle();

		// Se não for super admin, força logout e volta pro login
		if (!userData?.is_super_admin) {
			await supabase.auth.signOut();
			const url = request.nextUrl.clone();
			url.pathname = '/login';
			return NextResponse.redirect(url);
		}

		// Se estiver logado e tentar ir pro login, manda pro dashboard
		if (isAuthRoute) {
			const url = request.nextUrl.clone();
			url.pathname = '/dashboard';
			return NextResponse.redirect(url);
		}
	}

	return supabaseResponse;
}

export const config = {
	matcher: [
		/*
		 * Ativa o Middleware em todas as rotas exceto as técnicas:
		 */
		'/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
	],
};
