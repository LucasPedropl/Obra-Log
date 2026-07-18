import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Rotas acessíveis sem autenticação. Todo o resto exige sessão válida.
const PUBLIC_PREFIXES = ['/auth', '/privacidade', '/termos'];

function isPublicPath(pathname: string): boolean {
	return PUBLIC_PREFIXES.some(
		(prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
	);
}

/** Copia cookies de sessão renovados para a resposta de redirect. */
function withSessionCookies(
	redirect: NextResponse,
	source: NextResponse,
): NextResponse {
	source.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
	return redirect;
}

export default async function proxy(request: NextRequest) {
	let response = NextResponse.next({ request });

	const supabase = createServerClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
		{
			cookies: {
				getAll() {
					return request.cookies.getAll();
				},
				setAll(cookiesToSet) {
					cookiesToSet.forEach(({ name, value }) =>
						request.cookies.set(name, value),
					);
					response = NextResponse.next({ request });
					cookiesToSet.forEach(({ name, value, options }) =>
						response.cookies.set(name, value, options),
					);
				},
			},
		},
	);

	// getUser() valida o JWT no servidor do Supabase e, se expirado, renova a
	// sessão via refresh token — os cookies renovados ficam em `response`.
	const {
		data: { user },
	} = await supabase.auth.getUser();

	const { pathname } = request.nextUrl;

	if (!user && !isPublicPath(pathname)) {
		const loginUrl = request.nextUrl.clone();
		loginUrl.pathname = '/auth/login';
		loginUrl.search = '';
		if (pathname !== '/') {
			loginUrl.searchParams.set('redirectTo', pathname);
		}
		return withSessionCookies(NextResponse.redirect(loginUrl), response);
	}

	// Usuário autenticado não tem motivo para ver a tela de login.
	if (user && (pathname === '/auth/login' || pathname.startsWith('/auth/login/'))) {
		const homeUrl = request.nextUrl.clone();
		homeUrl.pathname = '/empresas';
		homeUrl.search = '';
		return withSessionCookies(NextResponse.redirect(homeUrl), response);
	}

	return response;
}

export const config = {
	matcher: [
		'/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|map)$).*)',
	],
};
