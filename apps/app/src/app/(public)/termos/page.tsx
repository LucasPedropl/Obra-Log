import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
	title: 'Termos de Uso | Obra-Log',
	description: 'Termos e condições de uso da plataforma Obra-Log ERP.',
};

export default function TermosPage() {
	return (
		<article className="prose prose-gray max-w-none">
			<h1 className="text-3xl font-bold text-[#101828] mb-2">
				Termos de Uso
			</h1>
			<p className="text-sm text-gray-500 mb-8">
				Última atualização: 23 de junho de 2026
			</p>

			<section className="space-y-4 text-gray-700 leading-relaxed">
				<p>
					Ao acessar e utilizar o <strong>Obra-Log ERP</strong>, você concorda com
					os presentes Termos de Uso. Leia-os atentamente antes de utilizar a
					plataforma.
				</p>

				<h2 className="text-xl font-bold text-gray-900 mt-8">
					1. Aceitação dos termos
				</h2>
				<p>
					O uso do sistema implica aceitação integral destes termos e da nossa{' '}
					<Link href="/privacidade" className="text-blue-600 hover:underline">
						Política de Privacidade
					</Link>
					.
				</p>

				<h2 className="text-xl font-bold text-gray-900 mt-8">
					2. Descrição do serviço
				</h2>
				<p>
					O Obra-Log é uma plataforma SaaS multi-tenant para gestão de obras,
					almoxarifado, colaboradores, EPIs, ferramentas e equipamentos. O acesso
					é concedido mediante contratação pela organização empregadora.
				</p>

				<h2 className="text-xl font-bold text-gray-900 mt-8">
					3. Conta e responsabilidades
				</h2>
				<ul className="list-disc pl-6 space-y-1">
					<li>Você é responsável por manter a confidencialidade da sua senha</li>
					<li>Notifique imediatamente o administrador sobre uso não autorizado</li>
					<li>
						As informações inseridas devem ser verdadeiras e atualizadas
					</li>
					<li>
						É proibido compartilhar credenciais ou acessar dados de outras
						organizações
					</li>
				</ul>

				<h2 className="text-xl font-bold text-gray-900 mt-8">4. Uso permitido</h2>
				<p>
					A plataforma deve ser utilizada exclusivamente para fins legítimos de
					gestão empresarial. É vedado tentar burlar controles de segurança,
					realizar engenharia reversa ou utilizar o sistema de forma que prejudique
					outros usuários.
				</p>

				<h2 className="text-xl font-bold text-gray-900 mt-8">
					5. Propriedade intelectual
				</h2>
				<p>
					O software, marca, layout e documentação do Obra-Log são de propriedade
					exclusiva do licenciante. Os dados inseridos pela sua organização
					permanecem de propriedade do controlador (sua empresa).
				</p>

				<h2 className="text-xl font-bold text-gray-900 mt-8">
					6. Disponibilidade e suporte
				</h2>
				<p>
					Buscamos manter a plataforma disponível de forma contínua, porém não
					garantimos operação ininterrupta. Manutenções programadas serão
					comunicadas quando possível.
				</p>

				<h2 className="text-xl font-bold text-gray-900 mt-8">
					7. Limitação de responsabilidade
				</h2>
				<p>
					O Obra-Log é fornecido &quot;como está&quot;. Não nos responsabilizamos por
					danos indiretos decorrentes do uso da plataforma, salvo disposição legal
					em contrário.
				</p>

				<h2 className="text-xl font-bold text-gray-900 mt-8">
					8. Rescisão e exclusão
				</h2>
				<p>
					O acesso pode ser encerrado pelo administrador da organização ou mediante
					solicitação de exclusão da conta nas configurações, conforme a LGPD.
				</p>

				<h2 className="text-xl font-bold text-gray-900 mt-8">
					9. Alterações dos termos
				</h2>
				<p>
					Estes termos podem ser atualizados periodicamente. Alterações relevantes
					serão comunicadas por meio da plataforma ou e-mail cadastrado.
				</p>

				<h2 className="text-xl font-bold text-gray-900 mt-8">
					10. Legislação aplicável
				</h2>
				<p>
					Estes termos são regidos pelas leis da República Federativa do Brasil.
					Foro: comarca da sede do controlador contratante, salvo disposição legal
					específica.
				</p>
			</section>
		</article>
	);
}
