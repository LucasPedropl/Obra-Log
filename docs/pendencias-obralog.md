# ObraLog ERP — Pendências Consolidadas

**Última atualização:** 24 de junho de 2026  
**Escopo:** `apps/app` (ERP operacional de canteiro)  
**Propósito:** único documento vivo com tudo que **ainda não foi implementado**. Itens já concluídos (maratona P0–P2, hardening de segurança/LGPD de 24/06, CI básico, forms de obra com RHF+Zod exceto um, `SecurityTab`, migrações RLS versionadas, etc.) foram removidos deste arquivo.

---

## Índice

1. [Resumo executivo](#1-resumo-executivo)
2. [Roadmap técnico priorizado](#2-roadmap-técnico-priorizado)
3. [Gaps funcionais por módulo](#3-gaps-funcionais-por-módulo)
4. [Arquitetura e qualidade de código](#4-arquitetura-e-qualidade-de-código)
5. [UI/UX e navegação](#5-uiux-e-navegação)
6. [Segurança residual](#6-segurança-residual)
7. [LGPD — governança e compliance](#7-lgpd--governança-e-compliance)
8. [Testes automatizados](#8-testes-automatizados)
9. [Expansão de produto (P3)](#9-expansão-de-produto-p3)
10. [Métricas — metas restantes](#10-métricas--metas-restantes)

---

## 1. Resumo executivo

O ObraLog é um **sistema operacional de canteiro com cadastros mestres** — almoxarifado, ferramentas, EPIs, equipamentos alugados, movimentações e visão geral por obra. Os bloqueadores críticos de segurança (RLS por obra, `globalUsers.ts`, IDOR em inventário, headers HTTP, storage privado, Zod nas actions principais) foram endereçados em 24/06/2026.

**Ainda impede maturidade plena:**

| # | Lacuna | Impacto |
|---|--------|---------|
| 1 | UI de editar/arquivar obra inexistente | Backend pronto; usuário não gerencia obras pela interface |
| 2 | Importação CSV de obras e perfis ausente | Export existe; import não |
| 3 | CRUD parcial em colaborador-obra e almoxarifado | Operação incompleta no canteiro |
| 4 | Gestão real de categorias/unidades (mock `Math.random`) | Delete/edição de selects enganosa |
| 5 | `AddSiteCollaboratorForm` sem RHF | Único form de obra ainda com `useState` manual |
| 6 | A11y, design tokens, UI morta no header | UX e acessibilidade abaixo do padrão |
| 7 | Cobertura E2E limitada; job E2E no CI condicional | Regressões de fluxo real não detectadas |
| 8 | Governança LGPD (ROPA, DPA, DPO, pentest) | Compliance jurídico incompleto |
| 9 | Módulos clássicos de ERP inexistentes | Gap de produto vs marketing no login |

**Notas estimadas (pós-hardening):**

| Dimensão | Nota | Principal pendência |
|----------|------|---------------------|
| Produto / escopo | ~55% | P3 + CRUD parcial |
| Arquitetura | ~65% | God files, `any`, N+1 |
| Segurança técnica | Médio-baixo | `temp_password` na UI, leituras no browser |
| UI/UX | ~72% | A11y, tokens, header fake |
| Qualidade de código | ~55% | Testes unitários parciais |
| LGPD governança | ~40% | Processos jurídicos/operacionais |
| Testes | Médio-baixo | E2E smoke + 23 unitários; poucos cenários |

---

## 2. Roadmap técnico priorizado

### P1 — Arquitetura e consistência

#### P1.4 residual — `AddSiteCollaboratorForm` com RHF + Zod

| Campo | Detalhe |
|-------|---------|
| Descrição | Migrar o último form de obra de `useState` para react-hook-form + Zod |
| Arquivo | `features/colaboradores/components/AddSiteCollaboratorForm.tsx` (schema `addSiteCollaboratorsSchema` já existe) |
| Critério de done | Form usa `useForm` + `zodResolver`; validação alinhada aos demais forms de obra |
| Esforço | Baixo (4–8h) |

#### P1.4b — `FormModal` reutilizável

| Campo | Detalhe |
|-------|---------|
| Descrição | Extrair padrão de modal (`fixed inset-0`) para componente compartilhado |
| Arquivos | Novo `components/shared/FormModal.tsx`; refatorar modais inline |
| Critério de done | Zero modais duplicados nos forms principais |
| Esforço | Médio (1–2 dias) |

#### P0.5 residual — Zod em actions restantes

| Campo | Detalhe |
|-------|---------|
| Descrição | Fechar validação Zod em actions que ainda aceitam payloads soltos |
| Exemplos | `collaboratorsActions.ts` (`Record<string, unknown>`), actions de leitura sem schema de entrada |
| Situação | Maioria das mutações já valida; rollout incompleto |
| Critério de done | 100% das actions com schema Zod para inputs |
| Esforço | Baixo-médio (1–2 dias) |

#### P1.5 residual — Selects nativos restantes

| Arquivo | Campo |
|---------|-------|
| `acesso/perfis/page.tsx` | Filtro escopo |
| `obras/[id]/ferramentas/disponiveis/page.tsx` | Filtro disponibilidade |

**Critério de done:** zero `<select>` nativo para dados dinâmicos → usar `SearchableSelect`.  
**Esforço:** Baixo (2–4h).

---

### P2 — Produto e polish

#### P2.1 — UI de edit/delete de obras

| Campo | Detalhe |
|-------|---------|
| Descrição | `updateConstructionSiteAdmin` e `deleteConstructionSiteAdmin` existem; falta UI na listagem |
| Arquivos | `obras/page.tsx`, `ConstructionSiteForm.tsx` |
| Esforço | Baixo (4–8h) |

#### P2.2 residual — Ciclo de vida completo de usuários

| Operação | Status |
|----------|--------|
| Create / Read / Edit / Desativar | ✅ |
| Delete definitivo | ❌ |
| Redefinição de senha pelo admin | ❌ |
| Senha temporária exibida na UI após create | ⚠️ Risco residual |

**Arquivos:** `acesso/usuarios/page.tsx`, `globalUsers.ts`  
**Esforço:** Médio (1–2 dias)

#### P2.3 — Importação em perfis e obras

| Módulo | Export | Import |
|--------|:------:|:------:|
| Perfis | ✅ | ❌ |
| Obras | ✅ | ❌ |

**Esforço:** Médio (1–2 dias)

#### P2.5 residual — Skeleton em todas as listagens

| Situação | Páginas |
|----------|---------|
| Com `TablePageSkeleton` | insumos, colaboradores, acesso/usuários |
| Ainda com `Loader2` centralizado | obras, páginas de obra, perfis, demais listagens |

**Esforço:** Baixo (1 dia)

#### P2.6 — A11y no `SearchableSelect`

| Campo | Detalhe |
|-------|---------|
| Descrição | Combobox pattern (Radix Command ou shadcn) — teclado, `aria-*`, foco |
| Arquivo | `components/ui/searchable-select.tsx` |
| Problemas | Sem ↑↓ Enter Esc; sem `role`; modais sem trap de foco; toast sem `aria-live` |
| Esforço | Alto (2–3 dias) |

#### P2.7 residual — Expandir testes e CI

| Item | Status |
|------|--------|
| Vitest (`_helpers`, `exportUtils`, `maskUtils`) | ✅ 23 testes |
| Workflow `.github/workflows/app-ci.yml` | ✅ build + lint + unit |
| Job E2E no CI | Condicional (`vars.E2E_ENABLED == 'true'`) |
| Cenários RBAC, CRUD, sidebar obra, multi-tenant | ❌ |

**Esforço:** Médio-alto (2–4 dias)

#### P2.8 — Unificar design tokens

| Dimensão | Variações atuais |
|----------|------------------|
| Border radius | `rounded-none` vs `rounded-xl` / `rounded-[5px]` |
| Ícones | Phosphor no layout vs Lucide nas páginas |
| Cores de erro | `text-destructive` vs `text-red-700` vs banner uppercase |
| Modais | `w-[500px]`, `w-[800px]`, `max-w-[95vw]` |

**Esforço:** Médio (2–3 dias)

#### P2.10 — N+1 em `getUserCompaniesAction`

| Campo | Detalhe |
|-------|---------|
| Problema | Counts por empresa ainda em `Promise.all(companyIds.map(...))` |
| Arquivo | `authData.ts` |
| Esforço | Baixo (2–4h) |

#### P2.11 — Rota órfã usuários da obra

| Campo | Detalhe |
|-------|---------|
| Rota | `/obras/[id]/usuarios` existe |
| Problema | Fora do menu em `sidebarNavConfig.ts`; lista usuários da empresa inteira, não filtrados por obra |
| Esforço | Baixo (2–4h) |

#### P2.12 — UI morta no header

| Elemento | Situação |
|----------|----------|
| Busca global | Input "Pesquisar..." sem handler |
| Ajuda | Botão sem ação |
| Notificações | Botão sem ação |

**Arquivos:** `Header.tsx`  
**Esforço:** Médio (implementar) ou Baixo (remover/ocultar)

#### P2.13 — Footer mobile

| Problema | Detalhe |
|----------|---------|
| Cor inconsistente | `#F29C1F` vs sistema `#101828` |
| Itens limitados | 4 itens; EPIs/alugados só via `/menu` |

---

## 3. Gaps funcionais por módulo

### Mapa — existente vs prometido (login)

```
PROMETIDO (slides login)          EXISTENTE (apps/app)
─────────────────────────         ─────────────────────────
Cronograma                    ❌  Obras (CRUD backend; UI edit/delete pendente)
Orçamento                     ❌  Insumos (CRUD + import + export)
Financeiro                    ❌  Colaboradores (CRUD + import + export)
Planejamento                  ❌  Acesso (perfis + usuários parcial)
Diário de obra                ❌  Dashboard (dados reais)
Medições                      ❌  Operação de canteiro completa
Compras                       ❌  RBAC por obra (allowed_sites)
Relatórios                    ❌  Movimentações (read-only)
Documentos da obra            ❌
```

### Obras

| Operação | Status |
|----------|--------|
| Create / Read | ✅ |
| Update / Delete | Backend ✅ — **UI ausente** |
| Import CSV | ❌ |
| Export CSV | ✅ |

### Insumos

| Operação | Status |
|----------|--------|
| CRUD + Import + Export | ✅ |
| Delete categorias/unidades real | **Mock** — `Math.random() > 0.7` para `isInUse` em `SupplyItemForm.tsx` |
| `ManageSelectsModal.tsx` | Mock — comentário "Mock data for now" |

### Colaboradores (global)

| Operação | Status |
|----------|--------|
| CRUD + Import + Export | ✅ |
| Upload documentos | Via `documentStorageActions` (melhorado); `CollaboratorForm` ainda grande e com lógica mista |

### Acesso — Perfis

| Operação | Status |
|----------|--------|
| CRUD + Export | ✅ |
| Import | ❌ |

### Acesso — Usuários

| Operação | Status |
|----------|--------|
| Create / Read / Edit / Desativar | ✅ |
| Delete definitivo | ❌ |
| Senha temporária | Retornada e exibida na UI (`tempPassword`) |

### Configurações

| Aba | Status |
|-----|--------|
| Perfil / Empresa | ✅ |
| Segurança | ✅ `SecurityTab` — alterar senha e solicitar exclusão de conta |

### Por obra — Almoxarifado

| Operação | Status |
|----------|--------|
| Entrada / Ajuste qty | ✅ |
| Delete item / Edit vínculo | ❌ |

### Por obra — Colaboradores

| Operação | Status |
|----------|--------|
| Alocar / Listar | ✅ |
| Remover da obra / Editar função | ❌ |
| Controle de jornada | ❌ (mencionado, não implementado) |

### Por obra — Usuários

- Rota `/obras/[id]/usuarios` — fora da sidebar
- Lista usuários da empresa inteira
- Sem edit/delete por obra

### Por obra — Movimentações

- Read-only agregado — sem criação manual (decisão de produto a confirmar)

### Matriz CRUD — lacunas

| Entidade | U | D | Import | Observação |
|----------|:-:|:-:|:------:|------------|
| Obra | UI ❌ | UI ❌ | ❌ | Backend ok |
| Colaborador (obra) | ❌ | ❌ | — | |
| Almoxarifado item | parcial | ❌ | — | Só qty |
| Usuário sistema | ✅ | ❌ | — | Desativar ok |
| Perfil acesso | ✅ | ✅ | ❌ | Export ok |
| Categorias/unidades | mock | mock | — | `SupplyItemForm` |

### Stubs e mocks residuais

| Local | Tipo |
|-------|------|
| `SupplyItemForm.tsx` | `Math.random()` para `isInUse` |
| `ManageSelectsModal.tsx` | Mock delete categorias |
| Slides auth | Marketing de módulos inexistentes |

---

## 4. Arquitetura e qualidade de código

### Regras declaradas vs realidade

| Regra | Situação |
|-------|----------|
| Máx 150–200 linhas/arquivo | ~30+ arquivos violam |
| `schemas/` por feature | Parcial — obras, insumos, colaboradores, almoxarifado; demais inline |
| `services/` por feature | Só `admin` tem services |
| Componentes nunca mutam direto | Residual em `CollaboratorForm`, `SupplyItemForm` |
| Zero `any` | ~20+ ocorrências em hotspots |
| SWR | Declarado em `package.json`, **zero uso** — remover ou adotar |

### Padrões de acesso a dados

| Padrão | Exemplos | Avaliação |
|--------|----------|-----------|
| Hook → Server Action | Cadastros globais, mutações de obra | Correto |
| Hook → Supabase browser (read) | `useMovimentacoes`, `useToolHistory`, `useEPIHistory` | Aceitável com RLS corrigido |
| Component → Supabase direto | `CollaboratorForm`, `SupplyItemForm` | Migrar |
| Page → Service client (read) | `accessProfiles.service.ts` | Aceitável |

### God files (>200 linhas) — prioridade de refatoração

| Linhas | Arquivo |
|-------:|---------|
| 833 | `features/colaboradores/components/CollaboratorForm.tsx` |
| 652 | `features/insumos/components/SupplyItemForm.tsx` |
| 578 | `features/equip-alugados/components/AddRentedForm.tsx` |
| 518 | `app/(auth)/empresas/SelectCompanyClient.tsx` |
| 501 | `features/almoxarifado/components/AddInventoryForm.tsx` |
| 494 | `features/admin/components/AccessProfileForm.tsx` |
| 438 | `components/shared/DataTable.tsx` |
| 405 | `obras/[id]/ferramentas/disponiveis/page.tsx` |
| 398 | `obras/[id]/epis/disponiveis/page.tsx` |
| 389 | `(app)/insumos/page.tsx` |
| 323 | `features/insumos/components/ManageSelectsModal.tsx` |

### Hotspots de `any`

| Arquivo | Contexto |
|---------|----------|
| `insumos/page.tsx` | Estados de listagem |
| `CollaboratorForm.tsx` | `documents_json` |
| `SelectCompanyClient.tsx` | Estados de empresa |
| `DataTable.tsx` | `Record<string, any>` |
| `ActiveObraContext.tsx` | Contexto de obra |
| Actions legadas | Maps e payloads |

### Código morto / duplicado

| Item | Ação sugerida |
|------|---------------|
| SWR não usado | Remover de `package.json` ou implementar |
| Parsing de import TXT duplicado | Centralizar helper |
| Mapa de perfis copy-paste em actions | Extrair util compartilhado |
| Import `Upload` não usado | `obras/page.tsx`, `perfis/page.tsx` |

### Performance pendente

| Local | Problema |
|-------|----------|
| `getUserCompaniesAction` | Counts por empresa em loop (N+1) |
| `importCatalogsAdmin` | Insert de unidade por abreviação no loop (bulk) |

Índices SQL sugeridos (verificar se já na migration):

```sql
CREATE INDEX IF NOT EXISTS idx_construction_sites_company ON construction_sites (company_id);
CREATE INDEX IF NOT EXISTS idx_company_users_user_company ON company_users (user_id, company_id);
CREATE INDEX IF NOT EXISTS idx_site_inventory_site_catalog ON site_inventory (site_id, catalog_id);
CREATE INDEX IF NOT EXISTS idx_site_movements_site_date ON site_movements (site_id, action_date DESC);
```

### Tratamento de erros — inconsistências

| Padrão | Onde ainda ocorre |
|--------|-------------------|
| `console.error` silencioso | Alguns hooks de obra |
| Stats zerados sem mensagem | `visao-geral/page.tsx` em falha de API |
| 3 padrões concorrentes | Banner inline / toast / silencioso |

---

## 5. UI/UX e navegação

### Navegação — lacunas

| Problema | Detalhe |
|----------|---------|
| Busca global fake | Header sem handler |
| Botões header inativos | Ajuda, Notificações |
| `/obras/[id]/usuarios` órfão | Fora do menu |
| Cor mobile inconsistente | Footer laranja vs preto do sistema |
| Footer mobile incompleto | Poucos atalhos |

### Forms — situação

| Grupo | Status |
|-------|--------|
| Forms modais de obra (RHF + Zod) | ✅ exceto `AddSiteCollaboratorForm` |
| Cadastros globais | ✅ RHF + Zod |
| Selects nativos | 2 restantes (ver P1.5) |

### Componentes ausentes

- `FormModal` reutilizável
- Dialog/sheet shadcn padronizado (modais custom em todo o app)

### Feedback ao usuário

| Problema | Onde |
|----------|------|
| Falhas silenciosas | `visao-geral/page.tsx` |
| Toast ausente em alguns sucessos | Forms de obra residuais |
| `EmptyState` com `rounded-xl` | Conflita com `--radius: 0` |

### Acessibilidade — crítico pendente

| Problema | Impacto |
|----------|---------|
| `SearchableSelect` sem combobox pattern | Sem teclado, sem `role` |
| Quase zero `aria-*` global | Screen readers perdem contexto |
| Modais sem trap de foco / `aria-modal` | Tab escapa |
| Toast sem `role="alert"` | Notificações não anunciadas |
| Botões só com ícone (`title` apenas) | Insuficiente para SR |
| `LoginForm` desabilita focus ring | Prejudica teclado |

---

## 6. Segurança residual

> Bloqueadores críticos (SEC-01 a SEC-14, RLS `get_my_sites`, `globalUsers` cross-tenant, IDOR inventário, storage público, headers HTTP, cookies httpOnly) foram **implementados** em 24/06/2026 via migrations e refactor de actions.

### Riscos ainda abertos

| ID | Risco | Arquivo(s) | Mitigação |
|----|-------|------------|-----------|
| S11 | Senha temporária retornada e exibida na UI após criar usuário | `globalUsers.ts`, `acesso/usuarios/page.tsx` | Email de convite ou link único; não exibir senha em tela |
| S5b | Mutações residuais no browser | `CollaboratorForm`, `SupplyItemForm` (categorias) | Server actions |
| S16 | Auto-criação perfil Admin via cliente | `companyUsersAdminActions.ts` | Seed/migration ou super-admin only |
| S18 | Funções SQL `check_user_resource_permission` não chamadas pelo TS | Supabase | RPC ou replicar em TS |
| RBAC1 | Permissões reforçadas no client em alguns fluxos de leitura | Hooks com `createClient()` | Server actions para leituras sensíveis (opcional) |
| SEC-12 | Modelos `allowed_sites` (app) vs `user_site_access` (RLS) | Unificar fonte de verdade | Revisar consistência pós-migration |

### Validação server-side — residual

| Camada | Status |
|--------|--------|
| Mutações críticas | ✅ Zod |
| `collaboratorsActions` create/update | `Record<string, unknown>` — tipar com schema |
| Demais actions de leitura | Schemas de entrada opcionais |

### Checklist modelo alvo (itens não universais)

Toda server action de mutação deve:

1. `getAuthenticatedUserId()` — ok na maioria
2. Validar `selectedCompanyId` — ok na maioria
3. `assertCompanyResourcePermission` / `assertSiteAccess` — ok na maioria
4. Validar payload com Zod — **rollout ~90%**
5. `supabaseAdmin` só após 1–4 — ok
6. Retornar `{ success, error }` — parcial

---

## 7. LGPD — governança e compliance

> Melhorias técnicas já feitas: páginas `/privacidade` e `/termos`, mascaramento CPF na UI, `anonymizeCollaboratorAction`, storage privado com signed URLs, `exportUtils` anti-injection, `safeLog`, aviso no login.

### Pendências jurídicas e operacionais

| Item | Status | Ação necessária |
|------|--------|-----------------|
| ROPA (Registro de Operações) | Template | Preencher com razão social, DPO, revisar operações |
| Política de retenção | Documento | Automatizar job de purge/anonimização conforme prazos |
| Playbook de incidente (Art. 33) | Template | Definir DPO, contatos, simulacro |
| DPA Supabase | Nota | Aceitar DPA no dashboard; documentar região do projeto |
| Revisão jurídica dos textos legais | Pendente | Advogado/DPO antes de produção com dados reais |
| Pentest externo | Não realizado | Contratar antes de go-live público |
| Criptografia CPF em repouso | Opcional | `pgcrypto` ou campo tokenizado |
| Canal formal direitos do titular (Art. 18) | Parcial | E-mail `privacidade@` + SLA 15 dias |
| Consentimento colaboradores (não usuários do sistema) | Parcial | Base legal documentada no ROPA |
| Transferência internacional | Documentar | Informar titulares na política de privacidade |

### ROPA — operações de tratamento (template a completar)

| Finalidade | Dados | Base legal (Art. 7) | Titulares | Retenção | Compartilhamento |
|------------|-------|---------------------|-----------|----------|------------------|
| Gestão de colaboradores de obra | Nome, CPF, RG, contato, endereço, documentos | Execução de contrato / legítimo interesse | Colaboradores | Até 5 anos após desligamento | Supabase (processador) |
| Contas de usuário | E-mail, nome, perfil | Execução de contrato | Usuários internos | Vigência + 6 meses | Supabase Auth |
| Operação de canteiro | Movimentações, empréstimos, EPIs | Execução de contrato | Colaboradores vinculados | 5 anos | Supabase |
| Documentos anexos | RG, CNH, fotos | Legítimo interesse / obrigação legal | Colaboradores | Conforme política | Storage privado |

**Medidas de segurança (Art. 32):** RLS multi-tenant, cookies httpOnly, storage privado, mascaramento CPF na UI.

**Canal do titular:** `privacidade@[dominio-empresa]` — prazo 15 dias (Art. 18, §3º).

### Política de retenção (a operacionalizar)

| Categoria | Retenção ativa | Após término |
|-----------|----------------|--------------|
| Colaborador ativo | Durante vínculo | `anonymizeCollaboratorAction` |
| Colaborador inativo | 5 anos | Purge Storage + anonimização DB |
| Logs de aplicação | 90 dias | Descarte automático (**job não implementado**) |
| Conta usuário inativa | 12 meses | Desativação; exclusão sob solicitação |

**Procedimento de anonimização:**

1. Executar `anonymizeCollaboratorAction`
2. Remover arquivos em `collaborator-documents/{companyId}/`
3. Registrar no ROPA

### Playbook de incidentes (Art. 33)

| Nível | Critério | Prazo ANPD |
|-------|----------|------------|
| Crítico | Vazamento CPF/documentos em escala | 72h úteis |
| Alto | Acesso cross-tenant confirmado | Avaliar comunicação |
| Médio | Tentativa bloqueada por RLS | Registro interno |

**Passos:** contenção → diagnóstico (logs Supabase, RLS) → notificação ANPD/titulares se risco → remediação → lições aprendidas.

**Contatos a definir:** DPO, Supabase Support.

### DPA Supabase

1. Aceitar Data Processing Addendum no dashboard (planos pagos)
2. Documentar região do projeto no dashboard
3. Informar titulares em `/privacidade` sobre processamento e transferência internacional
4. Cláusulas contratuais padrão (SCCs) conforme regulamentação

Referência: [Supabase DPA](https://supabase.com/legal/dpa)

### Checklist LGPD — itens ainda em aberto

| Artigo / Princípio | Status |
|--------------------|--------|
| Art. 6 — Necessidade | Parcial — endereço completo + docs podem exceder |
| Art. 7 — Base legal formalizada | Parcial — falta ROPA assinado |
| Art. 9 — Direitos do titular (exportar/apagar) | Parcial — anonimização existe; canal formal incompleto |
| Art. 18 — Atendimento ao titular | Parcial |
| Art. 33 — Comunicação incidente | Processo documentado, não testado |
| Art. 37 — ROPA | Template apenas |
| Art. 41 — DPO | Não indicado |
| Transferência internacional (Cap. V) | DPA não assinado no projeto |

---

## 8. Testes automatizados

### Situação atual

| Tipo | Status |
|------|--------|
| Vitest unitário | ✅ 23 testes (`_helpers`, `exportUtils`, `maskUtils`) |
| Smoke E2E Playwright | ✅ `e2e/smoke.spec.ts` |
| Security E2E | ✅ `e2e/security.spec.ts` (redirect sem sessão) |
| CI GitHub Actions | ✅ build + lint + unit |
| E2E no CI | Condicional — requer `E2E_ENABLED=true` + secrets |
| Integration | ❌ |
| Cobertura hooks/schemas críticos | Parcial |

### Cenários E2E a adicionar

| Área | Cenários |
|------|----------|
| Sidebar obra | Selecionar obra → navegar almoxarifado a partir de `/insumos` |
| RBAC | Perfil sem permissão → `/unauthorized` |
| `allowed_sites` | Perfil SPECIFIC_SITES → obra bloqueada |
| CRUD | Create/edit/delete insumo, colaborador |
| Export CSV | Download em listagens |
| Forms de obra | Emprestar ferramenta, entregar EPI |
| Multi-tenant | Troca de empresa no header |

### Testes unitários sugeridos

| Alvo | Motivo |
|------|--------|
| Schemas Zod | Regressão de validação |
| `parseAllowedSites` | RBAC por obra |
| `dashboardActions` | KPIs e erros |
| Hooks críticos | `useConstructionSites`, `useSupplyItems` |

### Bloqueadores para CI E2E completo

- Credenciais em GitHub Secrets (`E2E_EMAIL`, `E2E_PASSWORD`, keys Supabase)
- Ambiente Supabase estável com seed reproduzível
- Variável `E2E_ENABLED=true` no repositório

---

## 9. Expansão de produto (P3)

Decisão de produto necessária antes de implementar.

| Item | Descrição | Dependências |
|------|-----------|--------------|
| P3.1 | Definir módulos clássicos (orçamento, cronograma, financeiro?) | Decisão PO |
| P3.2 | Compras integrada ao almoxarifado | P3.1 |
| P3.3 | Relatórios sobre dados operacionais | Exports CSV |
| P3.4 | Documentos da obra (Storage + RLS) | — |
| P3.5 | Configurações por obra | RBAC por obra (ok) |
| P3.6 | Diário de obra | P3.1 |
| P3.7 | Medições | P3.1 |
| P3.8 | Busca global funcional | P2.12 |

**Módulos inexistentes hoje:** Planejamento · Orçamento · Cronograma · Diário de obra · Medições · Compras · Financeiro · Documentos da obra · Relatórios · Configurações por obra

---

## 10. Métricas — metas restantes

| Métrica | Atual (est.) | Meta |
|---------|-------------:|-----:|
| Arquivos >200 linhas | ~30+ | <20 |
| Uso de `any` | ~20+ | <10 |
| Selects nativos (dados) | 2 | 0 |
| Actions com Zod (inputs) | ~90% | 100% |
| Testes unitários | 23 | Hooks + schemas críticos |
| E2E no CI (ativo) | Condicional | Sempre com secrets |
| Forms de obra com RHF | 9/10 | 10/10 |
| Conformidade LGPD governança | ~40% | ROPA + DPA + DPO |

---

## Ordem sugerida de execução

1. **P2.1** — UI edit/delete obras (quick win de produto)
2. **P1.4 residual** — `AddSiteCollaboratorForm` com RHF
3. **P0.5 residual** — Fechar Zod em `collaboratorsActions` e demais
4. **P2.2** — Delete usuário + fluxo seguro de senha temporária
5. **Mocks insumos** — `isInUse` real em categorias/unidades
6. **P1.5** — Últimos 2 selects nativos
7. **P2.6 + P2.8** — A11y e design tokens
8. **P2.7** — Expandir E2E + ativar CI
9. **LGPD** — ROPA, DPA, DPO, pentest
10. **P3** — Decisão de produto para novos módulos

---

## Stack de referência

- **Frontend:** Next.js 16, React 19, TypeScript strict, Tailwind 4
- **Forms:** react-hook-form + zod (quase completo)
- **Backend:** Supabase (Auth, PostgreSQL, Storage, RLS versionado em `supabase/migrations/`)
- **Padrão:** Smart/Dumb, DDD por features, hooks para dados
- **Testes:** Vitest + Playwright

---

*Documento consolidado a partir da auditoria de junho/2026. Substituí todos os arquivos em `docs/v1/` e `docs/lgpd/`. Revisar após cada sprint significativo.*
