# Auditoria ObraLog ERP — UI/UX e Navegação (pendências)

[Voltar ao índice](./auditoria-obralog-indice.md) · [Resumo Executivo](./auditoria-resumo-executivo.md)

**Última atualização:** 23 de junho de 2026  
**Escopo:** lacunas de UX **após** sidebar unificada, breadcrumbs, ConfirmDialog e exports

---

## Resumo

**Nota UI/UX: ~70%** · **Navegação: ~85%**

A sidebar com contexto de obra persistente, breadcrumbs e exports CSV elevaram a navegação. Pendências concentram-se em forms de obra, acessibilidade, tokens visuais e elementos de UI sem função.

---

## Navegação — lacunas restantes

| Problema | Detalhe | Impacto |
|----------|---------|---------|
| Busca global fake | Input "Pesquisar..." no Header sem handler | Expectativa frustrada |
| Botões header inativos | Ajuda, Configurações, Notificações sem ação | UI morta |
| `/obras/[id]/usuarios` órfão | Rota existe, fora do menu da sidebar | Funcionalidade escondida |
| Cor mobile inconsistente | Footer `#F29C1F` vs sistema `#101828` | Identidade fragmentada |
| Footer mobile incompleto | 4 itens; EPIs/alugados via `/menu` | Descoberta difícil |

---

## Forms — pendências

### Sem RHF/Zod (~10 forms modais de obra)

Validação manual com `useState`:

- `LoanToolForm`, `ReturnToolForm`, `GiveEPIForm`
- `AddInventoryForm`, `AddRentedForm`, `ReturnRentedForm`
- `AddToolForm`, `AddEPIForm`, `AddSiteCollaboratorForm`
- `StockAdjustment`

**Roadmap:** [P1.4](./roadmap-melhorias-priorizado.md#p14--padronizar-forms-modais-de-obra-com-rhf--zod)

### Selects nativos restantes

| Arquivo | Campo |
|---------|-------|
| `acesso/perfis/page.tsx` | Filtro escopo |
| `ferramentas/disponiveis/page.tsx` | Filtro disponibilidade |

---

## Componentes e design system

### Ausentes

- `FormModal` reutilizável — cada modal é `<div className="fixed inset-0">` inline
- Dialog/sheet shadcn — reimplementação custom em todo o app

### Inconsistências visuais pendentes

| Dimensão | Variações |
|----------|-----------|
| Border radius | `rounded-none` vs `rounded-xl` / `rounded-[5px]` |
| Ícones | Phosphor no layout vs Lucide nas páginas |
| Cores de erro | `text-destructive` vs `text-red-700` vs banner uppercase |
| Modais | `w-[500px]`, `w-[800px]`, `max-w-[95vw]` — sem padrão |

**Roadmap:** [P2.8](./roadmap-melhorias-priorizado.md#p28--unificar-design-tokens)

---

## Feedback ao usuário — lacunas

| Problema | Onde |
|----------|------|
| Falhas silenciosas | `visao-geral/page.tsx` — stats zerados sem mensagem |
| Toast ausente em sucesso | Alguns forms de obra (`LoanToolForm` chama só `onSaved()`) |
| 3 padrões de erro concorrentes | Banner inline / toast / `console.error` |

---

## Estados de loading

| Estado | Situação |
|--------|----------|
| Skeleton | `TablePageSkeleton` em insumos/colaboradores; demais páginas ainda com `Loader2` |
| Empty | `EmptyState` com `rounded-xl` conflita com `--radius: 0` |

---

## Acessibilidade (a11y) — crítico pendente

| Problema | Impacto |
|----------|---------|
| `SearchableSelect` sem combobox pattern | Sem teclado (↑↓ Enter Esc), sem `role` |
| Quase zero `aria-*` global | Screen readers perdem contexto |
| Modais sem trap de foco / `aria-modal` | Tab escapa |
| Toast sem `role="alert"` / `aria-live` | Notificações não anunciadas |
| Botões só com ícone (`title` apenas) | Insuficiente para SR |
| `LoginForm` desabilita focus ring | Prejudica teclado |

**Roadmap:** [P2.6](./roadmap-melhorias-priorizado.md#p26--a11y-no-searchableselect)

---

## Recomendações priorizadas

| Prioridade | Ação | Esforço |
|:----------:|------|---------|
| 1 | P1.4 — RHF + Zod nos forms de obra | Alto |
| 2 | P2.6 — A11y SearchableSelect | Alto |
| 3 | P2.8 — Unificar tokens visuais | Médio |
| 4 | P2.5 — Skeleton em todas as listagens | Baixo |
| 5 | Incluir `/obras/[id]/usuarios` no menu | Baixo |
| 6 | Busca global ou remover do header | Médio/Baixo |

---

## Documentos relacionados

- [Funcionalidades e Módulos](./auditoria-funcionalidades-modulos.md)
- [Arquitetura e Qualidade](./auditoria-arquitetura-qualidade.md)
- [Roadmap Priorizado](./roadmap-melhorias-priorizado.md)
