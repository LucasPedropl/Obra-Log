# ROPA — Registro de Operações de Tratamento (template)

**Controlador:** [Razão social da empresa cliente]  
**Operador técnico:** Supabase Inc. (PostgreSQL, Auth, Storage)  
**Sistema:** ObraLog ERP (`apps/app`)  
**Última revisão:** junho/2026

## Operações de tratamento

| Finalidade                      | Dados                                        | Base legal (Art. 7)                       | Titulares                | Retenção                       | Compartilhamento         |
| ------------------------------- | -------------------------------------------- | ----------------------------------------- | ------------------------ | ------------------------------ | ------------------------ |
| Gestão de colaboradores de obra | Nome, CPF, RG, contato, endereço, documentos | Execução de contrato / legítimo interesse | Colaboradores            | Até 5 anos após desligamento   | Supabase (processador)   |
| Contas de usuário do sistema    | E-mail, nome, perfil de acesso               | Execução de contrato                      | Usuários internos        | Vigência do contrato + 6 meses | Supabase Auth            |
| Operação de canteiro            | Movimentações, empréstimos, EPIs             | Execução de contrato                      | Colaboradores vinculados | 5 anos                         | Supabase                 |
| Documentos anexos               | RG, CNH, fotos de equipamentos               | Legítimo interesse / obrigação legal      | Colaboradores            | Conforme política de retenção  | Storage privado (bucket) |

## Medidas de segurança (Art. 32)

- RLS multi-tenant no PostgreSQL
- Cookies de tenant `httpOnly`
- Storage privado com signed URLs
- Mascaramento de CPF na UI

## Canal do titular

E-mail: privacidade@[dominio-empresa]  
Prazo de resposta: 15 dias (Art. 18, §3º)
