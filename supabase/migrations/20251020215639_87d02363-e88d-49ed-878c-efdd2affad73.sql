-- Fix security warnings for user invitations functions

-- Fix generate_invitation_token() - add search_path
CREATE OR REPLACE FUNCTION public.generate_invitation_token()
RETURNS VARCHAR
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Fix check_cpf_duplicate() - add search_path
CREATE OR REPLACE FUNCTION public.check_cpf_duplicate()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.profiles WHERE cpf = NEW.cpf) THEN
    RAISE EXCEPTION 'CPF já cadastrado no sistema';
  END IF;
  RETURN NEW;
END;
$$;