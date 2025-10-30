-- Adicionar enum para prioridade
CREATE TYPE prioridade_licenca AS ENUM ('URGENTE', 'ALTA', 'MÉDIA', 'BAIXA');

-- Adicionar coluna prioridade na tabela licencas
ALTER TABLE public.licencas 
ADD COLUMN prioridade prioridade_licenca DEFAULT 'MÉDIA';

-- Adicionar comentário explicativo
COMMENT ON COLUMN public.licencas.prioridade IS 
'Prioridade da licença: URGENTE, ALTA, MÉDIA ou BAIXA';

-- Criar índice para melhorar performance em buscas
CREATE INDEX idx_licencas_prioridade ON public.licencas(prioridade);