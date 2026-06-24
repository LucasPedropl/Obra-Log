# Política de Retenção e Descarte de Dados

## Prazos

| Categoria                | Retenção ativa  | Após término                                   |
| ------------------------ | --------------- | ---------------------------------------------- |
| Colaborador ativo        | Durante vínculo | Anonimização via `anonymizeCollaboratorAction` |
| Colaborador inativo      | 5 anos          | Purge documentos Storage + anonimização DB     |
| Logs de aplicação        | 90 dias         | Descarte automático                            |
| Conta de usuário inativa | 12 meses        | Desativação; exclusão sob solicitação          |

## Procedimento de anonimização

1. Executar `anonymizeCollaboratorAction` (remove PII, status `ANONYMIZED`)
2. Remover arquivos em `collaborator-documents/{companyId}/`
3. Registrar data da operação no ROPA

## Revisão

Revisar esta política anualmente ou quando houver mudança regulatória.
