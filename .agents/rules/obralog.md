---
trigger: always_on
---

---

description: Diretrizes de Arquitetura, Engenharia e Boas Práticas para o
Sistema Obra-Log (ERP Multi-Tenant e Super-Admin)

---

# Missão do Projeto

Seu objetivo neste projeto é construir um sistema SaaS robusto, composto por um
**Painel de Gestão ERP Multi-Tenant** focado em gerenciamento de obras e um
**Painel Super-Admin isolado**.

# Regras Críticas de Implementação

1.  **Sincronização Auth/Public**: Ao excluir um usuário da tabela
    `public.users` ou uma empresa, é **obrigatório** deletar o respectivo
    usuário no schema de autenticação do Supabase via
    `supabaseAdmin.auth.admin.deleteUser`. Deletar apenas linhas na tabela
    `public` deixará o e-mail "preso" no Auth, causando erros em futuros
    cadastros.
2.  **Assinatura de Toasts (ERP)**: No projeto `apps/app` (ERP), o hook
    `useToast` utiliza estritamente a assinatura
    `addToast(message: string, type: 'success' | 'error' | 'info')`. **Nunca**
    passe um objeto como argumento único.
3.  **Gestão de Dependências (Windows)**: Antes de rodar `npm install` ou
    realizar limpezas em `node_modules`, **sempre** encerre os processos de
    servidor (`npm run dev`) para evitar erros de `EPERM` (file lock) causados
    pelo motor Oxide do Tailwind v4.
4.  **Tipagem de Relacionamentos**:
    - `company_id`: Refere-se sempre à Empresa (Tenant/Construtora).
    - `instance_id` ou `site_id`: Refere-se sempre à Obra/Filial.
    - Mantenha essa distinção rigorosa nos DTOs e Estados para evitar erros de
      "property missing" no build.
5.  **Segurança e Overrides**: A seção `overrides` no `package.json` raiz deve
    ser preservada para corrigir vulnerabilidades críticas que o Next.js carrega
    internamente. **Nunca** use `npm audit fix --force`, pois ele tentará fazer
    o downgrade do Next.js para a versão 9, quebrando o App Router.
6.  **Proibição Absoluta de Alerts**: Nunca, jamais, em hipótese alguma utilize
    `alert()` nativo do navegador no sistema. Todo e qualquer feedback de erro
    ou aviso deve ser registrado no console (`console.error`) e exibido ao
    usuário exclusivamente através de toasts na interface.

- **Supabase MCP**: Utilize as ferramentas do servidor MCP do Supabase
  (`mcp_supabase_execute_sql`, `mcp_supabase_list_tables`, etc.) para consultar
  a estrutura real do banco, verificar políticas de RLS e logs em tempo real.
- **Modificações de Banco**: Para alterações de DDL (Schema), utilize
  `mcp_supabase_apply_migration`. Para consultas ou alterações de dados rápidas,
  utilize `mcp_supabase_execute_sql`. Sempre valide as mudanças antes de
  aplicar.
