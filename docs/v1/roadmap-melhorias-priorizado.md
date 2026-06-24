# Roadmap de Melhorias — Pendências ObraLog ERP

[Voltar ao índice](./auditoria-obralog-indice.md) · [Resumo Executivo](./auditoria-resumo-executivo.md)

**Última atualização:** 23 de junho de 2026  
**Contexto:** itens P0–P2 já implementados na maratona foram removidos deste documento.

---

## Visão geral

| Fase | Foco | Bloqueador produção? |
|------|------|:--------------------:|
| **P1 residual** | Consistência de forms e validação | Parcial |
| **P2 residual** | Polish, a11y, CI, qualidade | Não |
| **P3** | Expansão de produto | Não |

---

## P1 residual — Arquitetura e consistência

### P1.4 — Padronizar forms modais de obra com RHF + Zod

| Campo | Detalhe |
|-------|---------|
| Descrição | Migrar ~10 forms de obra de `useState` manual para react-hook-form + Zod |
| Arquivos | `LoanToolForm`, `ReturnToolForm`, `GiveEPIForm`, `AddInventoryForm`, `AddRentedForm`, `ReturnRentedForm`, `AddToolForm`, `AddEPIForm`, `AddSiteCollaboratorForm`, `StockAdjustment` |
| Critério de done | Todos os forms de obra usam RHF + Zod + SearchableSelect |
| Esforço | Alto (3–5 dias) |

### P1.4b — FormModal reutilizável

| Campo | Detalhe |
|-------|---------|
| Descrição | Extrair padrão de modal (`fixed inset-0`) para componente compartilhado |
| Arquivos | Novo `components/shared/FormModal.tsx`; refatorar modais existentes |
| Critério de done | Zero modais inline duplicados nos forms principais |
| Esforço | Médio (1–2 dias) |

### P0.5 rollout — Zod em todas as server actions

| Campo | Detalhe |
|-------|---------|
| Descrição | Estender validação Zod às actions que ainda aceitam payloads soltos |
| Arquivos | Actions sem `safeParse`/`parse` em `app/actions/` |
| Situação atual | Parcial — `toolsActions`, `episActions`, `inventoryActions`, `rentedActions`, `settingsActions`, `accessProfilesActions` já validam; demais pendentes |
| Critério de done | 100% das actions com schema Zod |
| Esforço | Médio (2–3 dias) |

### P1.5 residual — Selects nativos restantes

| Campo | Detalhe |
|-------|---------|
| Descrição | Substituir os últimos `<select>` de dados dinâmicos |
| Arquivos | `acesso/perfis/page.tsx` (filtro escopo), `ferramentas/disponiveis/page.tsx` (filtro disponibilidade) |
| Critério de done | Zero `<select>` nativo para dados dinâmicos |
| Esforço | Baixo (2–4h) |

---

## P2 residual — Produto e polish

### P2.1 residual — UI de edit/delete de obras

| Campo | Detalhe |
|-------|---------|
| Descrição | Backend e hook existem (`updateConstructionSiteAdmin`, `deleteConstructionSiteAdmin`); falta UI na listagem |
| Arquivos | `obras/page.tsx`, `ConstructionSiteForm.tsx` |
| Critério de done | Editar e arquivar/excluir obra pela interface |
| Esforço | Baixo (4–8h) |

### P2.2 residual — CRUD usuários completo

| Campo | Detalhe |
|-------|---------|
| Descrição | Edit e desativar já existem; falta delete definitivo e fluxo de redefinição de senha |
| Arquivos | `acesso/usuarios/page.tsx`, `globalUsers.ts` |
| Critério de done | Ciclo de vida completo do usuário documentado e implementado |
| Esforço | Médio (1–2 dias) |

### P2.3 residual — Importação em perfis e obras

| Campo | Detalhe |
|-------|---------|
| Descrição | Export CSV implementado; import de perfis e obras ainda ausente |
| Arquivos | `acesso/perfis/page.tsx`, `obras/page.tsx` |
| Esforço | Médio (1–2 dias) |

### P2.5 residual — Skeleton loading em todas as listagens

| Campo | Detalhe |
|-------|---------|
| Descrição | `TablePageSkeleton` existe; aplicar nas páginas de obra e acesso |
| Arquivos | Páginas com `Loader2` centralizado |
| Esforço | Baixo (1 dia) |

### P2.6 — A11y no SearchableSelect

| Campo | Detalhe |
|-------|---------|
| Descrição | Combobox pattern (Radix Command ou shadcn) — teclado, `aria-*`, foco |
| Arquivos | `components/ui/searchable-select.tsx` |
| Esforço | Alto (2–3 dias) |

### P2.7 — Testes no CI

| Campo | Detalhe |
|-------|---------|
| Descrição | Vitest (hooks/actions) + Playwright (E2E) em pipeline |
| Situação atual | `e2e/smoke.spec.ts` e script `test:e2e` existem; sem workflow GitHub |
| Arquivos | `.github/workflows/`, `apps/app/e2e/` |
| Esforço | Alto (3–5 dias) |

### P2.8 — Unificar design tokens

| Campo | Detalhe |
|-------|---------|
| Descrição | Radius (`rounded-none` vs `rounded-xl`), ícones (Phosphor vs Lucide), cores de erro |
| Arquivos | Múltiplos componentes e páginas |
| Esforço | Médio (2–3 dias) |

### P2.10 residual — N+1 em `getUserCompaniesAction`

| Campo | Detalhe |
|-------|---------|
| Descrição | `getConstructionSitesAdmin` já otimizado; counts por empresa em `getUserCompaniesAction` ainda em loop |
| Arquivos | `authData.ts` |
| Esforço | Baixo (2–4h) |

### P2.11 — Rota órfã usuários da obra

| Campo | Detalhe |
|-------|---------|
| Descrição | `/obras/[id]/usuarios` existe mas não está no menu da sidebar |
| Arquivos | `sidebarNavConfig.ts` |
| Esforço | Baixo (1–2h) |

### P2.12 — UI morta no header

| Campo | Detalhe |
|-------|---------|
| Descrição | Busca global, ajuda, notificações sem handler |
| Arquivos | `Header.tsx` |
| Esforço | Médio (implementar) ou Baixo (remover/ocultar) |

---

## P3 — Expansão de produto (roadmap)

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

---

## Gaps funcionais (não-roadmap técnico)

| Gap | Módulo |
|-----|--------|
| Remover/editar colaborador na obra | `obras/[id]/colaboradores` |
| Delete/edit item almoxarifado | Almoxarifado |
| Gestão real de categorias/unidades (`Math.random` mock) | `SupplyItemForm`, `ManageSelectsModal` |
| Aba segurança em configurações (redefinir senha, excluir conta) | `configuracoes/page.tsx` |
| Slides de login prometem módulos inexistentes | `features/auth/components/slides/` |

Detalhes: [Funcionalidades e Módulos](./auditoria-funcionalidades-modulos.md)

---

## Métricas — metas restantes

| Métrica | Atual | Meta |
|---------|------:|-----:|
| Arquivos >200 linhas | ~35 | <20 |
| Uso de `any` | ~60 | <30 |
| Selects nativos (dados) | ~2 | 0 |
| Actions com Zod | ~40% | 100% |
| Testes unitários | 0 | Hooks críticos cobertos |
| E2E no CI | Não | Sim |
| Forms de obra com RHF | 0/10 | 10/10 |

---

## Documentos relacionados

- [Resumo Executivo](./auditoria-resumo-executivo.md)
- [Segurança e Backend](./auditoria-seguranca-backend.md)
- [UI/UX e Navegação](./auditoria-ui-ux-navegacao.md)
- [Funcionalidades e Módulos](./auditoria-funcionalidades-modulos.md)
- [Arquitetura e Qualidade](./auditoria-arquitetura-qualidade.md)
