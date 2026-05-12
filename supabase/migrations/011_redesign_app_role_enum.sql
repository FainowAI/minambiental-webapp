-- ============================================================================
-- Sprint 0b — Migration 011: Redesign do enum app_role + helpers (v3 - final)
-- ============================================================================
-- 
-- Hoje:
--   enum public.app_role = ('admin', 'user', 'gestor') ← legado Lovable, fora do domínio
--   coluna usuarios.perfil varchar com CHECK = ('Corpo Técnico','Técnico','Administrador','Requerente')
--   enum public.user_profile = ('corpo_tecnico','tecnico','requerente') ← usado em user_invitations
--   função has_role(uuid, app_role) ← legada, usa enum antigo
--   função is_corpo_tecnico(uuid) ← legada, usa usuarios.perfil
--
-- Depois:
--   enum public.app_role_v2 = ('corpo_tecnico', 'tecnico') (renomeado para app_role na 015)
--   Requerente NÃO é mais role (vive em requerentes)
--   user_invitations.perfil migra para app_role_v2
--   has_role/is_corpo_tecnico/is_tecnico recriadas com nova lógica
--
-- HISTÓRICO DE REVISÕES:
-- v1: falhou — ordem CREATE FUNCTION antes do ADD COLUMN
-- v2: corrigiu ordem mas conflitava com funções legacy Lovable (mesmo nome)
-- v3: drop explícito das funções legacy, mantém policies que dependem delas
-- ============================================================================

SET lock_timeout = '5s';
SET statement_timeout = '120s';

-- ----------------------------------------------------------------------------
-- 1. Criar enum novo (idempotente)
-- ----------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role_v2') THEN
    CREATE TYPE public.app_role_v2 AS ENUM ('corpo_tecnico', 'tecnico');
  END IF;
END $$;

COMMENT ON TYPE public.app_role_v2 IS
  'Roles dos funcionários da Mina Ambiental. Requerente NÃO é role — vive na tabela requerentes.';

-- ----------------------------------------------------------------------------
-- 2. Adicionar colunas em user_roles (antes das funções que as usam)
-- ----------------------------------------------------------------------------

ALTER TABLE public.user_roles
  ADD COLUMN IF NOT EXISTS role_v2 app_role_v2,
  ADD COLUMN IF NOT EXISTS usuario_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE;

-- ----------------------------------------------------------------------------
-- 3. Adicionar coluna em user_invitations
-- ----------------------------------------------------------------------------

ALTER TABLE public.user_invitations
  ADD COLUMN IF NOT EXISTS role_v2 app_role_v2;

-- ----------------------------------------------------------------------------
-- 4. Identificar dependências das funções legacy ANTES de dropar
-- ----------------------------------------------------------------------------
-- 
-- As funções legacy (has_role com app_role antigo, is_corpo_tecnico com
-- usuarios.perfil) podem estar sendo usadas em policies RLS de várias tabelas.
-- Antes de dropar precisamos saber quem depende delas. Logamos para
-- inspeção, mas o CASCADE no DROP cuida das policies.
-- 
-- IMPORTANTE: as policies do Sprint 0a usam is_corpo_tecnico_legacy
-- (sufixo _legacy), então elas NÃO são afetadas pelo drop abaixo. Policies
-- que possam depender da is_corpo_tecnico (sem sufixo) são pré-Sprint 0a
-- e devem ser recriadas pelo Sprint 0a/0b (ver 014).
-- ----------------------------------------------------------------------------

DO $$
DECLARE
  dep_count INT;
  dep_record RECORD;
BEGIN
  -- Listar policies que referenciam is_corpo_tecnico (sem sufixo _legacy)
  SELECT COUNT(*) INTO dep_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND (qual LIKE '%is_corpo_tecnico(%' OR with_check LIKE '%is_corpo_tecnico(%')
    AND qual NOT LIKE '%is_corpo_tecnico_legacy%'
    AND with_check NOT LIKE '%is_corpo_tecnico_legacy%';
  
  IF dep_count > 0 THEN
    RAISE NOTICE 'Encontradas % policies que dependem da função is_corpo_tecnico legacy. Serão dropadas pelo CASCADE e devem ser recriadas em 014.', dep_count;
    
    FOR dep_record IN 
      SELECT schemaname, tablename, policyname 
      FROM pg_policies
      WHERE schemaname = 'public'
        AND (qual LIKE '%is_corpo_tecnico(%' OR with_check LIKE '%is_corpo_tecnico(%')
        AND qual NOT LIKE '%is_corpo_tecnico_legacy%'
    LOOP
      RAISE NOTICE '  - %.%: %', dep_record.schemaname, dep_record.tablename, dep_record.policyname;
    END LOOP;
  END IF;
  
  -- Listar policies que referenciam has_role(uuid, app_role) legacy
  SELECT COUNT(*) INTO dep_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND (qual LIKE '%has_role(%' OR with_check LIKE '%has_role(%');
  
  IF dep_count > 0 THEN
    RAISE NOTICE 'Encontradas % policies que dependem de has_role legacy. Serão dropadas pelo CASCADE.', dep_count;
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 5. Drop das funções legacy (CASCADE para limpar policies dependentes)
-- ----------------------------------------------------------------------------

DROP FUNCTION IF EXISTS public.is_corpo_tecnico(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.is_tecnico(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.has_role(UUID, app_role) CASCADE;

-- ----------------------------------------------------------------------------
-- 6. Helpers definitivos (com schema novo)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.has_role(_auth_user_id UUID, _role app_role_v2)
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
      AND ur.role_v2 = _role
      AND u.status = 'ativo'
      AND u.status_aprovacao = 'aprovado'
  );
$$;

COMMENT ON FUNCTION public.has_role(UUID, app_role_v2) IS
  'Substitui as funções legacy. Single source of truth para autorização baseada em user_roles.role_v2.';

CREATE OR REPLACE FUNCTION public.is_corpo_tecnico(_auth_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_auth_user_id, 'corpo_tecnico'::app_role_v2);
$$;

CREATE OR REPLACE FUNCTION public.is_tecnico(_auth_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_auth_user_id, 'tecnico'::app_role_v2);
$$;

CREATE OR REPLACE FUNCTION public.current_usuario_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.usuarios
  WHERE auth_user_id = auth.uid()
    AND status = 'ativo'
    AND status_aprovacao = 'aprovado'
  LIMIT 1;
$$;

-- ----------------------------------------------------------------------------
-- 7. Verificação
-- ----------------------------------------------------------------------------

DO $$
DECLARE
  has_role_v2_col BOOLEAN;
  has_usuario_id_col BOOLEAN;
  has_role_fn_v2 BOOLEAN;
  has_role_fn_legacy BOOLEAN;
BEGIN
  -- Colunas
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'user_roles' AND column_name = 'role_v2'
  ) INTO has_role_v2_col;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'user_roles' AND column_name = 'usuario_id'
  ) INTO has_usuario_id_col;
  
  -- Função has_role com signature nova (uuid, app_role_v2)
  SELECT EXISTS (
    SELECT 1 FROM pg_proc p 
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' 
      AND p.proname = 'has_role'
      AND pg_get_function_identity_arguments(p.oid) LIKE '%app_role_v2%'
  ) INTO has_role_fn_v2;
  
  -- Função has_role com signature antiga (uuid, app_role) — não deve existir mais
  SELECT EXISTS (
    SELECT 1 FROM pg_proc p 
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' 
      AND p.proname = 'has_role'
      AND pg_get_function_identity_arguments(p.oid) LIKE '%app_role)%'
      AND pg_get_function_identity_arguments(p.oid) NOT LIKE '%app_role_v2%'
  ) INTO has_role_fn_legacy;
  
  IF NOT has_role_v2_col OR NOT has_usuario_id_col THEN
    RAISE EXCEPTION 'FALHA: colunas role_v2 ou usuario_id não foram criadas em user_roles.';
  END IF;
  
  IF NOT has_role_fn_v2 THEN
    RAISE EXCEPTION 'FALHA: função has_role(uuid, app_role_v2) não existe.';
  END IF;
  
  IF has_role_fn_legacy THEN
    RAISE WARNING 'Função has_role(uuid, app_role) legacy ainda existe — drop não pegou.';
  END IF;
  
  RAISE NOTICE 'Migration 011 v3 concluída com sucesso.';
  RAISE NOTICE 'Estado: enum app_role_v2 criado, colunas adicionadas, helpers novos prontos.';
  RAISE NOTICE 'Próximo passo: rodar 012 para popular role_v2 com base nos dados existentes.';
END $$;
