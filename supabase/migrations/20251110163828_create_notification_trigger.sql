-- Função para criar notificações quando uma apuração mensal é realizada
CREATE OR REPLACE FUNCTION public.create_apuracao_notifications()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requerente_nome TEXT;
  corpo_tecnico_user RECORD;
BEGIN
  -- Buscar o nome do requerente através da licença
  SELECT u.nome INTO requerente_nome
  FROM public.licencas l
  INNER JOIN public.usuarios u ON l.requerente_id = u.id
  WHERE l.id = NEW.licenca_id;

  -- Se não encontrou o requerente, usar um valor padrão
  IF requerente_nome IS NULL THEN
    requerente_nome := 'Contrato';
  END IF;

  -- Buscar todos os usuários do corpo técnico
  FOR corpo_tecnico_user IN
    SELECT DISTINCT u.auth_user_id
    FROM public.usuarios u
    WHERE u.perfil = 'Corpo Técnico'
      AND u.status = 'Ativo'
      AND u.status_aprovacao = 'Aprovado'
      AND u.auth_user_id IS NOT NULL
  LOOP
    -- Criar notificação para cada usuário do corpo técnico
    -- O campo usuario_id na tabela notificacoes referencia auth.users(id)
    INSERT INTO public.notificacoes (
      usuario_id,
      licenca_id,
      tipo,
      titulo,
      mensagem,
      lida,
      data_envio
    ) VALUES (
      corpo_tecnico_user.auth_user_id,
      NEW.licenca_id,
      'apuracao_mensal',
      'Nova Apuração Mensal',
      'Apuração do hidrômetro e horímetro do mês para o contrato de ' || requerente_nome || ' disponível. Clique aqui para realizar a apuração.',
      false,
      NOW()
    );
  END LOOP;

  RETURN NEW;
END;
$$;

-- Criar trigger que executa a função após inserção em monitoramentos
CREATE TRIGGER trigger_create_apuracao_notifications
  AFTER INSERT ON public.monitoramentos
  FOR EACH ROW
  EXECUTE FUNCTION public.create_apuracao_notifications();

-- Função para remover notificações quando o corpo técnico realiza a apuração do mês
CREATE OR REPLACE FUNCTION public.remove_apuracao_notifications()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  usuario_perfil TEXT;
BEGIN
  -- Verificar se o usuário que criou o monitoramento é do corpo técnico
  -- NEW.usuario_id é auth.uid() (UUID do Supabase Auth), não o ID da tabela usuarios
  SELECT u.perfil INTO usuario_perfil
  FROM public.usuarios u
  WHERE u.auth_user_id = NEW.usuario_id;

  -- Se for corpo técnico, remover notificações relacionadas à mesma licença/mês/ano
  IF usuario_perfil = 'Corpo Técnico' THEN
    DELETE FROM public.notificacoes
    WHERE licenca_id = NEW.licenca_id
      AND tipo = 'apuracao_mensal'
      AND EXTRACT(MONTH FROM created_at) = NEW.mes
      AND EXTRACT(YEAR FROM created_at) = NEW.ano;
  END IF;

  RETURN NEW;
END;
$$;

-- Criar trigger que remove notificações quando corpo técnico realiza apuração
CREATE TRIGGER trigger_remove_apuracao_notifications
  AFTER INSERT ON public.monitoramentos
  FOR EACH ROW
  EXECUTE FUNCTION public.remove_apuracao_notifications();

