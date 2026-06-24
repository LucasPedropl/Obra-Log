# Auditoria ObraLog ERP — Funcionalidades e Módulos (pendências)

[Voltar ao índice](./auditoria-obralog-indice.md) ·
[Resumo Executivo](./auditoria-resumo-executivo.md)

**Última atualização:** 23 de junho de 2026  
**Escopo:** gaps funcionais **restantes** após maratona

---

## Resumo

**Completude funcional: ~50%** (ERP completo) · **Núcleo operacional: ~75%**

Cadastros globais e operação de canteiro estão estáveis. Pendências: CRUD
parcial em algumas entidades, mocks residuais, módulos clássicos inexistentes.

---

## Mapa — existente vs prometido

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

---

## Módulos globais — gaps

### Obras

| Operação        | Status                                  |
| --------------- | --------------------------------------- |
| Create / Read   | ✅                                      |
| Update / Delete | Backend ✅ — **UI ausente** na listagem |
| Import          | ❌                                      |
| Export          | ✅ CSV                                  |

### Insumos

| Operação                   | Status                                                        |
| -------------------------- | ------------------------------------------------------------- |
| CRUD + Import + Export     | ✅                                                            |
| Delete categorias/unidades | **Mock** — `Math.random()` para `isInUse` em `SupplyItemForm` |
| `ManageSelectsModal`       | Mock — comentário "Mock data for now"                         |

### Colaboradores

| Operação               | Status                                                |
| ---------------------- | ----------------------------------------------------- |
| CRUD + Import + Export | ✅                                                    |
| Upload documentos      | Via browser (`CollaboratorForm`) — migrar para action |

### Acesso

#### Perfis

| Operação        | Status            |
| --------------- | ----------------- |
| CRUD + Export   | ✅                |
| Import          | ❌                |
| `allowed_sites` | ✅ (pós-maratona) |

#### Usuários

| Operação                         | Status                    |
| -------------------------------- | ------------------------- |
| Create / Read / Edit / Desativar | ✅                        |
| Delete definitivo                | ❌                        |
| Senha temporária                 | Exposta na UI — **risco** |

### Configurações

| Aba              | Status                                                 |
| ---------------- | ------------------------------------------------------ |
| Perfil / Empresa | ✅ via `settingsActions`                               |
| Segurança        | **Stub** — redefinir senha e excluir conta sem handler |

---

## Sub-módulos por obra — gaps

### Almoxarifado

| Operação                   | Status |
| -------------------------- | ------ |
| Entrada / Ajuste qty       | ✅     |
| Delete item / Edit vínculo | ❌     |

### Colaboradores da obra

| Operação                        | Status                            |
| ------------------------------- | --------------------------------- |
| Alocar / Listar                 | ✅                                |
| Remover da obra / Editar função | ❌                                |
| Controle de jornada             | ❌ (mencionado, não implementado) |

### Usuários da obra

- Rota: `/obras/[id]/usuarios` — **fora da sidebar**
- Lista usuários da empresa inteira, não filtrados por obra
- Sem edit/delete por obra

### Movimentações

- Read-only agregado — sem criação manual nesta tela (by design?)

---

## Módulos inexistentes (P3)

| Módulo                              | Evidência                                 |
| ----------------------------------- | ----------------------------------------- |
| Planejamento, Orçamento, Cronograma | Slides login; zero rota                   |
| Diário de obra, Medições            | Zero rota                                 |
| Compras                             | Motivo `PURCHASE` só em exibição          |
| Financeiro                          | Slide mock                                |
| Documentos da obra                  | Upload só em docs pessoais do colaborador |
| Relatórios                          | Zero rota                                 |
| Configurações por obra              | Config global apenas                      |

---

## Matriz CRUD — lacunas

| Entidade            |    U    |   D   | Import | Observação       |
| ------------------- | :-----: | :---: | :----: | ---------------- |
| Obra                |  UI ❌  | UI ❌ |   ❌   | Backend ok       |
| Colaborador (obra)  |   ❌    |  ❌   |   —    |                  |
| Almoxarifado item   | parcial |  ❌   |   —    | Só qty           |
| Usuário sistema     |   ✅    |  ❌   |   —    | Desativar ok     |
| Perfil acesso       |   ✅    |  ✅   |   ❌   | Export ok        |
| Categorias/unidades |  mock   | mock  |   —    | `SupplyItemForm` |

---

## Stubs e mocks residuais

| Local                    | Tipo                              |
| ------------------------ | --------------------------------- |
| `SupplyItemForm.tsx`     | `Math.random()` para `isInUse`    |
| `ManageSelectsModal.tsx` | Mock delete categorias            |
| `configuracoes/page.tsx` | Aba segurança                     |
| Slides auth              | Marketing de módulos inexistentes |

---

## Conclusão

O núcleo operacional está maduro. **Maiores gaps restantes:**

1. UI de edit/delete de obras
2. Forms de obra sem RHF/Zod
3. Gestão real de categorias/unidades (sem mock)
4. Módulos clássicos de ERP (P3)
5. Aba segurança e ciclo de vida completo de usuários

---

## Documentos relacionados

- [UI/UX e Navegação](./auditoria-ui-ux-navegacao.md)
- [Segurança e Backend](./auditoria-seguranca-backend.md)
- [Roadmap Priorizado](./roadmap-melhorias-priorizado.md)
