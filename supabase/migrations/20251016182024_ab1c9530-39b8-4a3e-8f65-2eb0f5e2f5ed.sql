-- Enable RLS on existing tables
ALTER TABLE public.analises_agua ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contratos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.licencas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monitoramentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pessoas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- RLS Policies for licencas
CREATE POLICY "Users can view their own licencas"
  ON public.licencas
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all licencas"
  ON public.licencas
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for monitoramentos
CREATE POLICY "Users can view their own monitoramentos"
  ON public.monitoramentos
  FOR SELECT
  USING (usuario_id = auth.uid());

CREATE POLICY "Users can insert their own monitoramentos"
  ON public.monitoramentos
  FOR INSERT
  WITH CHECK (usuario_id = auth.uid());

CREATE POLICY "Admins can manage all monitoramentos"
  ON public.monitoramentos
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for notificacoes
CREATE POLICY "Users can view their own notificacoes"
  ON public.notificacoes
  FOR SELECT
  USING (usuario_id = auth.uid());

CREATE POLICY "Admins can manage all notificacoes"
  ON public.notificacoes
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for pessoas
CREATE POLICY "Authenticated users can view pessoas"
  ON public.pessoas
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage all pessoas"
  ON public.pessoas
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for analises_agua
CREATE POLICY "Authenticated users can view analises"
  ON public.analises_agua
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage all analises"
  ON public.analises_agua
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for contratos
CREATE POLICY "Authenticated users can view contratos"
  ON public.contratos
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage all contratos"
  ON public.contratos
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for usuarios (legacy table - read only)
CREATE POLICY "No access to legacy usuarios table"
  ON public.usuarios
  FOR ALL
  USING (false);