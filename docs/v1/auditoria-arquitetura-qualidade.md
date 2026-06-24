# Auditoria ObraLog ERP — Arquitetura e Qualidade (pendências)

[Voltar ao índice](./auditoria-obralog-indice.md) · [Resumo Executivo](./auditoria-resumo-executivo.md)

**Última atualização:** 23 de junho de 2026  
**Escopo:** dívida técnica **restante** após maratona

---

## Resumo

**Nota de arquitetura: ~55%** · **Nota de qualidade: ~50%**

A maratona modularizou `adminActions.ts` em ~15 actions por domínio, criou `_helpers.ts`, schemas compartilhados e migrou mutações críticas. Ainda há god files, `any` disperso e zero testes unitários.

---

## Gaps arquiteturais pendentes

| Regra declarada | Situação atual |
|-----------------|----------------|
| Máx 150–200 linhas/arquivo | ~35 arquivos violam |
| `schemas/` por feature | Parcial — obras, insumos, colaboradores; demais inline |
| `services/` por feature | Só `admin` tem services |
| Componentes nunca mutam direto | Residual em `CollaboratorForm`, `SupplyItemForm` |
| Zero `any` | ~60 ocorrências |

---

## Padrões de acesso a dados (residual)

| Padrão | Exemplos | Avaliação |
|--------|----------|-----------|
| Hook → Server Action | Cadastros globais, mutações de obra | Correto |
| Hook → Supabase browser (read) | `useMovimentacoes`, `useToolHistory`, `useEPIHistory` | Aceitável com RLS |
| Component → Supabase direto | `CollaboratorForm`, `SupplyItemForm` | Migrar |
| Page → Service client (read) | `accessProfiles.service.ts` (reads) | Aceitável |

### SWR

Dependência declarada, **zero uso** — remover ou adotar para cache.

---

## God files (>200 linhas) — top 15

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

**Ação:** extrair sub-componentes e hooks de lógica — priorizar forms de obra e `CollaboratorForm`.

---

## TypeScript — hotspots de `any`

| Arquivo | Contexto |
|---------|----------|
| `insumos/page.tsx` | Estados de listagem |
| `CollaboratorForm.tsx` | `documents_json` |
| `SelectCompanyClient.tsx` | Estados de empresa |
| `DataTable.tsx` | `Record<string, any>` |
| Diversas actions legadas | Maps e payloads |

---

## Código morto / duplicado

| Item | Ação sugerida |
|------|---------------|
| SWR não usado | Remover de `package.json` ou implementar |
| Parsing de import TXT duplicado | Centralizar helper |
| Mapa de perfis copy-paste em actions | Extrair util compartilhado |

---

## Performance pendente

| Local | Problema |
|-------|----------|
| `getUserCompaniesAction` | Counts por empresa em loop (N+1) |
| `importCatalogsAdmin` | Insert de unidade por abreviação no loop (bulk) |

Índices SQL sugeridos (não versionados no repo):

```sql
CREATE INDEX ON construction_sites (company_id);
CREATE INDEX ON company_users (user_id, company_id);
CREATE INDEX ON site_inventory (site_id, catalog_id);
CREATE INDEX ON site_movements (site_id, action_date DESC);
```

---

## Testes

| Tipo | Status |
|------|--------|
| Unit (`*.test.*`) | **Zero** |
| Integration | **Zero** |
| E2E Playwright | `e2e/smoke.spec.ts` — local apenas |
| CI | **Ausente** |
| Vitest | **Ausente** |

---

## Tratamento de erros — inconsistências

| Padrão | Onde ainda ocorre |
|--------|-------------------|
| `console.error` silencioso | Alguns hooks de obra |
| Stats zerados sem mensagem | `visao-geral/page.tsx` em falha de API |
| 3 padrões concorrentes (banner / toast / silencioso) | Forms de obra vs CRUD global |

---

## Recomendações priorizadas

| Prioridade | Ação |
|:----------:|------|
| P1 | P1.4 — RHF + Zod nos forms de obra |
| P1 | Rollout Zod em todas as actions |
| P2 | Vitest + Playwright no CI |
| P2 | Resolver N+1 em `getUserCompaniesAction` |
| P2 | Refatorar god files (CollaboratorForm, SupplyItemForm) |
| P3 | Eliminar `any` nos hotspots |
| P3 | Remover SWR ou usar |

Detalhes: [Roadmap Priorizado](./roadmap-melhorias-priorizado.md)

---

## Documentos relacionados

- [Segurança e Backend](./auditoria-seguranca-backend.md)
- [Funcionalidades e Módulos](./auditoria-funcionalidades-modulos.md)
- [Testes E2E](./relatorio-testes-e2e-erp.md)
