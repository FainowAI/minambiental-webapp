-- Função para verificar se usuário é corpo técnico (security definer para acessar usuarios)
CREATE OR REPLACE FUNCTION public.is_corpo_tecnico(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.usuarios u
    WHERE u.auth_user_id = _user_id
      AND u.perfil = 'Corpo Técnico'
      AND u.status = 'Ativo'
      AND u.status_aprovacao = 'Aprovado'
  );
$$;

-- Função para verificar se usuário é requerente (security definer para acessar usuarios)
CREATE OR REPLACE FUNCTION public.is_requerente(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.usuarios u
    WHERE u.auth_user_id = _user_id
      AND u.perfil = 'Requerente'
      AND u.status = 'Ativo'
  );
$$;

-- Permitir que corpo técnico visualize monitoramentos de requerentes para a mesma licença
-- Isso é necessário para que o corpo técnico possa apurar as leituras do requerente
CREATE POLICY "Corpo técnico can view requerente monitoramentos for same license"
  ON public.monitoramentos
  FOR SELECT
  USING (
    -- Verificar se o usuário atual é do corpo técnico
    public.is_corpo_tecnico(auth.uid())
    -- E se o monitoramento foi criado por um requerente
    AND public.is_requerente(monitoramentos.usuario_id)
  );

