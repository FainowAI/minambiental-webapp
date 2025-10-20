-- Migration: create_user_invitations_system
-- Descrição: Sistema de convites de usuários com roles específicas

-- 1. Criar Enum para Status do Convite
CREATE TYPE public.invitation_status AS ENUM ('pending', 'accepted', 'expired');

-- 2. Criar Enum para Perfis de Usuário (separado de app_role)
CREATE TYPE public.user_profile AS ENUM ('corpo_tecnico', 'tecnico', 'requerente');

-- 3. Criar Tabela user_invitations
CREATE TABLE public.user_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  nome VARCHAR(255) NOT NULL,
  cpf VARCHAR(14) NOT NULL UNIQUE,
  celular VARCHAR(20),
  perfil user_profile NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status invitation_status NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  
  -- Constraints
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT valid_cpf CHECK (cpf ~ '^\d{3}\.\d{3}\.\d{3}-\d{2}$')
);

-- 4. Criar Índices para Performance
CREATE INDEX idx_user_invitations_email ON public.user_invitations(email);
CREATE INDEX idx_user_invitations_token ON public.user_invitations(token);
CREATE INDEX idx_user_invitations_status ON public.user_invitations(status);
CREATE INDEX idx_user_invitations_cpf ON public.user_invitations(cpf);
CREATE INDEX idx_user_invitations_status_expires ON public.user_invitations(status, expires_at);

-- Evita múltiplos convites pendentes para o mesmo email
CREATE UNIQUE INDEX idx_unique_pending_email 
ON public.user_invitations(email) 
WHERE status = 'pending';

-- 5. Adicionar Coluna invitation_id na Tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN invitation_id UUID REFERENCES public.user_invitations(id) ON DELETE SET NULL;

CREATE INDEX idx_profiles_invitation_id ON public.profiles(invitation_id);

-- 6. Função para Gerar Token Único (texto plano, URL-safe)
CREATE OR REPLACE FUNCTION public.generate_invitation_token()
RETURNS VARCHAR
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_token VARCHAR;
  token_exists BOOLEAN;
BEGIN
  LOOP
    -- Gera token: base64url de 32 bytes aleatórios (43 caracteres)
    new_token := encode(gen_random_bytes(32), 'base64');
    -- Remove caracteres não URL-safe
    new_token := replace(replace(replace(new_token, '+', '-'), '/', '_'), '=', '');
    
    -- Verifica se o token já existe
    SELECT EXISTS(
      SELECT 1 FROM public.user_invitations WHERE token = new_token
    ) INTO token_exists;
    
    EXIT WHEN NOT token_exists;
  END LOOP;
  
  RETURN new_token;
END;
$$;

-- 7. Trigger para Auto-preencher Token e Expires_at (7 dias)
CREATE OR REPLACE FUNCTION public.handle_new_invitation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Gera token se não fornecido
  IF NEW.token IS NULL OR NEW.token = '' THEN
    NEW.token := public.generate_invitation_token();
  END IF;
  
  -- Define expiração para 7 dias se não fornecido
  IF NEW.expires_at IS NULL THEN
    NEW.expires_at := NOW() + INTERVAL '7 days';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_invitation_created
  BEFORE INSERT ON public.user_invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_invitation();

-- 8. Trigger para Updated_at
CREATE TRIGGER update_user_invitations_updated_at
  BEFORE UPDATE ON public.user_invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 9. Função para Expirar Convites Automaticamente
CREATE OR REPLACE FUNCTION public.expire_old_invitations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.user_invitations
  SET status = 'expired'
  WHERE status = 'pending'
    AND expires_at < NOW();
END;
$$;

-- 10. Função Security Definer para Validar Token
CREATE OR REPLACE FUNCTION public.get_invitation_by_token(token VARCHAR)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invitation RECORD;
BEGIN
  SELECT id, email, nome, cpf, celular, perfil, status, expires_at
  INTO invitation
  FROM public.user_invitations
  WHERE user_invitations.token = get_invitation_by_token.token
    AND status = 'pending'
    AND expires_at > NOW();
    
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  
  RETURN row_to_json(invitation);
END;
$$;

-- 11. Função para Aceitar Convite (Security Definer)
CREATE OR REPLACE FUNCTION public.accept_invitation(
  invitation_token VARCHAR,
  user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invitation_record RECORD;
BEGIN
  -- Busca o convite
  SELECT * INTO invitation_record
  FROM public.user_invitations
  WHERE token = invitation_token
    AND status = 'pending'
    AND expires_at > NOW()
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Convite inválido, expirado ou já aceito'
    );
  END IF;
  
  -- Atualiza o convite
  UPDATE public.user_invitations
  SET 
    status = 'accepted',
    accepted_at = NOW()
  WHERE id = invitation_record.id;
  
  -- Atualiza o perfil do usuário
  UPDATE public.profiles
  SET 
    invitation_id = invitation_record.id,
    nome = invitation_record.nome,
    cpf = invitation_record.cpf,
    celular = invitation_record.celular
  WHERE id = user_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'invitation_id', invitation_record.id,
    'perfil', invitation_record.perfil
  );
END;
$$;

-- 12. Trigger para Evitar CPF Duplicado
CREATE OR REPLACE FUNCTION public.check_cpf_duplicate()
RETURNS TRIGGER 
LANGUAGE plpgsql
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.profiles WHERE cpf = NEW.cpf) THEN
    RAISE EXCEPTION 'CPF já cadastrado no sistema';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER check_invitation_cpf_duplicate
BEFORE INSERT ON public.user_invitations
FOR EACH ROW
EXECUTE FUNCTION public.check_cpf_duplicate();

-- 13. Habilitar RLS
ALTER TABLE public.user_invitations ENABLE ROW LEVEL SECURITY;

-- 14. Políticas RLS
CREATE POLICY "Admins can manage all invitations"
ON public.user_invitations
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their sent invitations"
ON public.user_invitations
FOR SELECT
TO authenticated
USING (invited_by = auth.uid());

CREATE POLICY "Anyone can view invitation by token"
ON public.user_invitations
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Only admins can create invitations"
ON public.user_invitations
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins and creators can update invitations"
ON public.user_invitations
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') 
  OR invited_by = auth.uid()
);

-- 15. Comentários
COMMENT ON TABLE public.user_invitations IS 'Sistema de convites de usuários com roles: corpo_tecnico, tecnico, requerente';
COMMENT ON COLUMN public.user_invitations.token IS 'Token único em texto plano para aceitar convite (URL-safe)';
COMMENT ON COLUMN public.user_invitations.expires_at IS 'Convite expira em 7 dias após criação';
COMMENT ON TYPE public.user_profile IS 'Perfis de usuário: corpo_tecnico, tecnico, requerente';