# Arquitetura e Engenharia: Sistema Obra-Log (ERP Multi-Tenant e Super-Admin)

## 1. Stack Tecnológica Oficial

* **Frontend:** Next.js (App Router), TypeScript.
* **Styling:** Tailwind CSS, Shadcn/UI (ou componentes baseados em `cva` e `cn`), Lucide Icons.
* **Forms / Validação:** `react-hook-form` + `zod`.
* **State / Fetch:** custom hooks com cache inteligente (`SWR` / `React Query`).
* **BaaS:** Supabase (tipagem estrita, RLS, Storage).

## 2. Arquitetura Limpa e Padrões

### Smart & Dumb Components

* **UI Components (Dumb):** apenas props, sem chamadas a APIs.
* **Pages (Smart):** gerenciam estado e invocam as lógicas inferiores.

### Custom Hooks Obrigatórios

* Nenhum componente visual faz fetch direto ao Supabase.
* Isolar chamadas em hooks, por exemplo: `useTasks()`, `useSupabase()`.

### Domain Driven Design

Organização dentro de `src/features/<modulo>/`:

* `/components`: UI específica do módulo.
* `/hooks`: lógica de negócio.
* `/services`: repositório de interação (Supabase client).
* `/schemas`: schemas do Zod e types.

## 3. Regras Absolutas (STRICT)

* **Proibição de `any`:** resolver tipagens ativamente. Utilizar DTOs (`z.infer<typeof schema>`). Se inevitável, usar `unknown` com type narrowing.
* **Tratamento de erros:** toda chamada async deve usar `try/catch` e expor os estados `error` e `isLoading` para a camada de UI.
* **Segurança Auth/RLS:** confiar exclusivamente nas policies de RLS do Supabase e no Auth JWT via client isolado.

## 4. Exigências de Fluxo

* **Inputs Select:** devem ser do tipo searchable (pesquisáveis). Componentizar isso se necessário.
* **Scripts temporários:** qualquer script JS criado para automação ou injeção de dados deve ser gerado dentro de `/trash/`.
* **Banco de dados:** migrações estruturais não são necessárias agora. Se precisar alterar tabelas, escrever o código SQL no chat para o usuário aplicar manualmente no painel web do Supabase.

## 5. Ponto de Partida (Contexto)

* **Obrigatório:** antes de planejar integrações ou definir schemas Zod, verificar as relações de tabelas lendo o arquivo `/docs/banco_atual.sql`.
