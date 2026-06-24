# Auditoria ObraLog ERP — Resumo Executivo (pendências)

[Voltar ao índice](./auditoria-obralog-indice.md)

**Última atualização:** 23 de junho de 2026  
**Escopo:** `apps/app`

---

## Veredicto atual

O ObraLog ERP é um **sistema operacional de canteiro com cadastros mestres** — almoxarifado, ferramentas, EPIs, equipamentos alugados, movimentações e visão geral por obra.

Após a maratona de melhorias, o sistema **passou dos bloqueadores críticos de segurança (P0)** e ganhou **navegação por contexto de obra na sidebar**. Ainda **não é um ERP completo de construção** e **não está pronto para produção pública sem os itens residuais** abaixo.

---

## O que ainda impede maturidade plena

| # | Lacuna | Impacto |
|---|--------|---------|
| 1 | **RLS `get_my_sites` sem escopo por obra** | Usuário restrito acessa dados de outras obras via browser |
| 2 | **`globalUsers.ts` — cross-tenant + toggle sem auth** | Listagem/desativação de usuários de outra empresa |
| 3 | Zod não aplicado em todas as server actions | Payloads malformados podem passar em actions sem validação |
| 4 | Forms modais de obra sem RHF + Zod (~10 forms) | Validação inconsistente, difícil manutenção |
| 5 | RLS não versionado no repositório | Segurança depende de estado manual no Supabase |
| 6 | Zero testes unitários; E2E sem CI | Regressões não detectadas automaticamente |
| 7 | Módulos clássicos inexistentes (orçamento, cronograma, financeiro…) | Gap de produto vs slides de marketing |

---

## Notas por dimensão (atualizadas)

| Dimensão | Nota | Pendências principais |
|----------|------|------------------------|
| Produto / escopo | ~50% | Módulos P3; CRUD parcial em obra/colaborador-obra |
| Arquitetura | ~55% | God files; `any`; leituras ainda via browser em hooks |
| Segurança | **Alto** | [Auditoria cibersegurança/LGPD](./auditoria-ciberseguranca-lgpd.md): RLS `get_my_sites`, `globalUsers.ts`, LGPD ~25% |
| UI/UX | ~70% | A11y; tokens visuais; busca/header mortos |
| Qualidade de código | ~50% | ~35 arquivos >200 linhas; ~60 `any` |
| Navegação | ~85% | `/obras/[id]/usuarios` fora do menu |
| Testes | Baixo | Vitest ausente; Playwright só local |

---

## O que funciona (baseline estável)

| Área | Status |
|------|--------|
| Auth + multi-tenant (cookie validado no server) | Ok |
| Sidebar com seletor de obra sempre visível | Ok |
| Insumos, colaboradores (CRUD + import) | Maduro |
| Operação de canteiro (almoxarifado, ferramentas, EPIs, alugados) | Operacional |
| RBAC com `allowed_sites` + guard por obra | Ok |
| Dashboard com KPIs reais ou banner honesto | Ok |
| Exports CSV nas listagens principais | Ok |
| Server actions modularizadas com `_helpers.ts` | Ok |

---

## O que ainda não existe (produto)

Planejamento · Orçamento · Cronograma · Diário de obra · Medições · Compras · Financeiro · Documentos da obra · Relatórios · Configurações por obra

Esses módulos aparecem apenas nos slides de marketing no login.

---

## Riscos residuais

| # | Risco | Mitigação pendente |
|---|-------|-------------------|
| 1 | Senha temporária em `user_metadata.temp_password` | Canal seguro; nunca em metadata |
| 2 | CPF/RG/endereço sem mascaramento na UI | Máscara + política de retenção |
| 3 | Mutações residuais no browser (`CollaboratorForm` upload, `SupplyItemForm` categorias) | Migrar para server actions |
| 4 | `loginAction` sem Zod no servidor | Schema na action |
| 5 | Funções SQL de permissão no banco não usadas pelo TS | RPC ou replicar lógica |

Detalhes: [Segurança e Backend](./auditoria-seguranca-backend.md)

---

## Próximos passos recomendados

Ordem sugerida (ver [Roadmap](./roadmap-melhorias-priorizado.md)):

1. **P1.4** — Padronizar forms modais de obra com RHF + Zod
2. **P0.5 (rollout)** — Zod em todas as server actions restantes
3. **P2.6** — A11y no SearchableSelect (combobox pattern)
4. **P2.7** — Vitest + Playwright no CI
5. **P2.8** — Unificar design tokens (radius, ícones)
6. **P3** — Decisão de produto para novos módulos

---

## Documentos relacionados

- [Índice](./auditoria-obralog-indice.md)
- [Segurança e Backend](./auditoria-seguranca-backend.md)
- [UI/UX e Navegação](./auditoria-ui-ux-navegacao.md)
- [Funcionalidades e Módulos](./auditoria-funcionalidades-modulos.md)
- [Arquitetura e Qualidade](./auditoria-arquitetura-qualidade.md)
- [Testes E2E](./relatorio-testes-e2e-erp.md)
- [Roadmap Priorizado](./roadmap-melhorias-priorizado.md)
