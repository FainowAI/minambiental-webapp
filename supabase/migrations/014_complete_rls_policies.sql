-- ============================================================================
-- Sprint 0b — Migration 014: Policies RLS definitivas
-- ============================================================================
-- 
-- Substitui as policies provisórias do Sprint 0a (que usavam 
-- is_corpo_tecnico_legacy baseado em usuarios.perfil) pelas definitivas
-- (que usam has_role baseado em user_roles.role_v2).
--
-- Esta migration NÃO dropa is_corpo_tecnico_legacy() ainda — só substitui
-- o uso nas policies. O drop final é em 015.
-- ============================================================================

SET lock_timeout = '5s';
SET statement_timeout = '120s';

-- ----------------------------------------------------------------------------
-- usuarios
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "usuarios_select_corpo_tecnico_or_self" ON public.usuarios;
DROP POLICY IF EXISTS "usuarios_insert_blocked" ON public.usuarios;
DROP POLICY IF EXISTS "usuarios_update_corpo_tecnico" ON public.usuarios;
DROP POLICY IF EXISTS "usuarios_update_self_basic_fields" ON public.usuarios;
DROP POLICY IF EXISTS "usuarios_delete_blocked" ON public.usuarios;

CREATE POLICY "usuarios_select" ON public.usuarios FOR SELECT TO authenticated
  USING (
    public.is_corpo_tecnico((SELECT auth.uid()))
    OR auth_user_id = (SELECT auth.uid())
  );

CREATE POLICY "usuarios_insert_blocked" ON public.usuarios FOR INSERT TO authenticated
  WITH CHECK (false);  -- só via edge function

CREATE POLICY "usuarios_update_corpo_tecnico" ON public.usuarios FOR UPDATE TO authenticated
  USING (public.is_corpo_tecnico((SELECT auth.uid())))
  WITH CHECK (public.is_corpo_tecnico((SELECT auth.uid())));

CREATE POLICY "usuarios_update_self_basic" ON public.usuarios FOR UPDATE TO authenticated
  USING (auth_user_id = (SELECT auth.uid()))
  WITH CHECK (auth_user_id = (SELECT auth.uid()));

CREATE POLICY "usuarios_delete_blocked" ON public.usuarios FOR DELETE TO authenticated
  USING (false);

-- ----------------------------------------------------------------------------
-- user_roles
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "user_roles_select_corpo_tecnico_or_self" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_insert_corpo_tecnico" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_update_corpo_tecnico" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_delete_corpo_tecnico" ON public.user_roles;

CREATE POLICY "user_roles_select" ON public.user_roles FOR SELECT TO authenticated
  USING (
    public.is_corpo_tecnico((SELECT auth.uid()))
    OR usuario_id = public.current_usuario_id()
  );

CREATE POLICY "user_roles_insert" ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.is_corpo_tecnico((SELECT auth.uid())));

CREATE POLICY "user_roles_update" ON public.user_roles FOR UPDATE TO authenticated
  USING (public.is_corpo_tecnico((SELECT auth.uid())))
  WITH CHECK (public.is_corpo_tecnico((SELECT auth.uid())));

CREATE POLICY "user_roles_delete" ON public.user_roles FOR DELETE TO authenticated
  USING (public.is_corpo_tecnico((SELECT auth.uid())));

-- ----------------------------------------------------------------------------
-- requerentes
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "requerentes_select_corpo_tecnico_provisorio" ON public.requerentes;
DROP POLICY IF EXISTS "requerentes_insert_corpo_tecnico_provisorio" ON public.requerentes;
DROP POLICY IF EXISTS "requerentes_update_corpo_tecnico_provisorio" ON public.requerentes;
DROP POLICY IF EXISTS "requerentes_delete_corpo_tecnico_provisorio" ON public.requerentes;

CREATE POLICY "requerentes_select" ON public.requerentes FOR SELECT TO authenticated
  USING (
    (public.is_corpo_tecnico((SELECT auth.uid())) OR public.is_tecnico((SELECT auth.uid())))
    AND deleted_at IS NULL
  );

CREATE POLICY "requerentes_insert" ON public.requerentes FOR INSERT TO authenticated
  WITH CHECK (public.is_corpo_tecnico((SELECT auth.uid())));

CREATE POLICY "requerentes_update" ON public.requerentes FOR UPDATE TO authenticated
  USING (public.is_corpo_tecnico((SELECT auth.uid())))
  WITH CHECK (public.is_corpo_tecnico((SELECT auth.uid())));

CREATE POLICY "requerentes_delete_blocked" ON public.requerentes FOR DELETE TO authenticated
  USING (false);  -- soft delete via deleted_at

-- ----------------------------------------------------------------------------
-- licencas
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "licencas_select_corpo_tecnico_or_tecnico" ON public.licencas;
DROP POLICY IF EXISTS "licencas_insert_corpo_tecnico" ON public.licencas;
DROP POLICY IF EXISTS "licencas_update_corpo_tecnico" ON public.licencas;
DROP POLICY IF EXISTS "licencas_delete_corpo_tecnico" ON public.licencas;

CREATE POLICY "licencas_select" ON public.licencas FOR SELECT TO authenticated
  USING (
    (public.is_corpo_tecnico((SELECT auth.uid())) OR public.is_tecnico((SELECT auth.uid())))
    AND deleted_at IS NULL
  );

CREATE POLICY "licencas_insert" ON public.licencas FOR INSERT TO authenticated
  WITH CHECK (public.is_corpo_tecnico((SELECT auth.uid())));

CREATE POLICY "licencas_update" ON public.licencas FOR UPDATE TO authenticated
  USING (public.is_corpo_tecnico((SELECT auth.uid())) AND deleted_at IS NULL)
  WITH CHECK (public.is_corpo_tecnico((SELECT auth.uid())));

CREATE POLICY "licencas_delete_blocked" ON public.licencas FOR DELETE TO authenticated
  USING (false);  -- soft delete

-- ----------------------------------------------------------------------------
-- contratos
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "contratos_select_corpo_tecnico_or_tecnico" ON public.contratos;
DROP POLICY IF EXISTS "contratos_insert_corpo_tecnico" ON public.contratos;
DROP POLICY IF EXISTS "contratos_update_corpo_tecnico" ON public.contratos;
DROP POLICY IF EXISTS "contratos_delete_corpo_tecnico" ON public.contratos;

CREATE POLICY "contratos_select" ON public.contratos FOR SELECT TO authenticated
  USING (
    deleted_at IS NULL
    AND (
      public.is_corpo_tecnico((SELECT auth.uid()))
      OR (
        public.is_tecnico((SELECT auth.uid()))
        AND tecnico_responsavel_id = public.current_usuario_id()
      )
    )
  );

CREATE POLICY "contratos_insert" ON public.contratos FOR INSERT TO authenticated
  WITH CHECK (public.is_corpo_tecnico((SELECT auth.uid())));

CREATE POLICY "contratos_update" ON public.contratos FOR UPDATE TO authenticated
  USING (public.is_corpo_tecnico((SELECT auth.uid())) AND deleted_at IS NULL)
  WITH CHECK (public.is_corpo_tecnico((SELECT auth.uid())));

CREATE POLICY "contratos_delete_blocked" ON public.contratos FOR DELETE TO authenticated
  USING (false);

-- ----------------------------------------------------------------------------
-- contrato_monitoramentos
-- ----------------------------------------------------------------------------

ALTER TABLE public.contrato_monitoramentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contrato_monitoramentos FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Corpo técnico can manage contrato_monitoramentos" ON public.contrato_monitoramentos;
DROP POLICY IF EXISTS "Allow read for authenticated" ON public.contrato_monitoramentos;

CREATE POLICY "contrato_monitoramentos_select" ON public.contrato_monitoramentos FOR SELECT TO authenticated
  USING (
    public.is_corpo_tecnico((SELECT auth.uid()))
    OR (
      public.is_tecnico((SELECT auth.uid()))
      AND EXISTS (
        SELECT 1 FROM public.contratos c 
        WHERE c.id = contrato_id 
          AND c.tecnico_responsavel_id = public.current_usuario_id()
      )
    )
  );

-- INSERT: corpo_tecnico OU via edge function de chatbot (service_role bypassa)
CREATE POLICY "contrato_monitoramentos_insert" ON public.contrato_monitoramentos FOR INSERT TO authenticated
  WITH CHECK (public.is_corpo_tecnico((SELECT auth.uid())));

CREATE POLICY "contrato_monitoramentos_update" ON public.contrato_monitoramentos FOR UPDATE TO authenticated
  USING (public.is_corpo_tecnico((SELECT auth.uid())))
  WITH CHECK (public.is_corpo_tecnico((SELECT auth.uid())));

CREATE POLICY "contrato_monitoramentos_delete" ON public.contrato_monitoramentos FOR DELETE TO authenticated
  USING (false);

-- ----------------------------------------------------------------------------
-- contrato_monitoramento_imagens
-- ----------------------------------------------------------------------------

ALTER TABLE public.contrato_monitoramento_imagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contrato_monitoramento_imagens FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read for authenticated" ON public.contrato_monitoramento_imagens;

CREATE POLICY "contrato_monitoramento_imagens_select" ON public.contrato_monitoramento_imagens FOR SELECT TO authenticated
  USING (
    public.is_corpo_tecnico((SELECT auth.uid()))
    OR public.is_tecnico((SELECT auth.uid()))
  );

CREATE POLICY "contrato_monitoramento_imagens_insert" ON public.contrato_monitoramento_imagens FOR INSERT TO authenticated
  WITH CHECK (public.is_corpo_tecnico((SELECT auth.uid())));

CREATE POLICY "contrato_monitoramento_imagens_delete" ON public.contrato_monitoramento_imagens FOR DELETE TO authenticated
  USING (public.is_corpo_tecnico((SELECT auth.uid())));

-- ----------------------------------------------------------------------------
-- contrato_nd_ne
-- ----------------------------------------------------------------------------

ALTER TABLE public.contrato_nd_ne ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contrato_nd_ne FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow corpo tecnico to manage nd_ne" ON public.contrato_nd_ne;
DROP POLICY IF EXISTS "Allow read for authenticated" ON public.contrato_nd_ne;

CREATE POLICY "contrato_nd_ne_select" ON public.contrato_nd_ne FOR SELECT TO authenticated
  USING (
    public.is_corpo_tecnico((SELECT auth.uid()))
    OR public.is_tecnico((SELECT auth.uid()))
  );

CREATE POLICY "contrato_nd_ne_insert" ON public.contrato_nd_ne FOR INSERT TO authenticated
  WITH CHECK (public.is_corpo_tecnico((SELECT auth.uid())));

CREATE POLICY "contrato_nd_ne_update" ON public.contrato_nd_ne FOR UPDATE TO authenticated
  USING (public.is_corpo_tecnico((SELECT auth.uid())))
  WITH CHECK (public.is_corpo_tecnico((SELECT auth.uid())));

CREATE POLICY "contrato_nd_ne_delete" ON public.contrato_nd_ne FOR DELETE TO authenticated
  USING (public.is_corpo_tecnico((SELECT auth.uid())));

-- ----------------------------------------------------------------------------
-- contrato_analises_fq
-- ----------------------------------------------------------------------------

ALTER TABLE public.contrato_analises_fq ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contrato_analises_fq FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow corpo tecnico to manage analises_fq" ON public.contrato_analises_fq;
DROP POLICY IF EXISTS "Allow read for authenticated" ON public.contrato_analises_fq;

CREATE POLICY "contrato_analises_fq_select" ON public.contrato_analises_fq FOR SELECT TO authenticated
  USING (
    public.is_corpo_tecnico((SELECT auth.uid()))
    OR public.is_tecnico((SELECT auth.uid()))
  );

CREATE POLICY "contrato_analises_fq_insert" ON public.contrato_analises_fq FOR INSERT TO authenticated
  WITH CHECK (public.is_corpo_tecnico((SELECT auth.uid())));

CREATE POLICY "contrato_analises_fq_update" ON public.contrato_analises_fq FOR UPDATE TO authenticated
  USING (public.is_corpo_tecnico((SELECT auth.uid())))
  WITH CHECK (public.is_corpo_tecnico((SELECT auth.uid())));

CREATE POLICY "contrato_analises_fq_delete" ON public.contrato_analises_fq FOR DELETE TO authenticated
  USING (public.is_corpo_tecnico((SELECT auth.uid())));

-- ----------------------------------------------------------------------------
-- notificacoes
-- ----------------------------------------------------------------------------

ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificacoes FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see their own notifications" ON public.notificacoes;
DROP POLICY IF EXISTS "Allow read for authenticated" ON public.notificacoes;

CREATE POLICY "notificacoes_select_owner" ON public.notificacoes FOR SELECT TO authenticated
  USING (usuario_id = public.current_usuario_id());

-- INSERT só via SECURITY DEFINER trigger ou edge function — bloqueado para clientes
CREATE POLICY "notificacoes_insert_blocked" ON public.notificacoes FOR INSERT TO authenticated
  WITH CHECK (false);

-- UPDATE: usuário marca como lida (campo `lida`); SECURITY DEFINER no app filtra os campos editáveis
CREATE POLICY "notificacoes_update_owner" ON public.notificacoes FOR UPDATE TO authenticated
  USING (usuario_id = public.current_usuario_id())
  WITH CHECK (usuario_id = public.current_usuario_id());

CREATE POLICY "notificacoes_delete_owner" ON public.notificacoes FOR DELETE TO authenticated
  USING (usuario_id = public.current_usuario_id());

-- ----------------------------------------------------------------------------
-- user_invitations
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "user_invitations_select" ON public.user_invitations;

-- Corpo Técnico vê todos os convites (gerencia o pipeline)
CREATE POLICY "user_invitations_select_corpo_tecnico" ON public.user_invitations FOR SELECT TO authenticated
  USING (public.is_corpo_tecnico((SELECT auth.uid())));

-- INSERT/UPDATE/DELETE: corpo_tecnico
CREATE POLICY "user_invitations_insert" ON public.user_invitations FOR INSERT TO authenticated
  WITH CHECK (public.is_corpo_tecnico((SELECT auth.uid())));

CREATE POLICY "user_invitations_update" ON public.user_invitations FOR UPDATE TO authenticated
  USING (public.is_corpo_tecnico((SELECT auth.uid())))
  WITH CHECK (public.is_corpo_tecnico((SELECT auth.uid())));

CREATE POLICY "user_invitations_delete" ON public.user_invitations FOR DELETE TO authenticated
  USING (public.is_corpo_tecnico((SELECT auth.uid())));

-- Anon: já existe RPC get_invitation_by_token_public criada no Sprint 0a (003)

-- ----------------------------------------------------------------------------
-- Verificação final
-- ----------------------------------------------------------------------------

DO $$
DECLARE
  rls_disabled_count INT;
  table_name TEXT;
BEGIN
  SELECT COUNT(*) INTO rls_disabled_count
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind = 'r'
    AND c.relname NOT LIKE 'pg_%'
    AND c.relname NOT LIKE '_prisma%'
    AND c.relrowsecurity = false;
  
  IF rls_disabled_count > 0 THEN
    RAISE WARNING 'Ainda existem % tabelas em public sem RLS:', rls_disabled_count;
    FOR table_name IN 
      SELECT c.relname FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relkind = 'r'
        AND c.relrowsecurity = false
    LOOP
      RAISE WARNING '  - %', table_name;
    END LOOP;
  END IF;
  
  RAISE NOTICE 'Migration 014 (policies definitivas) concluída.';
END $$;
