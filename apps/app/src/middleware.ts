import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
	let supabaseResponse = NextResponse.next({
		request,
	});

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
					supabaseResponse = NextResponse.next({
						request,
					});
					cookiesToSet.forEach(({ name, value, options }) =>
						supabaseResponse.cookies.set(name, value, options),
					);
				},
			},
		},
	);

	const {
		data: { user },
	} = await supabase.auth.getUser();

	const isAuthPage = request.nextUrl.pathname.startsWith('/auth/login');
	const isSelectCompanyPage = request.nextUrl.pathname.startsWith('/empresas');
	const isPublicAsset =
		request.nextUrl.pathname.startsWith('/_next') ||
		request.nextUrl.pathname.startsWith('/favicon.ico') ||
		request.nextUrl.pathname.match(/\.(svg|png|jpg|jpeg|gif|webp)$/);

	if (isPublicAsset) {
		return supabaseResponse;
	}

	// 1. Se não estiver logado e não for página de auth, vai para login
	if (!user && !isAuthPage) {
		const url = request.nextUrl.clone();
		url.pathname = '/auth/login';
		return NextResponse.redirect(url);
	}

	// 2. Se logado
	if (user) {
		// Se tentar ir para o login já estando logado, manda para seleção de empresa
		if (isAuthPage) {
			const url = request.nextUrl.clone();
			url.pathname = '/empresas';
			return NextResponse.redirect(url);
		}

		// Se não tiver empresa selecionada e não estiver na página de seleção, redireciona
		const selectedCompanyId = request.cookies.get('selectedCompanyId')?.value;
		
		if (!selectedCompanyId && !isSelectCompanyPage) {
			const url = request.nextUrl.clone();
			url.pathname = '/empresas';
			return NextResponse.redirect(url);
		}
	}

	return supabaseResponse;
}

export const config = {
	matcher: [
		'/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
	],
};
