import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
	title: 'Política de Privacidade | Obra-Log',
	description: 'Política de privacidade e proteção de dados pessoais (LGPD).',
};

export default function PrivacidadePage() {
	return (
		<article className="prose prose-gray max-w-none">
			<h1 className="text-3xl font-bold text-[#101828] mb-2">
				Política de Privacidade
			</h1>
			<p className="text-sm text-gray-500 mb-8">
				Última atualização: 23 de junho de 2026
			</p>

			<section className="space-y-4 text-gray-700 leading-relaxed">
				<p>
					Esta Política de Privacidade descreve como o <strong>Obra-Log ERP</strong>{' '}
					coleta, utiliza, armazena e protege seus dados pessoais, em conformidade
					com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD).
				</p>

				<h2 className="text-xl font-bold text-gray-900 mt-8">1. Controlador</h2>
				<p>
					O controlador dos dados é a organização contratante do Obra-Log (sua
					empresa), que utiliza a plataforma para gestão de obras. Dúvidas sobre
					tratamento de dados devem ser direcionadas ao administrador da sua
					organização.
				</p>

				<h2 className="text-xl font-bold text-gray-900 mt-8">
					2. Dados coletados
				</h2>
				<ul className="list-disc pl-6 space-y-1">
					<li>Dados de identificação: nome, e-mail, CPF, RG, data de nascimento</li>
					<li>Dados de contato: telefone, endereço</li>
					<li>Dados profissionais: cargo, vínculo com obras, EPIs e ferramentas</li>
					<li>Dados de acesso: logs de autenticação e permissões</li>
				</ul>

				<h2 className="text-xl font-bold text-gray-900 mt-8">
					3. Finalidades do tratamento
				</h2>
				<ul className="list-disc pl-6 space-y-1">
					<li>Prestação do serviço de gestão de obras e almoxarifado</li>
					<li>Controle de acesso e segurança da informação</li>
					<li>Cumprimento de obrigações legais e regulatórias</li>
					<li>Comunicação sobre o uso da plataforma</li>
				</ul>

				<h2 className="text-xl font-bold text-gray-900 mt-8">
					4. Base legal (Art. 7º LGPD)
				</h2>
				<p>
					O tratamento é realizado com base na execução de contrato, cumprimento de
					obrigação legal, legítimo interesse do controlador e, quando aplicável,
					consentimento do titular.
				</p>

				<h2 className="text-xl font-bold text-gray-900 mt-8">
					5. Compartilhamento
				</h2>
				<p>
					Os dados podem ser processados por provedores de infraestrutura (ex.:
					Supabase) sob contratos que garantem proteção adequada. Não vendemos dados
					pessoais a terceiros.
				</p>

				<h2 className="text-xl font-bold text-gray-900 mt-8">
					6. Direitos do titular (Art. 18)
				</h2>
				<p>Você pode solicitar:</p>
				<ul className="list-disc pl-6 space-y-1">
					<li>Confirmação e acesso aos seus dados</li>
					<li>Correção de dados incompletos ou desatualizados</li>
					<li>Anonimização, bloqueio ou eliminação de dados desnecessários</li>
					<li>Portabilidade dos dados</li>
					<li>Revogação do consentimento</li>
				</ul>
				<p>
					Solicitações podem ser feitas nas configurações da conta ou pelo
					administrador da sua empresa.
				</p>

				<h2 className="text-xl font-bold text-gray-900 mt-8">7. Retenção</h2>
				<p>
					Os dados são mantidos enquanto necessários para as finalidades descritas
					ou conforme exigido por lei. Após o término do vínculo, dados podem ser
					anonimizados ou excluídos conforme política interna do controlador.
				</p>

				<h2 className="text-xl font-bold text-gray-900 mt-8">8. Segurança</h2>
				<p>
					Adotamos medidas técnicas e organizacionais, incluindo criptografia em
					trânsito, controle de acesso por perfil, cookies seguros e políticas de
					segurança em camadas (RLS).
				</p>

				<h2 className="text-xl font-bold text-gray-900 mt-8">9. Contato</h2>
				<p>
					Para exercer seus direitos ou esclarecer dúvidas sobre esta política,
					entre em contato com o administrador da sua organização ou acesse as{' '}
					<Link href="/configuracoes" className="text-blue-600 hover:underline">
						configurações da conta
					</Link>
					.
				</p>
			</section>
		</article>
	);
}
