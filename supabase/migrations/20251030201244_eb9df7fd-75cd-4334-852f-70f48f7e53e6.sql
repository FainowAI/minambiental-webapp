-- Ajustar Foreign Key de licencas.requerente_id para referenciar usuarios
ALTER TABLE public.licencas 
DROP CONSTRAINT IF EXISTS licencas_requerente_id_fkey;

ALTER TABLE public.licencas 
ADD CONSTRAINT licencas_requerente_id_fkey 
FOREIGN KEY (requerente_id) 
REFERENCES public.usuarios(id) 
ON DELETE CASCADE;

COMMENT ON COLUMN public.licencas.requerente_id IS 
'Referência ao usuário requerente (perfil Requerente) na tabela usuarios';