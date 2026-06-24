# Auditoria ObraLog ERP — Segurança e Backend (pendências)

[Voltar ao índice](./auditoria-obralog-indice.md) ·
[Resumo Executivo](./auditoria-resumo-executivo.md)

**Última atualização:** 23 de junho de 2026  
**Escopo:** riscos e lacunas **ainda abertos** após maratona P0

---

## Resumo

A maratona resolveu os bloqueadores críticos: auth nas actions admin, validação
de `selectedCompanyId`, migração de mutações críticas para server actions,
`allowed_sites`, middleware via `proxy.ts`, e helpers centralizados em
`_helpers.ts`.

**Classificação atual: Médio** — adequado para ambiente controlado com
monitoramento; itens abaixo devem ser endereçados antes de produção pública
ampla.

---

## O que já está em produção no código

- `getAuthenticatedUserId()` e `getValidatedCompanyId()` em actions sensíveis
- `assertCompanyResourcePermission()` com variantes view/create/edit/delete
- `assertSiteAccess()` para rotas de obra
- Mutações de ferramentas, EPIs, alugados, inventário e perfis via server
  actions
- `ObraProtectedRoute` + layout em `/obras/[id]/*`
- Configurações via `settingsActions.ts` (não mais UPDATE direto no browser)

---

## Riscos residuais

### Alto

| ID  | Risco                                                             | Arquivo(s)                                   | Mitigação                                         |
| --- | ----------------------------------------------------------------- | -------------------------------------------- | ------------------------------------------------- |
| S11 | Senha temporária em `user_metadata.temp_password` e exposta na UI | `globalUsers.ts`, `acesso/usuarios/page.tsx` | Email de convite ou link único; nunca em metadata |
| S13 | CPF/RG/endereço sem mascaramento na listagem                      | `useCollaborators`, páginas CRUD             | Máscara na UI; política de retenção               |

### Médio

| ID  | Risco                                                                      | Arquivo(s)                                                                               | Mitigação                                 |
| --- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ----------------------------------------- |
| S5b | Mutações residuais no browser                                              | `CollaboratorForm.tsx` (upload storage), `SupplyItemForm.tsx` (CRUD categorias/unidades) | Server actions + Storage policy           |
| S16 | Auto-criação de perfil Administrador via cliente                           | `companyUsersAdminActions.ts`                                                            | Migration/seed ou action super-admin only |
| S17 | `loginAction` sem Zod no servidor                                          | `actions/auth.ts`                                                                        | Schema Zod na action                      |
| S18 | Funções SQL `check_user_resource_permission` no banco não chamadas pelo TS | Supabase                                                                                 | RPC ou replicar em TS                     |
| Z1  | Zod aplicado só em parte das actions                                       | `app/actions/`                                                                           | Rollout P0.5                              |

### Baixo / estrutural

| ID    | Risco                                                                              | Mitigação                                    |
| ----- | ---------------------------------------------------------------------------------- | -------------------------------------------- |
| RLS1  | Políticas RLS não versionadas no repositório                                       | Exportar migrations; revisar em PR           |
| RBAC1 | Permissões ainda reforçadas principalmente no client para alguns fluxos de leitura | Hooks de leitura sensíveis via server action |

---

## Mutações ainda no browser

| Componente             | Operação                              | Prioridade |
| ---------------------- | ------------------------------------- | :--------: |
| `CollaboratorForm.tsx` | Upload documentos → Storage           |   Média    |
| `SupplyItemForm.tsx`   | CRUD categorias/unidades inline       |   Média    |
| `AddRentedForm.tsx`    | Possível mutação residual (verificar) |   Baixa    |

Leituras via `createClient()` em hooks (`useMovimentacoes`, `useToolHistory`,
etc.) são aceitáveis **se RLS estiver correto** — mas dependem de políticas não
versionadas.

---

## Validação server-side

| Camada                                                                             | Status       |
| ---------------------------------------------------------------------------------- | ------------ |
| Formulários globais (RHF + Zod)                                                    | Ok           |
| Server actions críticas (tools, epis, inventory, rented, settings, accessProfiles) | Ok           |
| Demais actions (`auth.ts`, `catalogActions`, `collaboratorsActions`, etc.)         | **Pendente** |

---

## Modelo alvo (checklist — itens ainda não universais)

Toda server action deve:

1. ~~`getAuthenticatedUserId()`~~ — **ok na maioria**
2. ~~Validar `selectedCompanyId`~~ — **ok na maioria**
3. ~~`assertCompanyResourcePermission`~~ — **ok na maioria**
4. **Validar payload com Zod** — rollout pendente
5. Usar `supabaseAdmin` apenas após 1–4 — **ok**
6. Retornar `{ success, error }` consistente — parcial

---

## Documentos relacionados

- [Arquitetura e Qualidade](./auditoria-arquitetura-qualidade.md)
- [Roadmap Priorizado](./roadmap-melhorias-priorizado.md)
- [Funcionalidades e Módulos](./auditoria-funcionalidades-modulos.md)
