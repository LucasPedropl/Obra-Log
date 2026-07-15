-- Pagamento: dados bancários e Pix do colaborador
ALTER TABLE public.collaborators
  ADD COLUMN IF NOT EXISTS bank_name text,
  ADD COLUMN IF NOT EXISTS pix_key text,
  ADD COLUMN IF NOT EXISTS pix_key_type text;

ALTER TABLE public.collaborators
  DROP CONSTRAINT IF EXISTS collaborators_pix_key_type_check;

ALTER TABLE public.collaborators
  ADD CONSTRAINT collaborators_pix_key_type_check
  CHECK (
    pix_key_type IS NULL
    OR pix_key_type IN ('CPF', 'CELULAR', 'EMAIL', 'ALEATORIA')
  );

COMMENT ON COLUMN public.collaborators.bank_name IS 'Nome do banco para pagamento (ex: Caixa Econômica Federal)';
COMMENT ON COLUMN public.collaborators.pix_key IS 'Chave Pix do colaborador';
COMMENT ON COLUMN public.collaborators.pix_key_type IS 'Tipo da chave Pix: CPF, CELULAR, EMAIL ou ALEATORIA';
