-- Permitir NULL em auth_user_id para Requerentes sem Auth User
-- Isso permite que Requerentes sejam criados sem um usuário de autenticação
ALTER TABLE public.usuarios 
ALTER COLUMN auth_user_id DROP NOT NULL;

-- Adicionar comentário explicativo
COMMENT ON COLUMN public.usuarios.auth_user_id IS 
'ID do Auth User. NULL para Requerentes que não possuem acesso ao sistema.';