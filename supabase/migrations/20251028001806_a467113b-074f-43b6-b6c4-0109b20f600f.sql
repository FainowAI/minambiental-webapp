-- Migration: Configurar RLS e trigger para fluxo de cadastro com aprovação

-- 1. Remover policy antiga se existir e criar nova para permitir INSERT anônimo
DROP POLICY IF EXISTS "Allow signup insert into usuarios" ON public.usuarios;

CREATE POLICY "Allow signup insert into usuarios"
ON public.usuarios
FOR INSERT
TO anon
WITH CHECK (auth_user_id IS NOT NULL);

-- 2. Tentar criar trigger no auth.users (pode falhar se Supabase não permitir, mas não afeta o funcionamento)
DO $$
BEGIN
  -- Verificar se o trigger já existe
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created'
  ) THEN
    -- Criar trigger para inserir em usuarios quando email for confirmado
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT OR UPDATE ON auth.users
      FOR EACH ROW 
      WHEN (
        NEW.email_confirmed_at IS NOT NULL 
        AND (OLD IS NULL OR OLD.email_confirmed_at IS NULL)
      )
      EXECUTE FUNCTION public.handle_new_user();
  END IF;
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE 'Sem permissão para criar trigger no schema auth (esperado). A inserção será feita via código.';
  WHEN OTHERS THEN
    RAISE NOTICE 'Erro ao criar trigger: %. A inserção será feita via código.', SQLERRM;
END $$;

-- 3. Comentário explicativo
COMMENT ON POLICY "Allow signup insert into usuarios" ON public.usuarios IS 
'Permite que usuários não autenticados (anon) insiram registros durante o signup, desde que forneçam auth_user_id';
