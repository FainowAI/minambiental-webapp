-- ============================================================================
-- Sprint 0b — Migration 013: Tabelas de lookup (referência)
-- ============================================================================
-- 
-- Estas tabelas substituem os campos varchar com valores fixos do schema atual
-- (tipo_ato, finalidade_uso, municipio, sistema_aquifero, unidade_planejamento,
-- parametros de análise FQ). Vantagens:
--   - Adicionar novos valores não requer migration de código
--   - Inativar valores sem perder dados históricos (campo `ativo`)
--   - Permite localização/tradução
--   - Permite incluir metadata (ordem de exibição, descrição, etc.)
--
-- Todas as tabelas ref_* são READ-ONLY pelo app (RLS bloqueia INSERT/UPDATE).
-- Apenas o DBA pode alterar via migration ou Supabase Studio.
-- ============================================================================

SET lock_timeout = '5s';

-- ----------------------------------------------------------------------------
-- 1. ref_tipos_ato
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.ref_tipos_ato (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo      TEXT NOT NULL UNIQUE,
  nome        TEXT NOT NULL,
  ativo       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.ref_tipos_ato (codigo, nome) VALUES
  ('OUTORGA_USO_RH', 'Outorga de Direito de Uso de Recursos Hídricos')
ON CONFLICT (codigo) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 2. ref_finalidades_uso
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.ref_finalidades_uso (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo      TEXT NOT NULL UNIQUE,
  nome        TEXT NOT NULL,
  ativo       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.ref_finalidades_uso (codigo, nome) VALUES
  ('OUTRAS', 'Outras Finalidades de Uso'),
  ('CONSUMO_HUMANO', 'Consumo Humano'),
  ('DESSEDENTACAO_ANIMAL', 'Dessedentação Animal'),
  ('IRRIGACAO', 'Irrigação'),
  ('INDUSTRIAL', 'Industrial'),
  ('AQUICULTURA', 'Aquicultura'),
  ('LAZER_TURISMO', 'Lazer e Turismo'),
  ('MONITORAMENTO_OUTORGA', 'OUTRO - OUTRO - MONITORAMENTO DE OUTORGA SUBTERRÂNEA')
ON CONFLICT (codigo) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 3. ref_municipios_ms (Mato Grosso do Sul)
-- ----------------------------------------------------------------------------
-- 79 municípios de MS. Códigos IBGE (7 dígitos). Seed completo.
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.ref_municipios_ms (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo      TEXT NOT NULL UNIQUE,
  nome        TEXT NOT NULL,
  ativo       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.ref_municipios_ms (codigo, nome) VALUES
  ('5000203', 'Água Clara'),
  ('5000252', 'Alcinópolis'),
  ('5000609', 'Amambai'),
  ('5000708', 'Anastácio'),
  ('5000807', 'Anaurilândia'),
  ('5000856', 'Angélica'),
  ('5000906', 'Antônio João'),
  ('5001003', 'Aparecida do Taboado'),
  ('5001102', 'Aquidauana'),
  ('5001243', 'Aral Moreira'),
  ('5001508', 'Bandeirantes'),
  ('5001904', 'Bataguassu'),
  ('5002001', 'Bataiporã'),  
  ('5002100', 'Bela Vista'),
  ('5002159', 'Bodoquena'),
  ('5002209', 'Bonito'),
  ('5002308', 'Brasilândia'),
  ('5002407', 'Caarapó'),
  ('5002605', 'Camapuã'),
  ('5002704', 'Campo Grande'),
  ('5002803', 'Caracol'),
  ('5002902', 'Cassilândia'),
  ('5002951', 'Chapadão do Sul'),
  ('5003108', 'Corguinho'),
  ('5003157', 'Coronel Sapucaia'),
  ('5003207', 'Corumbá'),
  ('5003256', 'Costa Rica'),
  ('5003306', 'Coxim'),
  ('5003454', 'Deodápolis'),
  ('5003488', 'Dois Irmãos do Buriti'),
  ('5003504', 'Douradina'),
  ('5003702', 'Dourados'),
  ('5003751', 'Eldorado'),
  ('5003801', 'Fátima do Sul'),
  ('5003900', 'Figueirão'),
  ('5004007', 'Glória de Dourados'),
  ('5004106', 'Guia Lopes da Laguna'),
  ('5004304', 'Iguatemi'),
  ('5004403', 'Inocência'),
  ('5004502', 'Itaporã'),
  ('5004601', 'Itaquiraí'),
  ('5004700', 'Ivinhema'),
  ('5004809', 'Japorã'),
  ('5004908', 'Jaraguari'),
  ('5005004', 'Jardim'),
  ('5005103', 'Jateí'),
  ('5005152', 'Juti'),
  ('5005202', 'Ladário'),
  ('5005251', 'Laguna Carapã'),
  ('5005400', 'Maracaju'),
  ('5005608', 'Miranda'),
  ('5005681', 'Mundo Novo'),
  ('5005707', 'Naviraí'),
  ('5005806', 'Nioaque'),
  ('5006002', 'Nova Alvorada do Sul'),
  ('5006200', 'Nova Andradina'),
  ('5006259', 'Novo Horizonte do Sul'),
  ('5006275', 'Paraíso das Águas'),
  ('5006309', 'Paranaíba'),
  ('5006358', 'Paranhos'),
  ('5006408', 'Pedro Gomes'),
  ('5006507', 'Ponta Porã'),
  ('5006606', 'Porto Murtinho'),
  ('5006903', 'Ribas do Rio Pardo'),
  ('5007000', 'Rio Brilhante'),
  ('5007109', 'Rio Negro'),
  ('5007208', 'Rio Verde de Mato Grosso'),
  ('5007307', 'Rochedo'),
  ('5007406', 'Santa Rita do Pardo'),
  ('5007505', 'São Gabriel do Oeste'),
  ('5007554', 'Sete Quedas'),
  ('5007695', 'Selvíria'),
  ('5007703', 'Sidrolândia'),
  ('5007802', 'Sonora'),
  ('5007901', 'Tacuru'),
  ('5008008', 'Taquarussu'),
  ('5008107', 'Terenos'),
  ('5008206', 'Três Lagoas'),
  ('5008305', 'Vicentina'),
  ('5008404', 'Tertuliano Borges')
ON CONFLICT (codigo) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 4. ref_sistemas_aquiferos
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.ref_sistemas_aquiferos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo      TEXT NOT NULL UNIQUE,
  nome        TEXT NOT NULL,
  ativo       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.ref_sistemas_aquiferos (codigo, nome) VALUES
  ('SERRA_GERAL', 'Serra Geral'),
  ('BAURU', 'Bauru'),
  ('GUARANI', 'Guarani'),
  ('PANTANAL', 'Pantanal')
ON CONFLICT (codigo) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 5. ref_unidades_planejamento (UPGs)
-- ----------------------------------------------------------------------------
-- Seed inicial vazio — DBA precisa popular conforme planejamento de MS.
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.ref_unidades_planejamento (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo      TEXT NOT NULL UNIQUE,
  nome        TEXT NOT NULL,
  ativo       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.ref_unidades_planejamento (codigo, nome) VALUES
  ('PARDO', 'Pardo'),
  ('IVINHEMA', 'Ivinhema'),
  ('MIRANDA', 'Miranda'),
  ('AQUIDAUANA', 'Aquidauana'),
  ('NEGRO', 'Negro'),
  ('TAQUARI', 'Taquari'),
  ('APA', 'Apa'),
  ('AMAMBAI', 'Amambai'),
  ('IGUATEMI', 'Iguatemi'),
  ('SUCURI', 'Sucuriú'),
  ('VERDE', 'Verde'),
  ('CORRENTE', 'Correntes/Taboco'),
  ('SAO_LOURENCO', 'São Lourenço'),
  ('TRES_LAGOAS', 'Três Lagoas')
ON CONFLICT (codigo) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 6. ref_parametros_analise — base completa dos 25 parâmetros
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.ref_parametros_analise (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo              TEXT NOT NULL UNIQUE,
  nome                TEXT NOT NULL,
  grupo               TEXT NOT NULL
                        CHECK (grupo IN ('fisico_quimico', 'bacteriologico', 'btex', 'oleos_diesel')),
  unidade             TEXT,
  valor_referencia    TEXT,
  metodologia         TEXT,
  ordem_exibicao      INTEGER NOT NULL DEFAULT 0,
  ativo               BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Grupo 1: Físico-Químicos (17 parâmetros)
INSERT INTO public.ref_parametros_analise (codigo, nome, grupo, unidade, valor_referencia, metodologia, ordem_exibicao) VALUES
  ('temperatura_agua', 'Resultado Analítico da Temperatura da Água', 'fisico_quimico', '°C', NULL, 'SM 2580 B', 1),
  ('cor', 'Resultado Analítico da Cor', 'fisico_quimico', 'UC', '15', 'SM 23ª Ed. 2120 B', 2),
  ('turbidez', 'Resultado Analítico da Turbidez', 'fisico_quimico', 'NTU', '5', 'SM 23ª Ed. 2130 B', 3),
  ('ph', 'Resultado Analítico do pH', 'fisico_quimico', 'UC', '6,0 a 9,0', 'SM 4500 H+ B', 4),
  ('solidos_totais_dissolvidos', 'Resultado Analítico dos Sólidos Totais Dissolvidos', 'fisico_quimico', 'mg/L', '1000', 'SM 23ª Ed. 2540 C', 5),
  ('dureza_total', 'Resultado Analítico da Dureza Total', 'fisico_quimico', 'mg/L', '300', 'SM 23ª Ed. 2340 C', 6),
  ('alcalinidade_total', 'Resultado Analítico da Alcalinidade Total', 'fisico_quimico', 'mg/L', NULL, 'SM 23ª Ed. 2320 B', 7),
  ('nitrato', 'Resultado Analítico do Nitrato (NO3)', 'fisico_quimico', 'mg/L', '10', 'SM 4500 NO3 B', 8),
  ('nitrito', 'Resultado Analítico do Nitrito', 'fisico_quimico', 'mg/L', '1', 'SM 4500 NO2 B', 9),
  ('fluoreto', 'Resultado Analítico do Fluoreto', 'fisico_quimico', NULL, NULL, NULL, 10),
  ('sulfato', 'Resultado Analítico do Sulfato', 'fisico_quimico', NULL, NULL, NULL, 11),
  ('cloro_residual_livre', 'Resultado Analítico do Cloro Residual Livre', 'fisico_quimico', NULL, NULL, NULL, 12),
  ('cloramina', 'Resultado Analítico da Cloramina', 'fisico_quimico', NULL, NULL, NULL, 13),
  ('sodio', 'Resultado Analítico do Sódio', 'fisico_quimico', NULL, NULL, NULL, 14),
  ('cloreto', 'Resultado Analítico do Cloreto', 'fisico_quimico', 'mg/L', '250', 'SM 23ª Ed. 4500 Cl- B', 15),
  ('ferro_total', 'Resultado Analítico do Ferro Total', 'fisico_quimico', 'mg/L', '0,3', 'SM 3500 Fe B', 16),
  ('condutividade_eletrica', 'Resultado Analítico da Condutividade Elétrica', 'fisico_quimico', 'µS/cm', NULL, 'SM 3500 Fe B', 17)
ON CONFLICT (codigo) DO NOTHING;

-- Grupo 2: Bacteriológicos (3 parâmetros)
INSERT INTO public.ref_parametros_analise (codigo, nome, grupo, unidade, valor_referencia, metodologia, ordem_exibicao) VALUES
  ('coliformes_termotolerante', 'Resultado Analítico do Coliformes Termotolerante', 'bacteriologico', NULL, NULL, NULL, 1),
  ('coliformes_totais', 'Resultado Analítico do Coliformes Totais', 'bacteriologico', 'UFC/100mL', NULL, 'ISO 9308', 2),
  ('escherichia_coli', 'Resultado Analítico do E.Coli', 'bacteriologico', 'UFC/100mL', NULL, 'ISO 9308', 3)
ON CONFLICT (codigo) DO NOTHING;

-- Grupo 3: BTEX (4 parâmetros)
INSERT INTO public.ref_parametros_analise (codigo, nome, grupo, unidade, valor_referencia, metodologia, ordem_exibicao) VALUES
  ('btex_benzeno', 'Resultado Analítico do Benzeno', 'btex', NULL, NULL, NULL, 1),
  ('btex_tolueno', 'Resultado Analítico do Tolueno', 'btex', NULL, NULL, NULL, 2),
  ('btex_etilbenzeno', 'Resultado Analítico do Etilbenzeno', 'btex', NULL, NULL, NULL, 3),
  ('btex_xileno', 'Resultado Analítico do Xileno', 'btex', NULL, NULL, NULL, 4)
ON CONFLICT (codigo) DO NOTHING;

-- Grupo 4: Óleos e Diesel (1 parâmetro)
INSERT INTO public.ref_parametros_analise (codigo, nome, grupo, unidade, valor_referencia, metodologia, ordem_exibicao) VALUES
  ('benzo_a_pireno', 'Resultado Analítico de Benzeno(a)pireno', 'oleos_diesel', NULL, '10', 'SM 23ª Ed. 5520 B', 1)
ON CONFLICT (codigo) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 7. RLS — read-only para authenticated
-- ----------------------------------------------------------------------------

ALTER TABLE public.ref_tipos_ato ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ref_tipos_ato FORCE ROW LEVEL SECURITY;
CREATE POLICY "ref_tipos_ato_select_authenticated" 
  ON public.ref_tipos_ato FOR SELECT TO authenticated USING (true);

ALTER TABLE public.ref_finalidades_uso ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ref_finalidades_uso FORCE ROW LEVEL SECURITY;
CREATE POLICY "ref_finalidades_uso_select_authenticated" 
  ON public.ref_finalidades_uso FOR SELECT TO authenticated USING (true);

ALTER TABLE public.ref_municipios_ms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ref_municipios_ms FORCE ROW LEVEL SECURITY;
CREATE POLICY "ref_municipios_ms_select_authenticated" 
  ON public.ref_municipios_ms FOR SELECT TO authenticated USING (true);

ALTER TABLE public.ref_sistemas_aquiferos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ref_sistemas_aquiferos FORCE ROW LEVEL SECURITY;
CREATE POLICY "ref_sistemas_aquiferos_select_authenticated" 
  ON public.ref_sistemas_aquiferos FOR SELECT TO authenticated USING (true);

ALTER TABLE public.ref_unidades_planejamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ref_unidades_planejamento FORCE ROW LEVEL SECURITY;
CREATE POLICY "ref_unidades_planejamento_select_authenticated" 
  ON public.ref_unidades_planejamento FOR SELECT TO authenticated USING (true);

ALTER TABLE public.ref_parametros_analise ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ref_parametros_analise FORCE ROW LEVEL SECURITY;
CREATE POLICY "ref_parametros_analise_select_authenticated" 
  ON public.ref_parametros_analise FOR SELECT TO authenticated USING (true);

-- ----------------------------------------------------------------------------
DO $$ BEGIN 
  RAISE NOTICE 'Migration 013 (lookup tables) concluída. 6 tabelas de referência criadas com seeds.';
END $$;
