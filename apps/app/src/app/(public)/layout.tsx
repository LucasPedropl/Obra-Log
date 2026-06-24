export default function PublicLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="min-h-screen bg-[#FDFDFD] text-gray-900">
			<header className="border-b border-gray-200 bg-white">
				<div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
					<span className="text-lg font-bold text-[#101828]">Obra-Log ERP</span>
					<a
						href="/auth/login"
						className="text-sm font-semibold text-blue-600 hover:text-blue-700"
					>
						Entrar
					</a>
				</div>
			</header>
			<main className="max-w-3xl mx-auto px-6 py-10">{children}</main>
		</div>
	);
}
