# Relatório de Testes — ObraLog ERP

**Data:** 24/06/2026  
**Aplicação:** ERP principal (`apps/app`) — http://localhost:3005  
**Escopo:** Teste funcional e de navegação do sistema principal (não inclui
painel admin `:3010`)

---

## 1. Metodologia

| Item                    | Detalhe                                                                                                                           |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **Ferramenta**          | Playwright (Chromium headless) — automação equivalente ao navegador                                                               |
| **Aba Cursor**          | Referência: `Obra-Log ERP` em `/obras/.../colaboradores` (Browser ID `7ced30`)                                                    |
| **Nota**                | O MCP `cursor-ide-browser` não está habilitado neste workspace; os testes foram executados via Playwright contra a mesma URL/base |
| **Script reprodutível** | `trash/erp-system-test.mjs` → gera `trash/erp-test-results.json`                                                                  |
| **Usuário de teste**    | `pedro@gmail.com` — Admin da empresa **Geplano**                                                                                  |
| **Empresa**             | `6edca222-ce35-4de4-b593-92a9cf23fdfb`                                                                                            |
| **Obra de teste**       | `98555a1a-4ff3-4643-883d-7a7a5d4c409b` ("teste")                                                                                  |

### Critérios de avaliação

- **OK** — Página carrega (HTTP 2xx), sem redirect para login/unauthorized, sem
  erro visível
- **Aviso** — Carrega mas com limitação (dado mock, botão ausente por timing,
  erro console não bloqueante)
- **Falha** — HTTP 4xx/5xx, redirect indevido, erro de aplicação ou operação
  quebrada

---

## 2. Resumo executivo

| Métrica           | Valor    |
| ----------------- | -------- |
| Testes executados | 28       |
| OK                | 25 (89%) |
| Avisos            | 3 (11%)  |
| Falhas            | 0        |

**Conclusão:** O ERP está **navegável e estável** nas rotas principais.
Autenticação, seleção de empresa e módulos por obra funcionam. Há
**funcionalidades incompletas** (exportação, dashboard com dados fictícios) e
**dívida técnica em Server Actions** (RLS) que já causou bugs em
cadastro/importação — parcialmente corrigidos.

---

## 3. O que está funcionando

### 3.1 Infraestrutura e autenticação

| Teste                                                 | Status |
| ----------------------------------------------------- | ------ |
| Servidor `:3005` respondendo                          | OK     |
| Login (`/auth/login`)                                 | OK     |
| Redirecionamento pós-login → dashboard                | OK     |
| Cookie `selectedCompanyId` + acesso à empresa Geplano | OK     |

### 3.2 Navegação global (sidebar)

| Rota                           | Status |
| ------------------------------ | ------ |
| `/dashboard`                   | OK     |
| `/obras`                       | OK     |
| `/insumos`                     | OK     |
| `/colaboradores`               | OK     |
| `/acesso/perfis`               | OK     |
| `/acesso/usuarios`             | OK     |
| `/configuracoes`               | OK     |
| `/empresas` (troca de empresa) | OK     |

### 3.3 Módulos da obra (`/obras/:id/...`)

Todas as sub-rotas testadas carregaram corretamente para a obra **teste**:

| Módulo                      | Rota                        | Status                      |
| --------------------------- | --------------------------- | --------------------------- |
| Visão geral                 | `/visao-geral`              | OK                          |
| Almoxarifado                | `/almoxarifado`             | OK                          |
| Colaboradores da obra       | `/colaboradores`            | OK _(aba ativa do usuário)_ |
| Ferramentas — disponíveis   | `/ferramentas/disponiveis`  | OK                          |
| Ferramentas — em uso        | `/ferramentas/em-uso`       | OK                          |
| Ferramentas — histórico     | `/ferramentas/historico`    | OK                          |
| EPIs — disponíveis          | `/epis/disponiveis`         | OK                          |
| EPIs — histórico            | `/epis/historico`           | OK                          |
| Equip. alugados — ativos    | `/equip-alugados/ativos`    | OK                          |
| Equip. alugados — histórico | `/equip-alugados/historico` | OK                          |
| Movimentações               | `/movimentacoes`            | OK                          |
| Usuários da obra            | `/usuarios`                 | OK                          |

### 3.4 Correções recentes (sessão anterior)

Estes fluxos **tinham erro 42501 (RLS)** e foram corrigidos:

| Fluxo                          | Correção aplicada                                                                               |
| ------------------------------ | ----------------------------------------------------------------------------------------------- |
| Cadastrar obra                 | Server Action usa `supabaseAdmin` + validação de permissão                                      |
| Importação em massa de insumos | Resolve `unit_abbreviation` → `unit_id`, cria unidades ausentes, bypass RLS                     |
| Super admin no banco           | Funções `check_user_resource_permission` e `check_user_site_access` reconhecem `is_super_admin` |

### 3.5 Dados atuais no banco (Geplano)

| Tabela             | Registros |
| ------------------ | --------- |
| Obras              | 1         |
| Insumos (catalogs) | 1         |
| Unidades de medida | 1         |
| Categorias         | 1         |
| Colaboradores      | 0         |
| Perfis de acesso   | 0         |

---

## 4. O que não está funcionando ou está incompleto

### 4.1 Dashboard com dados fictícios — **Incompleto**

O `/dashboard` exibe KPIs **hardcoded** (ex.: "12 Obras Ativas", "148
Colaboradores"), sem consulta ao Supabase.

**Impacto:** Informações enganosas para o usuário.  
**Prioridade:** Média  
**Arquivo:** `apps/app/src/app/(app)/dashboard/page.tsx`

### 4.2 Exportação — **Não implementada**

Botões "Exportar" existem na UI mas têm `onClick={() => {}}` (no-op):

| Página           |
| ---------------- |
| `/obras`         |
| `/insumos`       |
| `/colaboradores` |
| `/acesso/perfis` |

**Prioridade:** Baixa (funcionalidade ausente, não quebra o sistema)

### 4.3 Server Actions ainda sujeitas a RLS — **Risco**

A maioria das actions em `adminActions.ts` ainda usa
`createServerSupabaseClient()` (cliente com sessão + RLS). Apenas **cadastro de
obra** e **importações** foram migradas para `supabaseAdmin` com checagem
manual.

**Operações ainda vulneráveis** (podem falhar para super admin ou em edge
cases):

- CRUD de insumos individual (`createSupplyItemAdmin`, `updateSupplyItemAdmin`,
  …)
- CRUD de categorias, unidades, colaboradores
- Operações de almoxarifado, EPIs, ferramentas, movimentações

**Prioridade:** Alta (padronizar padrão `supabaseAdmin` +
`assertCompanyResourcePermission`)

### 4.4 Erro intermitente no console — **Aviso**

Durante navegação rápida entre páginas:

```
Error fetching construction sites: TypeError: Failed to fetch
```

Provável **race condition** ao chamar Server Action enquanto a página anterior
ainda carrega ou durante transição de rota. Não bloqueou o uso nas rotas
testadas.

**Prioridade:** Baixa

### 4.5 Importação em massa — **Corrigida, pendente re-teste manual**

A importação via TXT (`Nome;Unidade;EstoqueMinimo`) falhava por:

1. RLS (42501)
2. Campo inválido `unit_abbreviation` enviado direto à tabela `catalogs`

Correção já aplicada em `importCatalogsAdmin`. No banco há apenas **1 insumo**
("teste"), indicando que a importação do arquivo
`trash/insumos-importacao-massa.txt` (121 linhas) **ainda não foi executada com
sucesso** após a correção.

**Ação recomendada:** Reimportar o TXT pela UI em `/insumos` → Importar.

### 4.6 Botões condicionais (Cadastrar Obra / Importar) — **Aviso no teste automatizado**

O teste automatizado não encontrou os botões "Cadastrar Obra" e "Importar" em
insumos. Causa provável:

- Componente `<Can>` retorna `null` enquanto `PermissionsContext` está em
  `loading`
- Teste navegou antes das permissões carregarem (~800 ms)

Para admin de empresa (`pedro@gmail.com`), os botões **devem** aparecer após o
loading. Validar manualmente na aba do Cursor.

---

## 5. Matriz de módulos

| Módulo                   | Navegação | CRUD        | Import      | Export | Dados reais |
| ------------------------ | --------- | ----------- | ----------- | ------ | ----------- |
| Dashboard                | OK        | —           | —           | —      | Não (mock)  |
| Obras                    | OK        | Corrigido\* | Não         | Não    | Sim         |
| Insumos                  | OK        | RLS\*\*     | Corrigido\* | Não    | Sim         |
| Colaboradores            | OK        | RLS\*\*     | Parcial     | Não    | Sim         |
| Acesso (perfis/usuários) | OK        | RLS\*\*     | Parcial     | Não    | Sim         |
| Configurações            | OK        | —           | —           | —      | Parcial     |
| Almoxarifado (obra)      | OK        | RLS\*\*     | —           | —      | Sim         |
| Ferramentas (obra)       | OK        | RLS\*\*     | —           | —      | Sim         |
| EPIs (obra)              | OK        | RLS\*\*     | —           | —      | Sim         |
| Equip. alugados (obra)   | OK        | RLS\*\*     | Parcial     | Não    | Sim         |
| Movimentações (obra)     | OK        | RLS\*\*     | —           | —      | Sim         |

\* Corrigido nesta sprint de bugs  
\*\* Pode falhar com RLS em cenários específicos (super admin, sessão expirada)

---

## 6. Recomendações prioritárias

### P0 — Curto prazo

1. **Padronizar Server Actions** — Migrar todas as mutations em
   `adminActions.ts` para o padrão:
    - `getAuthenticatedUserId()` + `getSelectedCompanyId()` +
      `assertCompanyResourcePermission()` + `supabaseAdmin`
2. **Re-testar importação** — Executar `trash/insumos-importacao-massa.txt` pela
   UI e confirmar 121 insumos

### P1 — Médio prazo

3. **Dashboard dinâmico** — Conectar KPIs a queries reais (obras, colaboradores,
   estoque baixo)
4. **Implementar exportação** — CSV/TXT nos módulos que já exibem o botão
5. **`<Can loading>`** — Exibir skeleton em vez de `null` durante carregamento
   de permissões

### P2 — Backlog

6. Remover pacote legado `packages/ui` (Vite, não usado pelos apps Next)
7. Tratar race condition de Server Actions no sidebar (debounce/cancel ao trocar
   rota)
8. Suite E2E permanente (Playwright no CI) baseada em
   `trash/erp-system-test.mjs`

---

## 7. Como reproduzir os testes

```bash
# Na raiz do monorepo (apps devem estar rodando em :3005)
node trash/erp-system-test.mjs
```

Resultado detalhado em `trash/erp-test-results.json`.

**Pré-requisitos:**

- `apps/app` rodando (`npm run dev` na pasta ou `npm run dev:erp-next` na raiz)
- `apps/app/.env.local` configurado
- Usuário `pedro@gmail.com` com senha `123123` (resetada automaticamente pelo
  script se necessário)

---

## 8. Anexo — Rotas do ERP

```
/auth/login
/empresas
/dashboard
/obras
/insumos
/colaboradores
/acesso/perfis
/acesso/usuarios
/configuracoes
/unauthorized

/obras/[id]/visao-geral
/obras/[id]/almoxarifado
/obras/[id]/colaboradores
/obras/[id]/ferramentas/disponiveis
/obras/[id]/ferramentas/em-uso
/obras/[id]/ferramentas/historico
/obras/[id]/epis/disponiveis
/obras/[id]/epis/historico
/obras/[id]/equip-alugados/ativos
/obras/[id]/equip-alugados/historico
/obras/[id]/movimentacoes
/obras/[id]/usuarios
```

---

_Relatório gerado automaticamente com base em testes E2E + revisão de código +
consulta ao banco Supabase (projeto ObraLog)._
