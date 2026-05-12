-- ============================================================================
-- Sprint 0b — Migration 010: Criar tabela requerentes
-- ============================================================================
-- 
-- Separa Requerentes dos funcionários (usuarios). Requerente NÃO acessa 
-- plataforma e tem dados específicos (contato de medição). 
--
-- Após esta migration: tabela EXISTE, sem dados. Migração de dados
-- vem na migration 012.
-- ============================================================================

SET lock_timeout = '5s';

-- ----------------------------------------------------------------------------
-- 1. Tabela requerentes
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.requerentes (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_pessoa                 TEXT NOT NULL DEFAULT 'PJ'
                                CHECK (tipo_pessoa IN ('PF', 'PJ')),
  cpf_cnpj                    TEXT NOT NULL UNIQUE
                                CHECK (cpf_cnpj ~ '^\d{11}$' OR cpf_cnpj ~ '^\d{14}$'),
  nome_razao_social           TEXT NOT NULL,
  email                       TEXT
                                CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  celular                     TEXT
                                CHECK (celular IS NULL OR celular ~ '^\d{10,11}$'),
  -- contato responsável pela medição (pode ser pessoa diferente)
  contato_medicao_nome        TEXT,
  contato_medicao_cpf         TEXT
                                CHECK (contato_medicao_cpf IS NULL OR contato_medicao_cpf ~ '^\d{11}$'),
  contato_medicao_email       TEXT
                                CHECK (contato_medicao_email IS NULL OR contato_medicao_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  contato_medicao_celular     TEXT
                                CHECK (contato_medicao_celular IS NULL OR contato_medicao_celular ~ '^\d{10,11}$'),
  status                      TEXT NOT NULL DEFAULT 'ativo'
                                CHECK (status IN ('ativo', 'inativo')),
  -- audit
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by                  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by                  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  deleted_at                  TIMESTAMPTZ
);

COMMENT ON TABLE public.requerentes IS
  'Clientes da Mina Ambiental. Pessoa Física ou Jurídica titular da outorga (licença). NÃO acessa a plataforma — interage via chatbot WhatsApp identificado por CPF/CNPJ.';

COMMENT ON COLUMN public.requerentes.contato_medicao_cpf IS
  'CPF do responsável operacional pela medição mensal (pode ser pessoa diferente do Requerente). Usado para identificar quem envia leitura via chatbot.';

-- ----------------------------------------------------------------------------
-- 2. Indexes
-- ----------------------------------------------------------------------------

CREATE INDEX idx_requerentes_cpf_cnpj 
  ON public.requerentes(cpf_cnpj) 
  WHERE deleted_at IS NULL;

CREATE INDEX idx_requerentes_status 
  ON public.requerentes(status) 
  WHERE deleted_at IS NULL;

CREATE INDEX idx_requerentes_nome 
  ON public.requerentes(nome_razao_social) 
  WHERE deleted_at IS NULL;

-- ----------------------------------------------------------------------------
-- 3. Trigger updated_at
-- ----------------------------------------------------------------------------

CREATE TRIGGER trg_requerentes_updated_at
  BEFORE UPDATE ON public.requerentes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ----------------------------------------------------------------------------
-- 4. Habilitar RLS (policies definitivas vêm na migration 014)
-- ----------------------------------------------------------------------------

ALTER TABLE public.requerentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requerentes FORCE ROW LEVEL SECURITY;

-- Policy provisória: só Corpo Técnico até a migration 014 (que usa has_role definitivo)
CREATE POLICY "requerentes_select_corpo_tecnico_provisorio"
  ON public.requerentes FOR SELECT
  TO authenticated
  USING (
    public.is_corpo_tecnico_legacy((SELECT auth.uid()))
    OR public.is_tecnico_legacy((SELECT auth.uid()))
  );

CREATE POLICY "requerentes_insert_corpo_tecnico_provisorio"
  ON public.requerentes FOR INSERT
  TO authenticated
  WITH CHECK (public.is_corpo_tecnico_legacy((SELECT auth.uid())));

CREATE POLICY "requerentes_update_corpo_tecnico_provisorio"
  ON public.requerentes FOR UPDATE
  TO authenticated
  USING (public.is_corpo_tecnico_legacy((SELECT auth.uid())))
  WITH CHECK (public.is_corpo_tecnico_legacy((SELECT auth.uid())));

CREATE POLICY "requerentes_delete_corpo_tecnico_provisorio"
  ON public.requerentes FOR DELETE
  TO authenticated
  USING (public.is_corpo_tecnico_legacy((SELECT auth.uid())));

-- ----------------------------------------------------------------------------
DO $$ BEGIN 
  RAISE NOTICE 'Migration 010 (criar requerentes) concluída.';
END $$;
