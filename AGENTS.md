# Obra-Log Agent Instructions

Welcome to the Obra-Log project. This is a SaaS system mapped into a
**Multi-Tenant ERP Management Panel** and an isolated **Super-Admin Panel**.

## Project Context

- **Stack**: Next.js (App Router), TypeScript, Tailwind CSS, Shadcn/UI,
  Supabase.
- **Monorepo Structure**:
    - `apps/app`: ERP Panel. Start with `npm run dev:erp-next`.
    - `apps/admin`: Super-Admin Panel. Start with `npm run dev:admin`.
    - `packages/ui`: Shared UI components.

## Core Directives

### 1. Architecture & Code Quality

- **Clean Architecture**: Use Smart (pages/logic) & Dumb (UI) components.
- **Data Fetching**: UI components **NEVER** fetch data directly. External logic
  must be isolated in hooks (e.g., `useTasks()`) and services.
- **Strict TypeScript**: The use of `any` is strictly forbidden. Create proper
  interfaces or use `z.infer<typeof schema>`. Use `unknown` with type narrowing
  if necessary.
- **Next.js Breaking Changes**: API and conventions may differ from typical
  training data. Always check `node_modules/next/dist/docs/` if unsure.
- **Temporary Files**: Place generated scripts in the `trash/` folder and delete
  them when done.

### 2. Database & Supabase (BaaS)

- **Domain IDs**:
    - `company_id`: Refers strictly to the Company (Tenant/Construtora).
    - `instance_id` / `site_id`: Refers strictly to the Work Site (Obra/Filial).
- **Auth Sync**: When deleting a user from `public.users` or a company, you
  **MUST** delete the user in Supabase Auth via
  `supabaseAdmin.auth.admin.deleteUser`.
- **Database Modifying**: The database schema is available at
  [docs/banco_atual.sql](docs/banco_atual.sql). Do not run remote migrations
  blindly; provide the raw SQL in chat for the user to run in the Supabase SQL
  Editor.

### 3. UI & Environment Gotchas

- **Toasts in ERP**: When using `useToast` in `apps/app`, ONLY use the
  signature: `addToast(message: string, type: 'success' | 'error' | 'info')`.
  Never pass an object.
- **Select Inputs**: All select inputs must be searchable.
- **Windows Environment**: The host OS is Windows. Never use Unix redirect
  writes (like `cat << EOF > file`). Use provided agent file-editing tools.
- **NPM & Tailwind v4**: Always stop running dev servers before running
  `npm install` or clearing `node_modules` to prevent `EPERM` (file lock)
  errors.
- **Dependencies**: NEVER run `npm audit fix --force`. Preserve the `overrides`
  section in the root `package.json` to ensure Next.js stability.

## References

For extended context and rules, consult:

- [Agent Rules (.agents/rules/obralog.md)](.agents/rules/obralog.md)
- [Legacy Instructions (.github/instructions/instructions.md)](.github/instructions/instructions.md)
