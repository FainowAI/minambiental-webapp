-- Migration: contract monitoring support tables
-- Descrição: Tabelas e enums para registrar análises, níveis ND/NE e leituras de hidrômetro/horímetro por contrato

-- 1. Enums auxiliares
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'periodo_medicao') THEN
    CREATE TYPE public.periodo_medicao AS ENUM ('seca', 'chuva');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_medidor') THEN
    CREATE TYPE public.tipo_medidor AS ENUM ('hidrometro', 'horimetro');
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS public.contrato_analises_fq (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id UUID NOT NULL REFERENCES public.contratos(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  responsavel_coleta TEXT,
  ind_profissional TEXT,
  laboratorio TEXT,
  data_entrada_laboratorio DATE,
  data_coleta DATE NOT NULL,
  hora_coleta TIME WITHOUT TIME ZONE,
  temperatura_ambiente NUMERIC(10,2),
  temperatura_amostra NUMERIC(10,2),
  condicoes_tempo TEXT,
  codigo_amostra TEXT,
  resultado_temperatura_agua NUMERIC(10,2),
  resultado_cor NUMERIC(10,2),
  resultado_turbidez NUMERIC(10,2),
  resultado_ph NUMERIC(10,2),
  observacoes TEXT,
  parametros_extras JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contrato_analises_fq_contrato_id ON public.contrato_analises_fq (contrato_id);
CREATE INDEX IF NOT EXISTS idx_contrato_analises_fq_created_by ON public.contrato_analises_fq (created_by);

ALTER TABLE public.contrato_analises_fq ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'contrato_analises_fq'
      AND policyname = 'Authenticated users can view contrato analyses'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Authenticated users can view contrato analyses"
        ON public.contrato_analises_fq
        FOR SELECT
        TO authenticated
        USING (true);
    $policy$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'contrato_analises_fq'
      AND policyname = 'Creators manage their contrato analyses'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Creators manage their contrato analyses"
        ON public.contrato_analises_fq
        FOR ALL
        TO authenticated
        USING (created_by = auth.uid())
        WITH CHECK (created_by = auth.uid());
    $policy$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'contrato_analises_fq'
      AND policyname = 'Admins and managers manage all contrato analyses'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Admins and managers manage all contrato analyses"
        ON public.contrato_analises_fq
        FOR ALL
        TO authenticated
        USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gestor'))
        WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gestor'));
    $policy$;
  END IF;
END$$;

COMMENT ON TABLE public.contrato_analises_fq IS 'Registros de análises físico-químicas vinculadas a contratos';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_contrato_analises_fq_updated_at'
  ) THEN
    EXECUTE $trigger$
      CREATE TRIGGER trg_contrato_analises_fq_updated_at
        BEFORE UPDATE ON public.contrato_analises_fq
        FOR EACH ROW
        EXECUTE FUNCTION public.update_updated_at_column();
    $trigger$;
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS public.contrato_nd_ne (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id UUID NOT NULL REFERENCES public.contratos(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  periodo periodo_medicao NOT NULL,
  data_medicao DATE,
  responsavel TEXT,
  nivel_estatico NUMERIC(10,2) NOT NULL,
  nivel_dinamico NUMERIC(10,2) NOT NULL,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT nd_maior_igual_ne CHECK (nivel_dinamico >= nivel_estatico)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_contrato_nd_ne_unique_periodo
  ON public.contrato_nd_ne (contrato_id, periodo, COALESCE(data_medicao, DATE '0001-01-01'));

CREATE INDEX IF NOT EXISTS idx_contrato_nd_ne_contrato_id ON public.contrato_nd_ne (contrato_id);
CREATE INDEX IF NOT EXISTS idx_contrato_nd_ne_created_by ON public.contrato_nd_ne (created_by);

ALTER TABLE public.contrato_nd_ne ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'contrato_nd_ne'
      AND policyname = 'Authenticated users can view contrato nd ne'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Authenticated users can view contrato nd ne"
        ON public.contrato_nd_ne
        FOR SELECT
        TO authenticated
        USING (true);
    $policy$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'contrato_nd_ne'
      AND policyname = 'Creators manage their contrato nd ne'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Creators manage their contrato nd ne"
        ON public.contrato_nd_ne
        FOR ALL
        TO authenticated
        USING (created_by = auth.uid())
        WITH CHECK (created_by = auth.uid());
    $policy$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'contrato_nd_ne'
      AND policyname = 'Admins and managers manage all contrato nd ne'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Admins and managers manage all contrato nd ne"
        ON public.contrato_nd_ne
        FOR ALL
        TO authenticated
        USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gestor'))
        WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gestor'));
    $policy$;
  END IF;
END$$;

COMMENT ON TABLE public.contrato_nd_ne IS 'Registros de níveis estático (NE) e dinâmico (ND) por período de medição';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_contrato_nd_ne_updated_at'
  ) THEN
    EXECUTE $trigger$
      CREATE TRIGGER trg_contrato_nd_ne_updated_at
        BEFORE UPDATE ON public.contrato_nd_ne
        FOR EACH ROW
        EXECUTE FUNCTION public.update_updated_at_column();
    $trigger$;
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS public.contrato_monitoramentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id UUID NOT NULL REFERENCES public.contratos(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  tipo tipo_medidor NOT NULL,
  referencia_ano SMALLINT NOT NULL,
  referencia_mes SMALLINT NOT NULL CHECK (referencia_mes BETWEEN 1 AND 12),
  data_leitura DATE NOT NULL,
  leitura_declarada NUMERIC(14,3),
  hora_declarada NUMERIC(14,3),
  leitura_apurada NUMERIC(14,3),
  hora_apurada NUMERIC(14,3),
  leitura_anterior NUMERIC(14,3),
  consumo NUMERIC(14,3),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT referencia_mes_ano_positive CHECK (referencia_ano BETWEEN 1900 AND 2100),
  CONSTRAINT contrato_monitoramentos_tipo_valores CHECK (
    (tipo = 'hidrometro' AND leitura_apurada IS NOT NULL AND (hora_apurada IS NULL OR hora_apurada >= 0))
    OR
    (tipo = 'horimetro' AND hora_apurada IS NOT NULL AND (leitura_apurada IS NULL OR leitura_apurada >= 0))
  )
);

CREATE INDEX IF NOT EXISTS idx_contrato_monitoramentos_contrato_id ON public.contrato_monitoramentos (contrato_id);
CREATE INDEX IF NOT EXISTS idx_contrato_monitoramentos_created_by ON public.contrato_monitoramentos (created_by);
CREATE INDEX IF NOT EXISTS idx_contrato_monitoramentos_referencia ON public.contrato_monitoramentos (referencia_ano, referencia_mes);
CREATE INDEX IF NOT EXISTS idx_contrato_monitoramentos_tipo ON public.contrato_monitoramentos (tipo);

ALTER TABLE public.contrato_monitoramentos ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'contrato_monitoramentos'
      AND policyname = 'Authenticated users can view contrato monitoramentos'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Authenticated users can view contrato monitoramentos"
        ON public.contrato_monitoramentos
        FOR SELECT
        TO authenticated
        USING (true);
    $policy$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'contrato_monitoramentos'
      AND policyname = 'Creators manage their contrato monitoramentos'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Creators manage their contrato monitoramentos"
        ON public.contrato_monitoramentos
        FOR ALL
        TO authenticated
        USING (created_by = auth.uid())
        WITH CHECK (created_by = auth.uid());
    $policy$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'contrato_monitoramentos'
      AND policyname = 'Admins and managers manage all contrato monitoramentos'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Admins and managers manage all contrato monitoramentos"
        ON public.contrato_monitoramentos
        FOR ALL
        TO authenticated
        USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gestor'))
        WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gestor'));
    $policy$;
  END IF;
END$$;

COMMENT ON TABLE public.contrato_monitoramentos IS 'Leituras mensais de hidrômetro e horímetro vinculadas a contratos';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_contrato_monitoramentos_updated_at'
  ) THEN
    EXECUTE $trigger$
      CREATE TRIGGER trg_contrato_monitoramentos_updated_at
        BEFORE UPDATE ON public.contrato_monitoramentos
        FOR EACH ROW
        EXECUTE FUNCTION public.update_updated_at_column();
    $trigger$;
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS public.contrato_monitoramento_imagens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  monitoramento_id UUID NOT NULL REFERENCES public.contrato_monitoramentos(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  arquivo_url TEXT NOT NULL,
  bucket_path TEXT NOT NULL,
  content_type TEXT,
  tamanho_bytes BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contrato_monitoramento_imagens_monitoramento_id ON public.contrato_monitoramento_imagens (monitoramento_id);
CREATE INDEX IF NOT EXISTS idx_contrato_monitoramento_imagens_created_by ON public.contrato_monitoramento_imagens (created_by);

ALTER TABLE public.contrato_monitoramento_imagens ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'contrato_monitoramento_imagens'
      AND policyname = 'Authenticated users can view contrato monitoramento imagens'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Authenticated users can view contrato monitoramento imagens"
        ON public.contrato_monitoramento_imagens
        FOR SELECT
        TO authenticated
        USING (true);
    $policy$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'contrato_monitoramento_imagens'
      AND policyname = 'Creators manage their contrato monitoramento imagens'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Creators manage their contrato monitoramento imagens"
        ON public.contrato_monitoramento_imagens
        FOR ALL
        TO authenticated
        USING (created_by = auth.uid())
        WITH CHECK (created_by = auth.uid());
    $policy$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'contrato_monitoramento_imagens'
      AND policyname = 'Admins and managers manage all contrato monitoramento imagens'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Admins and managers manage all contrato monitoramento imagens"
        ON public.contrato_monitoramento_imagens
        FOR ALL
        TO authenticated
        USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gestor'))
        WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gestor'));
    $policy$;
  END IF;
END$$;

COMMENT ON TABLE public.contrato_monitoramento_imagens IS 'Armazena imagens de evidência das leituras de hidrômetro/horímetro';

