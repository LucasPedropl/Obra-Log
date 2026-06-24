# Playbook de Resposta a Incidentes (LGPD Art. 33)

## Classificação

| Nível   | Critério                              | Prazo comunicação ANPD |
| ------- | ------------------------------------- | ---------------------- |
| Crítico | Vazamento de CPF/documentos em escala | 72h úteis              |
| Alto    | Acesso cross-tenant confirmado        | Avaliar comunicação    |
| Médio   | Tentativa bloqueada por RLS           | Registro interno       |

## Passos

1. **Contenção** — revogar chaves comprometidas, pausar feature afetada
2. **Diagnóstico** — logs Supabase, diff de políticas RLS, escopo de titulares
3. **Notificação** — ANPD + titulares se risco relevante (Art. 48)
4. **Remediação** — migration/código, testes de regressão
5. **Lições aprendidas** — atualizar ROPA e auditoria

## Contatos

- Encarregado (DPO): [a definir]
- Supabase Support: dashboard → support (incidentes de infra)
