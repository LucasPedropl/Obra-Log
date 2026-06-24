# Relatório de Testes E2E — ObraLog ERP (pendências)

[Voltar ao índice](./auditoria-obralog-indice.md) ·
[Resumo Executivo](./auditoria-resumo-executivo.md)

**Última atualização:** 23 de junho de 2026

---

## Situação atual

| Tipo                      | Status                                              |
| ------------------------- | --------------------------------------------------- |
| Smoke E2E Playwright      | ✅ `apps/app/e2e/smoke.spec.ts`                     |
| Script `test:e2e`         | ✅ `package.json`                                   |
| Teste manual histórico    | `trash/erp-system-test.mjs` (28 cenários, jun/2026) |
| Vitest (unit/integration) | ❌ Ausente                                          |
| CI (GitHub Actions)       | ❌ Ausente                                          |
| Cobertura de regressão    | Baixa — só smoke                                    |

---

## O que o smoke cobre

- Redirect de rotas protegidas sem autenticação
- Fluxo básico de login (se credenciais disponíveis)
- Acesso ao dashboard autenticado

---

## Gaps de cobertura (pendentes)

### Cenários E2E a adicionar

| Área            | Cenários sugeridos                                                 |
| --------------- | ------------------------------------------------------------------ |
| Sidebar obra    | Selecionar obra → navegar para almoxarifado a partir de `/insumos` |
| RBAC            | Perfil sem permissão → `/unauthorized`                             |
| `allowed_sites` | Perfil SPECIFIC_SITES → obra bloqueada                             |
| CRUD            | Create/edit/delete insumo, colaborador                             |
| Export CSV      | Download em listagens                                              |
| Forms de obra   | Emprestar ferramenta, entregar EPI                                 |
| Multi-tenant    | Troca de empresa no header                                         |

### Testes unitários sugeridos

| Alvo                | Por quê                               |
| ------------------- | ------------------------------------- |
| `_helpers.ts`       | Auth, company validation, permissions |
| Schemas Zod         | Regressão de validação                |
| `exportToCsv`       | Formato de export                     |
| `parseAllowedSites` | RBAC por obra                         |

---

## CI recomendado

```yaml
# Esboço — não implementado
- npm run build (apps/app)
- npm run test:e2e (com servidor + credenciais em secrets)
- vitest (quando adicionado)
```

**Bloqueadores para CI:** credenciais de teste, ambiente Supabase estável, seed
de dados.

---

## Resultado histórico (pré-maratona)

Teste manual em `http://localhost:3005` — 28 cenários, 25 OK, 3 avisos, 0
falhas.

Avisos: timing de botões no automatizado; `Failed to fetch` intermitente no
console.

Artefatos: `trash/erp-test-results.json`, `trash/erp-system-test.mjs`

> Este resultado reflete o estado **antes** da maratona. Reexecutar
> `npm run test:e2e` em `apps/app` para validar o estado atual.

---

## Próximos passos

1. **P2.7** — Workflow GitHub Actions com `test:e2e`
2. Adicionar Vitest + testes de `_helpers` e schemas
3. Expandir smoke para sidebar + RBAC + 1 fluxo de obra
4. Seed/fixtures de dados para CI reproduzível

Detalhes: [Roadmap P2.7](./roadmap-melhorias-priorizado.md#p27--testes-no-ci)

---

## Documentos relacionados

- [Arquitetura e Qualidade](./auditoria-arquitetura-qualidade.md)
- [Roadmap Priorizado](./roadmap-melhorias-priorizado.md)
