# Diretrizes de Arquitetura, Engenharia e Convenções do Obra-Log

Este guia serve como a especificação de engenharia, arquitetura e segurança para
o ecossistema **Obra-Log**. Todos os agentes que atuarem neste repositório devem
seguir estas convenções rigorosamente.

---

## 1. Visão Geral do Ecossistema

O **Obra-Log** é um ERP multi-tenant voltado para o controle de obras
(almoxarifado, frequência de pessoal, EPIs, e ferramentas alugadas) integrado a
um painel de administração global (Super-Admin).

### Arquitetura de Workspaces (Monorepo NPM)

- **`apps/app` (ERP principal)**:
    - **Workspace**: `erp-next`
    - **Stack**: Next.js v16.2.2 (App Router), React 19, Tailwind CSS v4,
      Supabase JS client (`@supabase/ssr`).
    - **Porta Local**: `3005` (Inicia automaticamente via script de
      desenvolvimento local).
- **`apps/admin` (Painel Super-Admin isolado)**:
    - **Workspace**: `@obralog/admin`
    - **Stack**: Next.js v16.2.4 (App Router), React 19, Tailwind CSS v4,
      Supabase JS client.
    - **Porta Local**: `3010`.
    - **Função**: Gestão global de tenants (empresas) e infraestrutura do banco
      de dados.
- **`packages/ui` (Design System compartilhado)**:
    - **Workspace**: `@obralog/ui`
    - **Stack**: React 19 (Componentes agnósticos como `GlobalLayout`,
      `Sidebar`, `Header` compartilhados).

---

## 2. Padrões de Design e Estruturação de Código

### Funcionalidades Organizacionais baseadas em Features (`apps/app`)

O código em `apps/app/src` é organizado em módulos encapsulados em `/features/`
(ex: `features/ponto`, `features/mao-de-obra`, `features/insumos`,
`features/almoxarifado`, `features/epis`):

- Cada feature deve encapsular seus próprios **schemas de validação** (Zod),
  **componentes específicos** e **hooks customizados**.
- Os formulários e telas do App Router em `app/(app)/` devem importar esses
  componentes e schemas de suas respectivas features.

### Convenções de Naming e Tipagem de Relacionamento (Tenants/Obras)

- **`company_id`**: Refere-se à Empresa / Construtora (o Tenant principal).
- **`site_id`** (ou o termo legado `instance_id`): Refere-se à Obra / Filial sob
  a qual colaboradores, ponto e almoxarifado estão vinculados.
- A distinção entre esses dois níveis deve ser estritamente separada em schemas
  de dados, DTOs e estados locais para evitar misturar o escopo corporativo com
  o escopo de obras individuais.

---

## 3. Segurança e Acesso a Dados (RLS e Server Actions)

### Validação de Acesso em Server Actions

As Server Actions localizadas em `src/app/actions` contornam ou reforçam
políticas usando `supabaseAdmin` (Service Role) e **devem** ser blindadas contra
falhas de autorização de forma explícita. Utilize os helpers de segurança de
[actions/\_helpers.ts](file:///C:/codigo/geplano/ObraLog/Obra-Log/apps/app/src/app/actions/_helpers.ts):

- **Identificação**: Obtenha o usuário ativo via `getAuthenticatedUserId()`.
- **Validação de Tenant**: Verifique se o usuário pertence à empresa selecionada
  nos cookies usando `getValidatedCompanyId()`.
- **Verificação de Permissões (RBAC)**: Use
  `assertCompanyResourcePermission(userId, companyId, resource, action)` para
  validar se o perfil do usuário na tabela `access_profiles` tem direito à
  operação (`view` | `create` | `edit` | `delete`).
- **Proteção IDOR em Obras**: Para rotas e dados atrelados a obras específicas,
  use `assertSiteAccess(userId, siteId)`.
- **Proteção de Inventário**: Garanta que itens operados pertencem ao
  almoxarifado da respectiva obra com
  `assertInventoryBelongsToSite(inventoryId, siteId)`.

### Sincronização Obrigatória Auth/Public (Exclusões)

- Ao remover uma empresa/tenant ou desassociar usuários, a integridade do
  Supabase Auth **deve ser mantida**.
- Se um usuário perder o vínculo com todas as empresas (seu contador em
  `company_users` for 0), ele deve ser removido do Auth do Supabase por meio de
  `supabaseAdmin.auth.admin.deleteUser`.
- Deixar emails soltos no Auth impede futuros cadastros de novos tenants com o
  mesmo email.

---

## 4. UI/UX e Gestão de Feedbacks

### Sistema de Notificação (Toasts)

- Tanto o ERP quanto o Painel Admin utilizam o hook `useToast` customizado que
  expõe a função `addToast` com a assinatura:
    ```typescript
    addToast(message: string, type: 'success' | 'error' | 'warning' | 'info')
    ```
- **Atenção**: Nunca passe objetos (`{ message, type }` ou `{ title }`) como
  argumento do `addToast`. A chamada deve ser estritamente posicional com
  strings.
- **Proibição de Alerts**: Nunca utilize `alert()` nativo do navegador para
  validação de erros ou confirmações de fluxo. Todo erro detectado deve ser
  logado (`console.error`) e notificado através do toast da interface ou
  componentes modais dedicados (ex: `ConfirmDialog`).

---

## 5. Gerenciamento de Dependências e Build (Ambiente Windows)

- **Prevenção de EPERM (Lock do Tailwind v4)**: O Tailwind CSS v4 utiliza o
  motor Oxide para processamento de estilos. No Windows, rodar `npm install` ou
  limpar o cache com servidores de desenvolvimento ativos causa travamento de
  arquivos (`EPERM`). **Sempre encerre o processo `npm run dev` antes de
  realizar instalações de dependências**.
- **Preservação de Overrides**: A raiz do projeto possui regras de `overrides`
  no `package.json` para fixar dependências vulneráveis internas do Next.js.
  **Nunca** use `npm audit fix --force`, pois isso fará downgrade do Next.js
  para a v9, quebrando todo o App Router.

---

## 6. Lógica de Negócios Centralizada

### Controle de Frequência (Ponto) e Fração de Dia

- Os status de ponto válidos são baseados em `ATTENDANCE_STATUSES` (como
  `PRESENT`, `ABSENT`, `ABSENT_JUSTIFIED`, `DAY_OFF`, `SCHEDULED_DAY_OFF`,
  `SCHEDULED_DISMISSAL`, `REQUESTED_DISMISSAL`, `NA`).
- A fração de dia trabalhada (`day_fraction`) é calculada dividindo as horas
  reais trabalhadas (descontado o almoço se fornecido) pelas horas padrão da
  jornada diária daquela obra (`workday_schedule_json`).
- Se a diferença entre a jornada padrão e as horas trabalhadas for menor que a
  tolerância cadastrada na obra (`tolerance_minutes`), a fração de dia é
  automaticamente arredondada para `1.0`.
- A folha de pagamento utiliza a fração trabalhada multiplicada pela diária
  (`daily_rate`) do trabalhador para calcular o custo.
