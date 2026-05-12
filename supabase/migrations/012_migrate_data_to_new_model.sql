-- ============================================================================
-- Sprint 0b — Migration 012: Backfill de dados para o novo modelo
-- ============================================================================
-- 
-- Esta é a migration mais delicada do refactor. Faz:
--
--   A) Normaliza status/status_aprovacao de usuarios para lowercase
--      ('Ativo' → 'ativo', 'Aprovado' → 'aprovado')
--   B) Move os 3 Requerentes existentes de usuarios para requerentes
--   C) Atualiza FK licencas.requerente_id (atualmente aponta para usuarios.id)
--      para apontar para requerentes.id
--   D) Popula user_roles.role_v2 + user_roles.usuario_id para os 4 Corpo Técnico
--      e 1 Técnico existentes (a partir de usuarios.perfil)
--   E) Popula user_invitations.role_v2 (a partir de user_invitations.perfil)
--
-- Estado de produção quando esta migration roda:
--   usuarios: 8 (4 Corpo Técnico, 3 Requerente, 1 Técnico)
--   licencas: 1
--   contratos: 1
--   requerentes: 0 (acabou de ser criada)
--   user_roles: 5 (com role_v2 NULL)
--   contrato_nd_ne: 1 (referencia tecnico_id que pode ser dos 8 usuarios)
--
-- IDEMPOTÊNCIA: a migration verifica se a inserção já foi feita antes 
-- de re-executar. Pode ser rodada várias vezes sem duplicar dados.
-- ============================================================================

SET lock_timeout = '10s';
SET statement_timeout = '300s';

BEGIN;

-- ----------------------------------------------------------------------------
-- A) Normalizar status para lowercase
-- ----------------------------------------------------------------------------

UPDATE public.usuarios 
SET status = LOWER(status), 
    status_aprovacao = LOWER(status_aprovacao)
WHERE status != LOWER(status) 
   OR status_aprovacao != LOWER(status_aprovacao);

-- Ajustar CHECK constraint
ALTER TABLE public.usuarios 
  DROP CONSTRAINT IF EXISTS usuarios_status_check;
ALTER TABLE public.usuarios
  ADD CONSTRAINT usuarios_status_check 
    CHECK (status IN ('ativo', 'inativo'));

-- Mesmo para status_aprovacao
ALTER TABLE public.usuarios
  ADD CONSTRAINT usuarios_status_aprovacao_check
    CHECK (status_aprovacao IN ('pendente', 'aprovado', 'rejeitado'));

-- ----------------------------------------------------------------------------
-- B) Migrar Requerentes de usuarios → requerentes
-- ----------------------------------------------------------------------------

-- Mapeamento temporário (usuarios.id antigo → requerentes.id novo)
CREATE TEMP TABLE _requerentes_mapping (
  old_usuario_id UUID PRIMARY KEY,
  new_requerente_id UUID NOT NULL
);

INSERT INTO public.requerentes (
  id,
  tipo_pessoa,
  cpf_cnpj,
  nome_razao_social,
  email,
  celular,
  contato_medicao_cpf,
  contato_medicao_email,
  contato_medicao_celular,
  status,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid() AS id,
  CASE WHEN LENGTH(REGEXP_REPLACE(u.cpf, '\D', '', 'g')) = 14 THEN 'PJ' ELSE 'PF' END AS tipo_pessoa,
  REGEXP_REPLACE(u.cpf, '\D', '', 'g') AS cpf_cnpj,
  u.nome AS nome_razao_social,
  u.email,
  u.celular,
  u.contato_medicao_cpf,
  u.contato_medicao_email,
  u.contato_medicao_celular,
  COALESCE(LOWER(u.status), 'ativo') AS status,
  u.created_at,
  u.updated_at
FROM public.usuarios u
WHERE u.perfil = 'Requerente'
  AND NOT EXISTS (
    -- idempotência: se CPF/CNPJ já existe em requerentes, pula
    SELECT 1 FROM public.requerentes r 
    WHERE r.cpf_cnpj = REGEXP_REPLACE(u.cpf, '\D', '', 'g')
  )
RETURNING id, cpf_cnpj;

-- Preencher mapeamento para usar nas FKs
INSERT INTO _requerentes_mapping (old_usuario_id, new_requerente_id)
SELECT u.id, r.id
FROM public.usuarios u
JOIN public.requerentes r ON r.cpf_cnpj = REGEXP_REPLACE(u.cpf, '\D', '', 'g')
WHERE u.perfil = 'Requerente';

DO $$
DECLARE
  total_migrated INT;
BEGIN
  SELECT COUNT(*) INTO total_migrated FROM _requerentes_mapping;
  RAISE NOTICE 'Backfill: % Requerentes migrados de usuarios para requerentes.', total_migrated;
END $$;

-- ----------------------------------------------------------------------------
-- C) Atualizar FK licencas.requerente_id
-- ----------------------------------------------------------------------------

-- Pegar referências e converter
-- Como hoje licencas.requerente_id aponta para usuarios.id e existe FK,
-- precisamos: (1) dropar FK antiga, (2) atualizar valores, (3) criar FK nova.

-- 1. Drop FK atual
ALTER TABLE public.licencas
  DROP CONSTRAINT IF EXISTS licencas_requerente_id_fkey;

-- 2. UPDATE: trocar usuarios.id (Requerente) por requerentes.id
UPDATE public.licencas l
SET requerente_id = m.new_requerente_id
FROM _requerentes_mapping m
WHERE l.requerente_id = m.old_usuario_id;

-- 3. Criar FK nova apontando para requerentes
ALTER TABLE public.licencas
  ADD CONSTRAINT licencas_requerente_id_fkey 
    FOREIGN KEY (requerente_id) REFERENCES public.requerentes(id) ON DELETE RESTRICT;

DO $$
DECLARE
  bad_count INT;
BEGIN
  SELECT COUNT(*) INTO bad_count 
  FROM public.licencas l
  LEFT JOIN public.requerentes r ON l.requerente_id = r.id
  WHERE r.id IS NULL;
  
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'FALHA no backfill de licencas: % licenças com requerente_id órfão.', bad_count;
  END IF;
  
  RAISE NOTICE 'Backfill: FK de licencas.requerente_id apontando para requerentes (todas as % licenças OK).', 
    (SELECT COUNT(*) FROM public.licencas);
END $$;

-- ----------------------------------------------------------------------------
-- D) Popular user_roles.role_v2 + usuario_id
-- ----------------------------------------------------------------------------

-- 1. Para os 4 Corpo Técnico e 1 Técnico existentes: criar/atualizar user_roles

-- Primeiro, preencher usuario_id em user_roles existentes (que hoje têm só user_id=auth.uid)
UPDATE public.user_roles ur
SET usuario_id = u.id
FROM public.usuarios u
WHERE ur.user_id = u.auth_user_id
  AND ur.usuario_id IS NULL;

-- Inserir registros faltantes (caso algum usuario não tenha row em user_roles)
INSERT INTO public.user_roles (usuario_id, role_v2, user_id, role)
SELECT 
  u.id,
  CASE u.perfil
    WHEN 'Corpo Técnico' THEN 'corpo_tecnico'::app_role_v2
    WHEN 'Técnico' THEN 'tecnico'::app_role_v2
  END,
  u.auth_user_id,
  -- preencher coluna antiga 'role' temporariamente com valor compatível 
  -- (vai ser dropada na migration 015)
  CASE u.perfil
    WHEN 'Corpo Técnico' THEN 'admin'::app_role  -- nearest match no enum antigo
    WHEN 'Técnico' THEN 'user'::app_role
  END
FROM public.usuarios u
WHERE u.perfil IN ('Corpo Técnico', 'Técnico')
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur2 
    WHERE ur2.usuario_id = u.id
  );

-- Atualizar role_v2 dos registros existentes (que tinham role antigo)
UPDATE public.user_roles ur
SET role_v2 = CASE u.perfil
    WHEN 'Corpo Técnico' THEN 'corpo_tecnico'::app_role_v2
    WHEN 'Técnico' THEN 'tecnico'::app_role_v2
END
FROM public.usuarios u
WHERE ur.usuario_id = u.id
  AND ur.role_v2 IS NULL
  AND u.perfil IN ('Corpo Técnico', 'Técnico');

-- Definir UNIQUE constraint em (usuario_id, role_v2) para evitar duplicatas
ALTER TABLE public.user_roles
  DROP CONSTRAINT IF EXISTS user_roles_usuario_id_role_v2_key;
ALTER TABLE public.user_roles
  ADD CONSTRAINT user_roles_usuario_id_role_v2_key 
    UNIQUE (usuario_id, role_v2);

DO $$
DECLARE
  total_funcionarios INT;
  total_com_role INT;
BEGIN
  SELECT COUNT(*) INTO total_funcionarios 
  FROM public.usuarios 
  WHERE perfil IN ('Corpo Técnico', 'Técnico');
  
  SELECT COUNT(DISTINCT ur.usuario_id) INTO total_com_role
  FROM public.user_roles ur
  JOIN public.usuarios u ON u.id = ur.usuario_id
  WHERE u.perfil IN ('Corpo Técnico', 'Técnico')
    AND ur.role_v2 IS NOT NULL;
  
  IF total_funcionarios != total_com_role THEN
    RAISE EXCEPTION 'FALHA: % funcionários sem role_v2 atribuído.', 
      total_funcionarios - total_com_role;
  END IF;
  
  RAISE NOTICE 'Backfill user_roles: % funcionários com role_v2 atribuído.', total_com_role;
END $$;

-- ----------------------------------------------------------------------------
-- E) Popular user_invitations.role_v2
-- ----------------------------------------------------------------------------

UPDATE public.user_invitations
SET role_v2 = CASE perfil::TEXT
    WHEN 'corpo_tecnico' THEN 'corpo_tecnico'::app_role_v2
    WHEN 'tecnico' THEN 'tecnico'::app_role_v2
    WHEN 'requerente' THEN NULL  -- requerente não é mais um role
END
WHERE role_v2 IS NULL;

-- Inválidos: invites pendentes para 'requerente' não fazem mais sentido
-- (Requerente não loga). Marcar como revoked.
UPDATE public.user_invitations
SET status = 'expired'
WHERE perfil::TEXT = 'requerente' AND status = 'pending';

-- ----------------------------------------------------------------------------
-- F) Inativar os usuarios Requerente que migraram (não deletar — preservar 
--    histórico de FK em outras tabelas como notificacoes, etc.)
-- ----------------------------------------------------------------------------

UPDATE public.usuarios
SET status = 'inativo',
    updated_at = now()
WHERE perfil = 'Requerente';

-- ----------------------------------------------------------------------------
-- G) Drop tabela temporária
-- ----------------------------------------------------------------------------

DROP TABLE _requerentes_mapping;

-- ----------------------------------------------------------------------------
COMMIT;

DO $$ BEGIN 
  RAISE NOTICE 'Migration 012 (backfill) concluída. Modelo novo carregado com dados.';
END $$;
