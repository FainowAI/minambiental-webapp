-- ============================================================================
-- Sprint 0b — Migration 015: Drop de estruturas legacy
-- ============================================================================
-- 
-- ⚠️ MIGRATION IRREVERSÍVEL ⚠️
--
-- Esta migration só deve rodar APÓS:
--   1. prompt_02 ser executado (TS adaptado ao novo modelo)
--   2. Deploy do front em produção feito
--   3. Validação de 48h em produção sem erros
--   4. types.ts regenerado e commitado
--
-- O que é dropado:
--   A) Tabelas legacy vazias: monitoramentos, analises_agua, pessoas
--   B) Coluna usuarios.perfil (substituída por user_roles)
--   C) Coluna usuarios.senha_hash (autenticação só via auth.users)
--   D) Coluna usuarios.token_senha + token_expiracao (reset via Supabase Auth)
--   E) Coluna usuarios.contato_medicao_* (move para requerentes)
--   F) Coluna licencas.prioridade (descontinuada — item 18314199299)
--   G) Coluna user_roles.role + user_roles.user_id (substituídas por role_v2 + usuario_id)
--   H) Enum user_profile (substituído por app_role_v2)
--   I) Enum prioridade_licenca (não usado)
--   J) Renomear app_role_v2 → app_role (drop do antigo)
--   K) Funções legacy: is_corpo_tecnico_legacy, is_tecnico_legacy
-- ============================================================================

SET lock_timeout = '10s';
SET statement_timeout = '300s';

BEGIN;

-- ----------------------------------------------------------------------------
-- Pré-check: confirmar que nenhuma row "Requerente" ativa sobrou em usuarios
-- ----------------------------------------------------------------------------

DO $$
DECLARE
  requerentes_ativos_em_usuarios INT;
BEGIN
  SELECT COUNT(*) INTO requerentes_ativos_em_usuarios
  FROM public.usuarios
  WHERE perfil = 'Requerente' AND status = 'ativo';
  
  IF requerentes_ativos_em_usuarios > 0 THEN
    RAISE EXCEPTION 'ABORTANDO: ainda existem % Requerentes ativos em usuarios. Rodar 012 (backfill) antes.', requerentes_ativos_em_usuarios;
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- A) Tabelas legacy vazias
-- ----------------------------------------------------------------------------

DROP TABLE IF EXISTS public.monitoramentos CASCADE;
DROP TABLE IF EXISTS public.analises_agua CASCADE;
DROP TABLE IF EXISTS public.pessoas CASCADE;

-- profiles também é legacy (Lovable boilerplate, não usado pelo domínio)
-- Confirmar que está vazio ou com dados não-críticos antes de dropar
DO $$
DECLARE
  profiles_count INT;
BEGIN
  SELECT COUNT(*) INTO profiles_count FROM public.profiles;
  IF profiles_count > 0 THEN
    RAISE WARNING 'profiles tem % rows. Tabela é boilerplate Lovable, não usada pelo domínio. Mantendo por segurança — drop manual depois.', profiles_count;
  ELSE
    DROP TABLE public.profiles CASCADE;
    RAISE NOTICE 'profiles vazia — dropada.';
  END IF;
END $$;

-- ebook_submissions é landing page lead capture — manter ou dropar?
-- Mantemos por enquanto. Sem relação com o domínio principal.

-- ----------------------------------------------------------------------------
-- B-E) Colunas obsoletas de usuarios
-- ----------------------------------------------------------------------------

ALTER TABLE public.usuarios
  DROP COLUMN IF EXISTS perfil,
  DROP COLUMN IF EXISTS senha_hash,
  DROP COLUMN IF EXISTS token_senha,
  DROP COLUMN IF EXISTS token_expiracao,
  DROP COLUMN IF EXISTS contato_medicao_cpf,
  DROP COLUMN IF EXISTS contato_medicao_email,
  DROP COLUMN IF EXISTS contato_medicao_celular;

-- ----------------------------------------------------------------------------
-- F) Coluna licencas.prioridade — descontinuada
-- ----------------------------------------------------------------------------

ALTER TABLE public.licencas
  DROP COLUMN IF EXISTS prioridade;

-- ----------------------------------------------------------------------------
-- G) Limpar user_roles
-- ----------------------------------------------------------------------------

-- Drop UNIQUE constraint antiga se existir
ALTER TABLE public.user_roles
  DROP CONSTRAINT IF EXISTS user_roles_user_id_role_key;

-- Drop colunas antigas
ALTER TABLE public.user_roles
  DROP COLUMN IF EXISTS user_id,
  DROP COLUMN IF EXISTS role;

-- Renomear role_v2 → role
ALTER TABLE public.user_roles
  RENAME COLUMN role_v2 TO role;

-- Tornar NOT NULL agora que está populado
ALTER TABLE public.user_roles
  ALTER COLUMN role SET NOT NULL,
  ALTER COLUMN usuario_id SET NOT NULL;

-- Renomear constraint UNIQUE
ALTER TABLE public.user_roles
  DROP CONSTRAINT IF EXISTS user_roles_usuario_id_role_v2_key;
ALTER TABLE public.user_roles
  ADD CONSTRAINT user_roles_usuario_id_role_key UNIQUE (usuario_id, role);

-- ----------------------------------------------------------------------------
-- H) user_invitations: limpar coluna perfil legacy
-- ----------------------------------------------------------------------------

ALTER TABLE public.user_invitations
  DROP COLUMN IF EXISTS perfil;

ALTER TABLE public.user_invitations
  RENAME COLUMN role_v2 TO role;

ALTER TABLE public.user_invitations
  ALTER COLUMN role SET NOT NULL;

-- ----------------------------------------------------------------------------
-- I) Drop enum user_profile (não mais usado)
-- ----------------------------------------------------------------------------

DROP TYPE IF EXISTS public.user_profile CASCADE;

-- ----------------------------------------------------------------------------
-- J) Drop enum prioridade_licenca
-- ----------------------------------------------------------------------------

DROP TYPE IF EXISTS public.prioridade_licenca CASCADE;

-- ----------------------------------------------------------------------------
-- K) Renomear app_role_v2 → app_role
-- ----------------------------------------------------------------------------

-- Drop enum antigo
DROP TYPE IF EXISTS public.app_role CASCADE;

-- Renomear o novo
ALTER TYPE public.app_role_v2 RENAME TO app_role;

-- Recriar funções helper para usar nome final (sem v2)
DROP FUNCTION IF EXISTS public.has_role(UUID, app_role) CASCADE;
DROP FUNCTION IF EXISTS public.is_corpo_tecnico(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.is_tecnico(UUID) CASCADE;

CREATE OR REPLACE FUNCTION public.has_role(_auth_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_roles ur
    JOIN public.usuarios u ON u.id = ur.usuario_id
    WHERE u.auth_user_id = _auth_user_id
      AND ur.role = _role
      AND u.status = 'ativo'
      AND u.status_aprovacao = 'aprovado'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_corpo_tecnico(_auth_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_auth_user_id, 'corpo_tecnico'::public.app_role);
$$;

CREATE OR REPLACE FUNCTION public.is_tecnico(_auth_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_auth_user_id, 'tecnico'::public.app_role);
$$;

-- ----------------------------------------------------------------------------
-- L) Funções legacy
-- ----------------------------------------------------------------------------

-- Antes de dropar, garantir que nada as referencia (policies já foram migradas em 014)
DROP FUNCTION IF EXISTS public.is_corpo_tecnico_legacy(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.is_tecnico_legacy(UUID) CASCADE;

-- ----------------------------------------------------------------------------
-- M) Recriar view dashboard_licencas com schema correto
-- ----------------------------------------------------------------------------

CREATE OR REPLACE VIEW public.v_dashboard_licencas AS
SELECT 
  l.id,
  l.numero_licenca,
  r.id AS requerente_id,
  r.nome_razao_social AS requerente_nome,
  r.cpf_cnpj AS requerente_cpf_cnpj,
  fu.nome AS finalidade_uso,
  m.nome AS municipio,
  l.estado,
  l.data_inicio,
  l.data_fim,
  l.status,
  CASE
    WHEN l.data_fim < CURRENT_DATE THEN 'vencida'
    WHEN l.data_fim <= (CURRENT_DATE + INTERVAL '30 days') THEN 'proxima_vencimento'
    ELSE 'vigente'
  END AS situacao_vencimento,
  COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'ativo' AND c.deleted_at IS NULL) AS contratos_ativos,
  COUNT(DISTINCT cm.id) FILTER (WHERE cm.status = 'pendente') AS monitoramentos_pendentes
FROM public.licencas l
JOIN public.requerentes r ON l.requerente_id = r.id
LEFT JOIN public.ref_finalidades_uso fu ON l.finalidade_uso_id = fu.id
LEFT JOIN public.ref_municipios_ms m ON l.municipio_id = m.id
LEFT JOIN public.contratos c ON c.licenca_id = l.id AND c.deleted_at IS NULL
LEFT JOIN public.contrato_monitoramentos cm ON cm.contrato_id = c.id
WHERE l.deleted_at IS NULL
GROUP BY l.id, r.id, fu.id, m.id;

COMMENT ON VIEW public.v_dashboard_licencas IS
  'Dashboard de licenças com situação de vencimento e contagens de contratos/monitoramentos pendentes.';

-- ----------------------------------------------------------------------------
COMMIT;

DO $$ BEGIN
  RAISE NOTICE 'Migration 015 (drop legacy) concluída. Schema final está limpo.';
  RAISE NOTICE 'PRÓXIMO PASSO: regenerar src/integrations/supabase/types.ts e rodar prompt_03 (cleanup de código).';
END $$;
